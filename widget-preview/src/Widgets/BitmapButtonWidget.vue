<script setup lang="ts">
import {BitmapButtonWidgetClass, type BitmapButtonWidgetProps} from "./BitmapButtonWidget.ts";
import CanvasWidget from "./Layouts/CanvasWidget.vue";
import RectangleWidget from "./RectangleWidget.vue";
import LabelWidget from "./LabelWidget.vue";
import {defaultWidgetProps} from "./Widget.ts";
import {Color} from "../Common.ts";
import {closeInspectorDelay, openInspector, openInspectorDelay} from "../Components/Inspector.ts";
import {ref} from "vue";
import {buttonClickAudio} from "../main.ts";

const htmlElement = ref<HTMLElement | null>(null);
const props = withDefaults(defineProps<BitmapButtonWidgetProps>(), defaultWidgetProps);
const widget = BitmapButtonWidgetClass.create(htmlElement,
    props as BitmapButtonWidgetProps,
    "BitmapButtonWidget");
defineExpose({widget});

function mouseDown() {
    if (widget.isEnabled) {
        widget.isPressed.value = true;
    }
}

function mouseUp(event: MouseEvent) {
    if (widget.isEnabled) {
        widget.isPressed.value = false;
    }
    if (event.target instanceof HTMLElement && htmlElement.value?.contains(event.target)) {
        buttonClickAudio?.play();
    }
}
</script>

<template>
    <CanvasWidget ref="htmlElement" style="cursor: pointer" :style="widget.getStyle()" :NoInspector="true" @mousedown="mouseDown" @mouseup="mouseUp" @mouseenter="openInspectorDelay(widget, $event)" @mouseleave="closeInspectorDelay(widget)" @click="openInspector(widget, $event)">
        <RectangleWidget Name="Button.Rectangle" :Subtexture="(widget.isChecked.value || widget.isPressed.value) ? widget.clickedSubtexture.value : widget.normalSubtexture.value" OutlineColor="0,0,0,0" FillColor="255,255,255"/>
        <RectangleWidget Name="Button.Image" IsVisible="false"/>
        <LabelWidget Name="Button.Label" :Text="widget.text.value" :Color="widget.isEnabled ? widget.color.value : new Color(112,112,112)" :Font="widget.font" HorizontalAlignment="Center" VerticalAlignment="Center"/>
        <slot/>
    </CanvasWidget>
</template>
