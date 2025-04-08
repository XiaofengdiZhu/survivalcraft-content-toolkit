<script setup lang="ts">
import {computed, ref} from "vue";
import {arrow, autoPlacement, autoUpdate, offset, shift, useFloating} from "@floating-ui/vue";
import type {CSSProperties} from "@vue/runtime-dom";
import {colorPickerReference, mouseInColorPicker, displayColorPicker, closeColorPicker, colorPickerInfo, ColorChannelType} from "./Inspector.ts";

const floatingElement = ref<HTMLElement | null>(null);
const floatingArrow = ref<HTMLElement | null>(null);
const {floatingStyles, middlewareData, placement} = useFloating(colorPickerReference,
    floatingElement,
    {
        middleware: [offset(10),
            shift({padding: 10}),
            autoPlacement({allowedPlacements: ["bottom", "top"], padding: 10}),
            arrow({element: floatingArrow, padding: 10})], whileElementsMounted: autoUpdate
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
        case "top": {
            style.bottom = "-7.5px";
            style.borderBottom = arrowBorderStyleString;
            style.borderRight = arrowBorderStyleString;
            break;
        }
    }
    return style;
});

let isMouseDown = false;

function mouseEnter() {
    mouseInColorPicker.value = true;
}

function mouseLeave() {
    if (!isMouseDown) {
        mouseInColorPicker.value = false;
        closeColorPicker();
    }
}

let operationTarget: HTMLElement | null;

function actOperation(x: number, _y: number) {
    colorPickerInfo.value?.xSetter(Math.round(x * 255));
}

const OnMouseDown = (event: MouseEvent) => {
    isMouseDown = true;
    operationTarget = event.currentTarget as HTMLElement;
    let x = event.offsetX / operationTarget.clientWidth;
    let y = event.offsetY / operationTarget.clientHeight;
    actOperation(x, y);
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", OnMouseMove);
    document.addEventListener("mouseup", OnMouseUp);
};

const OnMouseMove = (event: MouseEvent) => {
    if (operationTarget != null) {
        let rect = operationTarget.getBoundingClientRect();
        let x = Math.min(Math.max(0, event.clientX - rect.left), rect.width) / rect.width;
        let y = Math.min(Math.max(0, event.clientY - rect.top), rect.height) / rect.height;
        actOperation(x, y);
    }
};

const OnMouseUp = (event: MouseEvent) => {
    isMouseDown = false;
    operationTarget = null;
    document.body.style.userSelect = "";
    document.removeEventListener("mousemove", OnMouseMove);
    document.removeEventListener("mouseup", OnMouseUp);
    if (event.target instanceof HTMLElement && !floatingElement.value?.contains(event.target)) {
        mouseInColorPicker.value = false;
        closeColorPicker();
    }
};
</script>

<template>
    <div ref="floatingElement" :style="{...floatingStyles, opacity: displayColorPicker ? '1' : '0', visibility: displayColorPicker ? 'visible' : 'hidden'}" class="floating" @mouseenter="mouseEnter" @mouseleave="mouseLeave">
        <div :class="$style.slider_container" @mousedown="event=>OnMouseDown(event)">
            <div v-if="colorPickerInfo?.channel === ColorChannelType.Alpha" :class="[$style.slider_background, $style.chessboard]"/>
            <div :class="$style.slider_background" :style="{backgroundImage: `linear-gradient(to right, ${colorPickerInfo?.start}, ${colorPickerInfo?.end})`}" style="position: absolute; top: 0;"/>
            <div :class="$style.slider_handler" :style="{left: `${(colorPickerInfo?.xGetter() ?? 0) / 2.55}%`, backgroundColor: colorPickerInfo?.RGBGetter(), borderColor: colorPickerInfo?.RGBHighContrast()}"/>
        </div>
        <div ref="floatingArrow" :style="arrowStyle" class="floatingArrow"/>
    </div>
</template>

<style module>
.slider_container {
    position: relative;
    width: 180px;
    height: 12px;
    border-radius: 6px;
    cursor: crosshair;
    box-shadow: 0 0 2px 0 rgba(0, 0, 0, .24);
}

.slider_background {
    width: 100%;
    height: 100%;
    border-radius: 6px;
}

.slider_handler {
    position: absolute;
    top: 50%;
    width: 12px;
    height: 12px;
    margin-left: -6px;
    margin-top: -6px;
    border-style: solid;
    border-width: 2px;
    border-radius: 6px;
    box-shadow: 0 0 2px 0 rgba(0, 0, 0, .45);
    box-sizing: border-box;
    cursor: grab;

    &:active {
        cursor: grabbing;
    }
}

.chessboard {
    background-image: linear-gradient(45deg, #DDD 25%, #0000 25%), linear-gradient(-45deg, #DDD 25%, #0000 25%), linear-gradient(45deg, #0000 75%, #DDD 75%), linear-gradient(-45deg, #0000 75%, #DDD 75%);
    background-size: 12px 12px;
    background-position: 0 0, 0 6px, 6px -6px, -6px 0;
    background-repeat: repeat;
}
</style>
