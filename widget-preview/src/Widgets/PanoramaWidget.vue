<script setup lang="ts">
import {defaultRectangleWidgetProps} from "./RectangleWidget.ts";
import {closeInspectorDelay, openInspector, openInspectorDelay} from "../Components/Inspector.ts";
import {ref} from "vue";
import {PanoramaWidgetClass} from "./PanoramaWidget.ts";
import type {WidgetProps} from "./Widget.ts";

const htmlElement = ref<HTMLElement | null>(null);
const props = withDefaults(defineProps<WidgetProps>(), defaultRectangleWidgetProps);
const widget = PanoramaWidgetClass.create(htmlElement, props as WidgetProps, "PanoramaWidget");
</script>

<template>
    <div ref="htmlElement" :style="widget.getStyle()" @mouseenter="openInspectorDelay(widget, $event)" @mouseleave="closeInspectorDelay(widget)" @click="openInspector(widget, $event)">
        <canvas :ref="widget.canvasElement" style="width: 100%; height: 100%;"/>
    </div>
</template>
