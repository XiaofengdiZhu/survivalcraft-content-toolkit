<script setup lang="ts">
import {ref} from "vue";
import {defaultWidgetProps, type WidgetProps} from "./Widget.ts";
import {CanvasWidgetClass} from "./CanvasWidget.ts";
import {closeInspectorDelay, openInspector, openInspectorDelay} from "../Components/Inspector.ts";

const htmlElement = ref<HTMLElement | null>(null);
const props = withDefaults(defineProps<WidgetProps>(), defaultWidgetProps);
const widget = CanvasWidgetClass.create(htmlElement, props, "CanvasWidget");
defineExpose({widget});
</script>

<template>
    <div ref="htmlElement" style="position: relative; max-width: 100%; max-height: 100%;" :style="widget.getStyle()" @mouseenter="openInspectorDelay(widget, $event)" @mouseleave="closeInspectorDelay(widget)" @click="openInspector(widget, $event)">
        <slot/>
    </div>
</template>
