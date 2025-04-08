<script setup lang="ts">
import {computed, ref} from "vue";
import {arrow, autoPlacement, autoUpdate, offset, shift, size, useFloating} from "@floating-ui/vue";
import type {CSSProperties} from "@vue/runtime-dom";
import {dialogWidget, dialogReference, type AttributeInfo, AttributeType, displayDialog, mouseInDialog, closeInspectorDelay, openInspector} from "./Inspector.ts";
import BooleanInspector from "./BooleanInspector.vue";
import NumberInspector from "./NumberInspector.vue";
import Vector2Inspector from "./Vector2Inspector.vue";
import {Color, TextAnchor, TextOrientation, type Vector2, WidgetAlignment} from "../Common.ts";
import StringInspector from "./StringInspector.vue";
import WidgetAlignmentInspector from "./WidgetAlignmentInspector.vue";
import TextOrientationInspector from "./TextOrientationInspector.vue";
import ColorInspector from "./ColorInspector.vue";
import FloatingColorPicker from "./FloatingColorPicker.vue";
import TextAnchorsInspector from "./TextAnchorsInspector.vue";
import type {WidgetClass} from "../Widgets/Widget.ts";

const floatingElement = ref(null);
const floatingArrow = ref(null);
const floatingMaxWidth = ref(0);
const floatingMaxHeight = ref(0);
const {floatingStyles, middlewareData, placement} = useFloating(dialogReference, floatingElement, {
    middleware: [offset(10), shift({padding: 10}), autoPlacement({
        allowedPlacements: ["right-start",
            "right-end",
            "bottom-start",
            "bottom-end",
            "left-start",
            "left-end"], padding: 10
    }), size({
        padding: 5, apply({
            availableWidth, availableHeight
        }) {
            floatingMaxWidth.value = Math.max(availableWidth, 0);
            floatingMaxHeight.value = Math.max(availableHeight, 0);
        }
    }), arrow({element: floatingArrow, padding: 10})], whileElementsMounted: autoUpdate
});

const arrowBorderStyleString = "var(--vscode-editorHoverWidget-border) 1.5px solid";

const arrowStyle = computed(() => {
    const style: CSSProperties = {};
    if (middlewareData.value.arrow) {
        if (middlewareData.value.arrow.x) {
            style.left = `${middlewareData.value.arrow.x}px`;
        }
        if (middlewareData.value.arrow.y) {
            style.top = `${middlewareData.value.arrow.y}px`;
        }
    }
    switch (placement.value.split("-")[0]) {
        case "right": {
            style.left = "-7.5px";
            style.borderLeft = arrowBorderStyleString;
            style.borderBottom = arrowBorderStyleString;
            break;
        }
        case "bottom": {
            style.top = "-7.5px";
            style.borderTop = arrowBorderStyleString;
            style.borderLeft = arrowBorderStyleString;
            break;
        }
        case "left": {
            style.right = "-7.5px";
            style.borderTop = arrowBorderStyleString;
            style.borderRight = arrowBorderStyleString;
            break;
        }
    }
    return style;
});

function mouseEnter() {
    mouseInDialog.value = true;
}

function mouseLeave() {
    mouseInDialog.value = false;
    closeInspectorDelay();
}

const childSelectElement = ref<HTMLSelectElement | null>(null);
const children = computed(() => {
    if (dialogWidget.value !== null) {
        return dialogWidget.value.children.filter(child => !child.isNoInspector && child.htmlElement !== null);
    }
    return [];
});

function gotoParentWidget() {
    if (dialogWidget.value?.parent?.htmlElement?.value) {
        openInspector(dialogWidget.value?.parent);
    }
}

function gotoChild(index: string) {
    const indexNum = parseInt(index);
    if (!isNaN(indexNum)) {
        const widget = children.value[indexNum];
        if (widget) {
            openInspector(widget as WidgetClass);
        }
    }
    if (childSelectElement.value) {
        childSelectElement.value.value = "default";
    }
}
</script>

