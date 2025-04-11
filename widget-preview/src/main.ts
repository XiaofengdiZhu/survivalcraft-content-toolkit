import {createApp, ref, shallowReactive, shallowRef} from "vue";
import "./style.css";
import "./monaco.css";
import App from "./App.vue";
import {createComponentFromString} from "./WidgetManager.ts";
import {type AttributeNode, type ComponentNode, type ElementNode, ElementTypes, Namespaces, NodeTypes, type SourceLocation} from "@vue/compiler-core";
import {parse} from "@vue/compiler-dom";

const vscode = (globalThis as any).acquireVsCodeApi?.();

function getState(...args: string[]) {
    let state = vscode?.getState();
    if (!state) {
        const temp = localStorage.getItem("SCT");
        if (temp) {
            state = JSON.parse(temp);
        }
    }
    if (state) {
        for (let i = 0; i < args.length; i++) {
            state = state[args[i]];
            if (!state) {
                return null;
            }
        }
        return state;
    }
    return null;
}

export function setState(value: any, ...args: string[]) {
    let originalState = getState();
    if (!originalState) {
        originalState = {};
    }
    let state = originalState;
    if (state) {
        for (let i = 0; i < args.length - 1; i++) {
            const arg = args[i];
            const temp = state[arg];
            if (!temp) {
                state[arg] = {};
                state = state[arg];
            }
        }
        const lastArg = args[args.length - 1];
        if (state[lastArg] !== value) {
            state[lastArg] = value;
        }
        localStorage.setItem("SCT", JSON.stringify(originalState));
        vscode?.setState(originalState);
    }
}

interface Message {
    title: string;
    type: string;
    content?: any;
}

class Style {
    name: string;
    node: ElementNode;
    prepared = false;

    constructor(name: string, node: ElementNode) {
        this.name = name;
        this.node = node;
    }
}

export const widgetToPreview = shallowRef<{
    name: string,
    content: string
} | null>(null);
export const allStyles: Map<string, Style> = new Map();
export const languageNames = ref<{
    [key: string]: string
}>({});
export const languageSelected = ref<string>(getState("languageSelected") ?? globalThis.navigator.language.toLowerCase() ?? "en-us");
export const languageStrings = shallowReactive<Map<string, any>>(new Map());
export const fontNames = ref<string[]>([]);
export const fontSelected = ref<string>(getState("fontSelected") ?? "system-ui");
export let atlasDefinition: any = {};
export let buttonClickAudio: AudioArrayBufferPlayer | null = null;

window.addEventListener("message", event => {
    const message = event.data as Message;
    //console.log(message);
    switch (message.type) {
        case "widgetToPreview": {
            if (message.title && message.content) {
                setState(message.title, "fsPath");
                cookStyles(message.content.styles);
                widgetToPreview.value = {
                    name: extractFileName(message.title), content: message.content.toPreview
                };
            }
            break;
        }
        case "languageNames": {
            if (message.content) {
                languageNames.value = message.content;
                requestLanguageStrings(languageSelected.value);
            }
            break;
        }
        case "languageStrings": {
            if (message.title && message.content && typeof message.content === "object" && !Array.isArray(
                message.content)) {
                languageSelected.value = message.title;
                languageStrings.set(message.title, message.content);
                setState(message.title, "languageSelected");
                vscode?.postMessage({
                    type: "report", title: "allInitialized"
                });
                setTimeout(() => {
                    const fsPath = getState("fsPath");
                    if (fsPath && widgetToPreview.value === null) {
                        vscode?.postMessage({
                            type: "request", title: "widgetToPreview", content: fsPath
                        });
                    }
                }, 500);
            }
            break;
        }
        case "fontNames": {
            if (message.content && Array.isArray(message.content)) {
                fontNames.value = message.content;
                if (fontSelected.value !== "system-ui" && !message.content.includes(fontSelected.value)) {
                    fontSelected.value = "system-ui";
                    setState("system-ui", "fontSelected");
                }
                else {
                    setState(fontSelected.value, "fontSelected");
                }
            }
            break;
        }
        case "widgetString": {
            if (message.title && message.content && typeof message.content === "string") {
                createComponentFromString(extractFileName(message.title), message.content);
            }
            break;
        }
        case "atlasDefinition": {
            if (message.content) {
                atlasDefinition = message.content as any;
            }
            break;
        }
        case "imageFile": {
            if (message.title && message.content) {
                createImageBitmap(new Blob([message.content]),
                    {premultiplyAlpha: "none", colorSpaceConversion: "none"})
                .then(bitmap => {
                    const handler = responseHandlers.get(message.title);
                    if (handler) {
                        handler(null, bitmap);
                        responseHandlers.delete(message.title);
                    }
                });
            }
            break;
        }
        case "audioFile": {
            if (message.title && message.content) {
                if (message.title === "buttonClickAudio") {
                    buttonClickAudio = new AudioArrayBufferPlayer(message.content);
                }
            }
            break;
        }
        case "report": {
            switch (message.title) {
                case "noLanguageNames":
                case "noLanguageStrings": {
                    vscode?.postMessage({
                        type: "report", title: "allInitialized"
                    });
                    setTimeout(() => {
                        const fsPath = getState("fsPath");
                        if (fsPath && widgetToPreview.value === null) {
                            vscode?.postMessage({
                                type: "request", title: "widgetToPreview", content: fsPath
                            });
                        }
                    }, 300);
                    break;
                }
                case "getFileFailed": {
                    if (typeof message.content === "string") {
                        const handler = responseHandlers.get(message.content);
                        if (handler) {
                            handler(new Error("GetFileFailed"));
                            responseHandlers.delete(message.content);
                        }
                    }
                    break;
                }
            }
            break;
        }
    }
});

