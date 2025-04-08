import {compile, type Component, defineComponent} from "vue";
import Widget from "./Widgets/Widget.vue";
import UnknownWidget from "./Widgets/UnknownWidget.vue";
import CanvasWidget from "./Widgets/CanvasWidget.vue";
import StackPanelWidget from "./Widgets/StackPanelWidget.vue";
import RectangleWidget from "./Widgets/RectangleWidget.vue";
import FontTextWidget from "./Widgets/FontTextWidget.vue";
import LabelWidget from "./Widgets/LabelWidget.vue";
import BevelledRectangleWidget from "./Widgets/BevelledRectangleWidget.vue";
import BevelledButtonWidget from "./Widgets/BevelledButtonWidget.vue";
import BitmapButtonWidget from "./Widgets/BitmapButtonWidget.vue";
import {NodeTypes, type TemplateChildNode} from "@vue/compiler-core";
import {bevelledButtonWidgetLinearDescents} from "./Widgets/BevelledButtonWidget.ts";
import {allStyles, createAttributeNode, applyStyleToNode} from "./main.ts";

const allComponents: Record<string, Component> = {
    Widget,
    UnknownWidget,
    CanvasWidget,
    StackPanelWidget,
    RectangleWidget,
    BevelledRectangleWidget,
    FontTextWidget,
    LabelWidget,
    BevelledButtonWidget,
    BitmapButtonWidget
};

export const linearDescentsMap: Map<string, Map<string, string>> = new Map();
linearDescentsMap.set("BevelledButtonWidget", bevelledButtonWidgetLinearDescents);

export function createComponentFromString(name: string, vueString: string, cache: boolean = true) {
    const component = defineComponent({
        components: allComponents, setup() {
            let result;
            try {
                result = compile(vueString, {
                    nodeTransforms: [(node) => {
                        if (node.type === NodeTypes.ELEMENT) {
                            if (!allComponents[node.tag]) {
                                node.props.push(createAttributeNode("OriginalTagName", node.tag));
                                node.tag = "UnknownWidget";
                            }
                            let styleName: string | undefined;
                            for (const prop of node.props) {
                                if (prop.type === NodeTypes.ATTRIBUTE && prop.name === "Style") {
                                    styleName = prop.value?.content.replace("{", "")
                                    .replace("}", "");
                                    break;
                                }
                            }
                            if (styleName) {
                                const style = allStyles.get(styleName);
                                if (style) {
                                    applyStyleToNode(style, node);
                                }
                            }
                            const linearDescents = linearDescentsMap.get(node.tag);
                            if (linearDescents !== undefined) {
                                const override = {} as any;
                                const toRemove: TemplateChildNode[] = [];
                                for (const child of node.children) {
                                    if (child.type === NodeTypes.ELEMENT) {
                                        const attributes = {} as any;
                                        for (const prop of child.props) {
                                            if (prop.type === NodeTypes.ATTRIBUTE && prop.value?.content) {
                                                if (prop.name === "Name") {
                                                    const name = prop.value.content;
                                                    const temp = linearDescents.get(name);
                                                    if (temp !== undefined && temp === child.tag) {
                                                        override[name] = attributes;
                                                        toRemove.push(child);
                                                    }
                                                    else {
                                                        break;
                                                    }
                                                }
                                                else {
                                                    attributes[prop.name] = prop.value.content;
                                                }
                                            }
                                        }
                                    }
                                }
                                if (toRemove.length > 0) {
                                    node.children = node.children.filter(child => !toRemove.includes(
                                        child));
                                    node.props.push(createAttributeNode("OverrideChildren",
                                        JSON.stringify(override)));
                                }
                            }
                        }
                    }]
                });
            }
            catch (e) {
                console.error(e);
                return compile(`<div>
<div style="font-family: system-ui;">Erron in compiling "${name}"</div>
<div><pre>${escapeHtml((e as Error).message)}</pre></div>
</div>`);
            }
            return result;
        }
    });
    if (cache) {
        allComponents[name] = component;
    }
    return component;
}

function escapeHtml(html: string) {
    return html.replace(/[&<>"']/g, function (match) {
        switch (match) {
            case "&":
                return "&amp;";
            case "<":
                return "&lt;";
            case ">":
                return "&gt;";
            case "\"":
                return "&quot;";
            case "'":
                return "&#39;";
            default:
                return match;
        }
    });
}