<template>
    <div ref="floatingElement" :style="{...floatingStyles, maxWidth: floatingMaxWidth + 'px', maxHeight: floatingMaxHeight + 'px', opacity: displayDialog ? '1' : '0', visibility: displayDialog ? 'visible' : 'hidden'}" class="floating" @mouseenter="mouseEnter" @mouseleave="mouseLeave">
        <div style="display: flex; justify-content: space-between; gap: 16px;">
            <h3 style="overflow: auto;">{{dialogWidget?.inspectorProvider.widgetName}}</h3>
            <div style="display: flex; gap: 8px;">
                <button @click="gotoParentWidget" style="height: 22px; width: 22px; box-sizing: border-box; padding-top: 4px;" :disabled="(dialogWidget?.parent?.htmlElement ?? null) === null">▲</button>
                <select v-if="children.length > 0" ref="childSelectElement" style="appearance: none; height: 22px; width: 22px; box-sizing: border-box; padding: 2px 4px;" @change="gotoChild(($event.target as HTMLSelectElement).value)">
                    <option selected hidden="hidden" value="default">▼</option>
                    <option v-for="(child, index) in children" :value="index">{{
                            child.inspectorProvider.widgetName}}
                    </option>
                </select>
            </div>
        </div>
        <div class="floatingTableContainer" :style="{maxHeight: (floatingMaxHeight - 42) + 'px'}">
            <table>
                <thead>
                <tr>
                    <th>
                        <svg width="18" height="18" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                            <path d="M14.45 4.5l-5-2.5h-.9l-7 3.5-.55.89v4.5l.55.9 5 2.5h.9l7-3.5.55-.9v-4.5l-.55-.89zm-8 8.64l-4.5-2.25V7.17l4.5 2v3.97zm.5-4.8L2.29 6.23l6.66-3.34 4.67 2.34-6.67 3.11zm7 1.55l-6.5 3.25V9.21l6.5-3v3.68z"/>
                        </svg>
                    </th>
                    <th>
                        <svg width="18" height="18" viewBox="0 0 16 12" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M7.223 10.933c.326.192.699.29 1.077.282a2.159 2.159 0 0 0 1.754-.842 3.291 3.291 0 0 0 .654-2.113 2.886 2.886 0 0 0-.576-1.877 1.99 1.99 0 0 0-1.634-.733 2.294 2.294 0 0 0-1.523.567V3.475h-.991V11.1h.995v-.344c.076.066.158.125.244.177zM7.85 6.7c.186-.079.388-.113.59-.1a1.08 1.08 0 0 1 .896.428c.257.363.382.802.357 1.245a2.485 2.485 0 0 1-.4 1.484 1.133 1.133 0 0 1-.96.508 1.224 1.224 0 0 1-.976-.417A1.522 1.522 0 0 1 6.975 8.8v-.6a1.722 1.722 0 0 1 .393-1.145c.13-.154.296-.276.482-.355zM3.289 5.675a3.03 3.03 0 0 0-.937.162 2.59 2.59 0 0 0-.8.4l-.1.077v1.2l.423-.359a2.1 2.1 0 0 1 1.366-.572.758.758 0 0 1 .661.282c.15.232.23.503.231.779L2.9 7.825a2.6 2.6 0 0 0-1.378.575 1.65 1.65 0 0 0-.022 2.336 1.737 1.737 0 0 0 1.253.454 1.96 1.96 0 0 0 1.107-.332c.102-.068.197-.145.286-.229v.444h.941V7.715a2.193 2.193 0 0 0-.469-1.5 1.687 1.687 0 0 0-1.329-.54zm.857 3.041c.02.418-.12.829-.391 1.148a1.221 1.221 0 0 1-.955.422.832.832 0 0 1-.608-.2.833.833 0 0 1 0-1.091c.281-.174.6-.277.93-.3l1.02-.148.004.169zm8.313 2.317c.307.13.64.193.973.182.495.012.983-.114 1.41-.365l.123-.075.013-.007V9.615l-.446.32c-.316.224-.696.34-1.084.329A1.3 1.3 0 0 1 12.4 9.8a1.975 1.975 0 0 1-.4-1.312 2.01 2.01 0 0 1 .453-1.381A1.432 1.432 0 0 1 13.6 6.6a1.8 1.8 0 0 1 .971.279l.43.265V5.97l-.17-.073a2.9 2.9 0 0 0-1.17-.247 2.52 2.52 0 0 0-1.929.817 2.9 2.9 0 0 0-.747 2.049c-.028.707.21 1.4.67 1.939.222.249.497.446.804.578z"/>
                        </svg>
                    </th>
                </tr>
                </thead>
                <tbody>
                <template v-for="attribute in dialogWidget?.inspectorProvider.attributes">
                    <BooleanInspector v-if="attribute.type === AttributeType.Boolean" :attribute="attribute as AttributeInfo<boolean>"/>
                    <StringInspector v-else-if="attribute.type === AttributeType.String" :attribute="attribute as AttributeInfo<string>"/>
                    <NumberInspector v-else-if="attribute.type === AttributeType.Number || attribute.type === AttributeType.Integer" :attribute="attribute as AttributeInfo<number>"/>
                    <Vector2Inspector v-else-if="attribute.type === AttributeType.Vector2" :attribute="attribute as AttributeInfo<Vector2>"/>
                    <WidgetAlignmentInspector v-else-if="attribute.type === AttributeType.WidgetAlignment" :attribute="attribute as AttributeInfo<WidgetAlignment>"/>
                    <TextOrientationInspector v-else-if="attribute.type === AttributeType.TextOrientation" :attribute="attribute as AttributeInfo<TextOrientation>"/>
                    <ColorInspector v-else-if="attribute.type === AttributeType.Color" :attribute="attribute as AttributeInfo<Color>"/>
                    <TextAnchorsInspector v-else-if="attribute.type === AttributeType.TextAnchors" :attribute="attribute as AttributeInfo<Set<TextAnchor>>"/>
                </template>
                </tbody>
            </table>
        </div>
        <div ref="floatingArrow" :style="arrowStyle" class="floatingArrow"/>
        <FloatingColorPicker/>
    </div>
</template>