export function requestLanguageStrings(languageName: string) {
    if (languageNames.value[languageName]) {
        vscode?.postMessage({
            type: "request", title: "languageStrings", content: languageName
        });
    }
}

export function requestWidgetString(fsPath: string) {
    vscode?.postMessage({
        type: "request", title: "widgetString", content: fsPath
    });
}

type ResponseCallback = (error: Error | null, data?: ImageBitmap) => void;
const responseHandlers: Map<string, ResponseCallback> = new Map();
const cachedImageBitmaps = new Map<string, ImageBitmap | null>();

export function getImageBitmap(fsPath: string,
    refreshCache: boolean = false): Promise<ImageBitmap | null> {
    return new Promise((resolve, reject) => {
        const cachedImageBitmap = cachedImageBitmaps.get(fsPath);
        if (refreshCache) {
            if (cachedImageBitmap !== undefined) {
                if (cachedImageBitmap !== null) {
                    cachedImageBitmap.close();
                }
                cachedImageBitmaps.delete(fsPath);
            }
        }
        else if (cachedImageBitmap === null) {
            let times = 0;
            const interval = setInterval(() => {
                const cachedImageBitmap1 = cachedImageBitmaps.get(fsPath);
                if (cachedImageBitmap1 === undefined) {
                    clearInterval(interval);
                    reject(new Error("GetFileFailed"));
                    return;
                }
                else if (cachedImageBitmap1 !== null) {
                    clearInterval(interval);
                    resolve(cachedImageBitmap1);
                    return;
                }
                if (++times > 10) {
                    clearInterval(interval);
                    reject(new Error("Timeout"));
                }
            }, 100);
            return;
        }
        else if (cachedImageBitmap !== undefined) {
            resolve(cachedImageBitmap);
            return;
        }
        const requestId = generateRequestId();
        const timeout = setTimeout(() => {
            responseHandlers.delete(requestId);
            cachedImageBitmaps.delete(fsPath);
            reject(new Error("Timeout"));
        }, 1000);
        cachedImageBitmaps.set(fsPath, null);
        responseHandlers.set(requestId, (error, data) => {
            clearTimeout(timeout);
            if (error) {
                reject(error);
            }
            else {
                cachedImageBitmaps.set(fsPath, data ?? null);
                resolve(data ?? null);
            }
        });
        requestImage(fsPath, requestId);
    });
}

function requestImage(fsPath: string, requestId: string) {
    vscode?.postMessage({
        type: "request", title: "imageFile", content: {fsPath: fsPath, requestId: requestId}
    });
}

function generateRequestId() {
    return Math.random().toString(36).slice(2, 15);
}

function extractFileName(fsPath: string) {
    const fileNameWithExtension = fsPath.slice(Math.max(fsPath.lastIndexOf("/"),
        fsPath.lastIndexOf("\\")) + 1);
    const extension = fileNameWithExtension.includes(".") ?
        fileNameWithExtension.slice(fileNameWithExtension.lastIndexOf(".")) :
        "";
    return extension ? fileNameWithExtension.slice(0, -extension.length) : fileNameWithExtension;
}

const app = createApp(App);
app.config.warnHandler = function (msg, _instance, _trace) {
    throw new Error(`[Vue warn]: ${msg}`);
};
app.mount("#app");

if (vscode) {
    vscode.setState(vscode.getState());
    vscode.postMessage({type: "report", title: "webviewInitialized"});
}

