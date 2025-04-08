import * as vscode from 'vscode';
import * as fs from 'fs';
import { allLanguages, languageName2Native } from '../common/languageDiagnostics';
import * as path from 'path';

export let webviewPanel: vscode.WebviewPanel | null;
let previewBaseUri: vscode.Uri;
let subscriptions: vscode.Disposable[];
let previewHtml: string | undefined;
let widgetPreviewDistUri: vscode.Uri | undefined;
export function initeWidgetsCommands(context: vscode.ExtensionContext) {
    previewBaseUri = vscode.Uri.joinPath(context.extensionUri, 'widget-preview', 'dist');
    subscriptions = context.subscriptions;
    subscriptions.push(vscode.commands.registerCommand('survivalcraft-content-toolkit.previewWidget.start', startPreview));
    subscriptions.push(vscode.commands.registerCommand('survivalcraft-content-toolkit.previewWidget.inspect', inspect));
    vscode.window.registerWebviewPanelSerializer('sctWidgetPreview', new WidgetsSerializer());
    widgetPreviewDistUri = vscode.Uri.joinPath(context.extensionUri, 'widget-preview', 'dist');
}

function startPreview(args: any) {
    const fsPath = args?.fsPath;
    if (fsPath) {
        const fileName = fsPath.split(/[\\/]/).pop();
        if (webviewPanel) {
            requestPreviewWidget(fsPath);
            webviewPanel.title = fileName;
        } else {
            createWebviewPanel(fileName, fsPath);
        }
        webviewPanel?.reveal();
    }
}

const sentStyles: Map<string, string> = new Map();
const StyleAttributePattern = / Style="\{([^\}"]*)\}"/g;
let isRequestingPreviewWidget = false;

function requestPreviewWidget(fsPath: string) {
    isRequestingPreviewWidget = true;
    readTextFileDirectly(fsPath).then(widgetToPreview => {
        getStylesToBeSent(widgetToPreview).then(styleToBeSent => {
            webviewPanel?.webview.postMessage({
                type: "widgetToPreview",
                title: fsPath,
                content: { toPreview: widgetToPreview, styles: styleToBeSent }
            });
            isRequestingPreviewWidget = false;
        });
    }).catch(error => {
        vscode.window.showErrorMessage(vscode.l10n.t("commands.cannotLoadFile", fsPath, error.message));
    });
}

function getStylesToBeSent(widgetToPreview: string) {
    return new Promise<any>(async resolve => {
        const styleToBeSent = {} as any;
        const styleNames = [...widgetToPreview.matchAll(StyleAttributePattern)].map(match => match[1]).filter(fsPath => !sentStyles.has(fsPath));
        const callback = () => {
            if (styleNames.length === 0) {
                resolve(styleToBeSent);
                return;
            }
            const styleName = styleNames.shift();
            if (!styleName) {
                resolve(styleToBeSent);
                return;
            }
            if (sentStyles.has(styleName)) {
                callback();
                return;
            }
            readTextFileFromContentDirectories(styleName + ".xml").then(styleString => {
                sentStyles.set(styleName, styleString);
                styleToBeSent[styleName] = styleString;
                const styleNamesInStyle = [...styleString.matchAll(StyleAttributePattern)].map(match => match[1]).filter(fsPath => !sentStyles.has(fsPath));
                if (styleNamesInStyle.length > 0) {
                    styleNames.push(...styleNamesInStyle);
                }
                callback();
            }).catch(() => {
                callback();
            });
        };
        callback();
    });
}

function createWebviewPanel(title: string, fsPath: string) {
    const webviewOption: vscode.WebviewOptions = {
        enableScripts: true
    };
    initeWebviewPanel(vscode.window.createWebviewPanel('sctWidgetPreview', title, vscode.ViewColumn.Two, webviewOption), fsPath);
}

class WidgetsSerializer implements vscode.WebviewPanelSerializer {
    async deserializeWebviewPanel(panel: vscode.WebviewPanel, state: any) {
        //console.log("state", state);
        initeWebviewPanel(panel, state?.fsPath);
    }
}

interface Message {
    title: string;
    type: string;
    content?: any;
}

function initeWebviewPanel(panel: vscode.WebviewPanel, fsPath?: string) {
    if (panel) {
        webviewPanel = panel;
        panel.onDidDispose(() => {
            webviewPanel = null;
        }, null, subscriptions);
        panel.webview.onDidReceiveMessage((message: Message) => {
            //console.log(message);
            if (!webviewPanel) {
                return;
            }
            switch (message.type) {
                case "report": {
                    switch (message.title) {
                        case "webviewInitialized": {
                            if (languageName2Native.size === 0) {
                                webviewPanel.webview.postMessage({
                                    type: "report",
                                    title: "noLanguageNames"
                                });
                                break;
                            }
                            const languageNames: { [key: string]: string } = {};
                            for (const [languageName, languageNativeName] of languageName2Native) {
                                languageNames[languageName] = languageNativeName;
                            }
                            webviewPanel.webview.postMessage({
                                type: "languageNames",
                                content: languageNames
                            });
                            readTextFileFromContentDirectories("Atlases\\Atlas.txt").then(text => {
                                const atlasDefinition = {} as any;
                                const lines = text.split("\n");
                                for (const line of lines) {
                                    const array = line.split(" ");
                                    if (array.length > 3) {
                                        atlasDefinition[array[0]] = {
                                            sx: parseInt(array[1]),
                                            sy: parseInt(array[2]),
                                            sWidth: parseInt(array[3]),
                                            sHeight: parseInt(array[4])
                                        };
                                    }
                                }
                                webviewPanel?.webview.postMessage({
                                    type: "atlasDefinition",
                                    content: atlasDefinition
                                });
                            });
                            break;
                        }
                        case "allInitialized": {
                            sentStyles.clear();
                            if (fsPath) {
                                requestPreviewWidget(fsPath);
                                fsPath = undefined;
                            }
                            break;
                        }
                    }
                    break;
                }
                case "request": {
                    switch (message.title) {
                        case "languageStrings": {
                            if (typeof message.content !== "string") {
                                return;
                            }
                            let languageStrings = allLanguages.get(message.content)?.ContentWidgets ?? undefined;
                            if (languageStrings) {
                                webviewPanel.webview.postMessage({
                                    type: "languageStrings",
                                    title: message.content,
                                    content: languageStrings
                                });
                            } else {
                                languageStrings = allLanguages.get("en-us")?.ContentWidgets ?? undefined;
                                if (languageStrings) {
                                    webviewPanel.webview.postMessage({
                                        type: "languageStrings",
                                        title: "en-us",
                                        content: languageStrings
                                    });
                                } else {
                                    webviewPanel.webview.postMessage({
                                        type: "report",
                                        title: "noLanguageStrings"
                                    });
                                }
                            }
                            break;
                        }
                        case "widgetToPreview": {
                            if (isRequestingPreviewWidget || typeof message.content !== "string") {
                                return;
                            }
                            requestPreviewWidget(message.content);
                            break;
                        }
                        case "textFile": {
                            if (typeof message.content !== "string") {
                                return;
                            }
                            break;
                        }
                        case "binaryFile": {
                            if (typeof message.content !== "string") {
                                return;
                            }
                            break;
                        }
                        case "imageFile": {
                            readBinaryFileFromContentDirectories(message.content.fsPath, [".webp", ".png", ".jpg", ".jpeg"]).then(buffer => {
                                webviewPanel?.webview.postMessage({
                                    type: "imageFile",
                                    title: message.content.requestId,
                                    content: buffer
                                });
                            }).catch(() => {
                                webviewPanel?.webview.postMessage({
                                    type: "report",
                                    title: "getFileFailed",
                                    content: message.content.requestId
                                });
                            });
                            break;
                        }
                        case "audioFile": {
                            if (typeof message.content !== "string") {
                                return;
                            }
                            break;
                        }
                    }
                    break;
                }
            }
        });
        initePreviewHtml(html => {
            if (webviewPanel) {
                webviewPanel.webview.html = html;
            }
        });
    }
}

function initePreviewHtml(handler?: (arg: string) => void) {
    if (previewHtml) {
        handler?.(previewHtml);
    } else {
        fs.readFile(vscode.Uri.joinPath(previewBaseUri, "index.html").fsPath, (err, data) => {
            if (!err) {
                if (widgetPreviewDistUri && webviewPanel) {
                    const jsPath = vscode.Uri.joinPath(widgetPreviewDistUri, "assets", "index.js");
                    const cssPath = vscode.Uri.joinPath(widgetPreviewDistUri, "assets", "index.css");
                    previewHtml = data.toString("utf-8").replace("/assets/index.js", webviewPanel.webview.asWebviewUri(jsPath).toString()).replace("/assets/index.css", webviewPanel.webview.asWebviewUri(cssPath).toString());
                    handler?.(previewHtml);
                }
            }
        });
    }
}

function inspect() {
    vscode.commands.executeCommand('workbench.action.toggleDevTools');
}

function readBinaryFileFromContentDirectories(fsPath: string, suffixes?: string[]): Promise<ArrayBufferLike> {
    const contentDirectories: string[] = vscode.workspace.getConfiguration('survivalcraft-content-toolkit').get('contentDirectories') ?? [];
    const insidePromise = (directoryIndex: number, suffixIndex: number) => new Promise<ArrayBufferLike>((resolve, reject) => {
        if (contentDirectories.length === 0) {
            reject(new Error("GetFileFailed"));
        }
        const fsPath1 = path.join(contentDirectories[directoryIndex], suffixes ? (fsPath + suffixes[suffixIndex]) : fsPath);
        fs.readFile(fsPath1, (error, data) => {
            if (error) {
                const newSuffixIndex = suffixIndex + 1;
                if ((suffixes && newSuffixIndex >= suffixes.length) || (suffixes === undefined && newSuffixIndex > 0)) {
                    const newDirectoryIndex = directoryIndex - 1;
                    if (newDirectoryIndex < 0) {
                        reject(new Error("GetFileFailed"));
                    } else {
                        insidePromise(newDirectoryIndex, 0).then(resolve, reject);
                    }
                } else {
                    insidePromise(directoryIndex, newSuffixIndex).then(resolve, reject);
                }
            } else {
                resolve(data.buffer);
            }
        });
    });
    return insidePromise(contentDirectories.length - 1, 0);
}

function readTextFileFromContentDirectories(fsPath: string): Promise<string> {
    return readBinaryFileFromContentDirectories(fsPath).then(buffer => {
        return Buffer.from(buffer).toString("utf-8").replace(/^\uFEFF/, '');
    });
}


function readTextFileDirectly(fsPath: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        for (const document of vscode.workspace.textDocuments) {
            if (document.fileName === fsPath) {
                resolve(document.getText());
                return;
            }
        }
        fs.readFile(fsPath, "utf8", (error, data) => {
            if (error) {
                reject(error);
            } else {
                resolve(data.replace(/^\uFEFF/, ''));
            }
        });
    });
}