function cookStyles(styles: any) {
    const cookingStyles: Style[] = [];
    for (const [styleName, styleString] of Object.entries(styles)) {
        if (!allStyles.has(styleName)) {
            const node = parse(styleString as string).children[0];
            if (node && node.type === NodeTypes.ELEMENT) {
                const style = new Style(styleName, node);
                cookingStyles.push(style);
                allStyles.set(styleName, style);
            }
        }
    }
    const cookNode = (node: ElementNode, style: Style) => {
        let styleName: string | undefined;
        for (const prop of node.props) {
            if (prop.type === NodeTypes.ATTRIBUTE && prop.name === "Style") {
                styleName = prop.value?.content.replace("{", "").replace("}", "");
            }
        }
        if (styleName) {
            const referredStyle = allStyles.get(styleName);
            if (referredStyle) {
                if (!referredStyle.prepared) {
                    cookStyle(referredStyle);
                }
                applyStyleToNode(referredStyle, node);
            }
        }
        for (const child of node.children) {
            if (child.type === NodeTypes.ELEMENT) {
                cookNode(child, style);
            }
        }
    };
    const cookStyle = (style: Style) => {
        if (!style.prepared) {
            cookNode(style.node, style);
            style.prepared = true;
        }
    };
    for (const style of cookingStyles) {
        if (!style.prepared) {
            cookStyle(style);
        }
    }
}

const emptyLoc: SourceLocation = {
    start: {
        offset: 0, line: 0, column: 0
    }, end: {
        offset: 0, line: 0, column: 0
    }, source: ""
};

export function createAttributeNode(name: string, value: string): AttributeNode {
    return {
        name: name, type: NodeTypes.ATTRIBUTE, value: {
            type: NodeTypes.TEXT, content: value, loc: emptyLoc
        }, nameLoc: emptyLoc, loc: emptyLoc
    };
}

export function applyStyleToNode(style: Style, node: ElementNode) {
    if (!style.prepared || node.tag !== style.node.tag) {
        return;
    }
    for (const styleProp of style.node.props) {
        if (styleProp.type === NodeTypes.ATTRIBUTE && styleProp.value?.content && !node.props.some(
            prop => prop.name === styleProp.name)) {
            node.props.push(createAttributeNode(styleProp.name, styleProp.value.content));
        }
    }
    const overrides: Map<string, Map<string, string>> = new Map();
    const nodeName2Node: Map<string, ElementNode> = new Map();
    for (const nodeChild of node.children) {
        if (nodeChild.type === NodeTypes.ELEMENT) {
            const attributes: Map<string, string> = new Map();
            for (const prop of nodeChild.props) {
                if (prop.type === NodeTypes.ATTRIBUTE && prop.value?.content) {
                    if (prop.name === "Name") {
                        overrides.set(prop.value.content, attributes);
                        nodeName2Node.set(prop.value.content, nodeChild);
                    }
                    else {
                        attributes.set(prop.name, prop.value.content);
                    }
                }
            }
        }
    }
    const cloneNode = (node: ElementNode): ElementNode => {
        const result: ComponentNode = {
            type: NodeTypes.ELEMENT,
            ns: Namespaces.HTML,
            tag: node.tag,
            tagType: ElementTypes.COMPONENT,
            props: [],
            children: [],
            codegenNode: undefined,
            loc: emptyLoc
        };
        let override: Map<string, string> | undefined;
        for (const prop of node.props) {
            if (prop.type === NodeTypes.ATTRIBUTE && prop.name === "Name" && prop.value?.content) {
                override = overrides.get(prop.value.content);
                if (override) {
                    const nodeToRemove = nodeName2Node.get(prop.value.content);
                    if (nodeToRemove) {
                        node.children.splice(node.children.indexOf(nodeToRemove), 1);
                        nodeName2Node.delete(prop.value.content);
                    }
                }
            }
        }
        for (const prop of node.props) {
            if (prop.type === NodeTypes.ATTRIBUTE && prop.value?.content) {
                result.props.push(createAttributeNode(prop.name,
                    override?.get(prop.name) ?? prop.value.content));
            }
        }
        for (const child of node.children) {
            if (child.type === NodeTypes.ELEMENT && child.tagType === ElementTypes.COMPONENT) {
                result.children.push(cloneNode(child));
            }
        }
        return result;
    };
    for (const styleChild of style.node.children) {
        if (styleChild.type === NodeTypes.ELEMENT) {
            node.children.push(cloneNode(styleChild));
        }
    }
}

class AudioArrayBufferPlayer {
    audioContext: AudioContext = new AudioContext();
    audioBuffer?: AudioBuffer;

    constructor(arrayBuffer: ArrayBuffer) {
        this.audioContext.decodeAudioData(arrayBuffer).then(audioBuffer => {
            this.audioBuffer = audioBuffer;
        });
    }

    play() {
        if (this.audioBuffer) {
            const source = this.audioContext.createBufferSource();
            source.buffer = this.audioBuffer;
            source.connect(this.audioContext.destination);
            source.start();
            source.onended = () => {
                source.disconnect();
            };
        }
    }
}
