<script setup lang="ts">
import {ref} from "vue";
import {defaultWidgetProps, type WidgetProps} from "./Widget.ts";
import {CanvasWidgetClass} from "./CanvasWidget.ts";
import {closeInspectorDelay, openInspector, openInspectorDelay} from "../Components/Inspector.ts";

export interface UnknownWidgetProps extends WidgetProps {
    OriginalTagName?: string;
}

const htmlElement = ref<HTMLElement | null>(null);
const props = withDefaults(defineProps<UnknownWidgetProps>(), defaultWidgetProps);
const widget = CanvasWidgetClass.create(htmlElement,
    props,
    props.OriginalTagName === undefined ? "UnknownWidget" : `${props.OriginalTagName} (Unknown)`);
defineExpose({widget});
</script>

<template>
    <div ref="htmlElement" :style="widget.getStyle()" @mouseenter="openInspectorDelay(widget, $event)" @mouseleave="closeInspectorDelay(widget)" @click="openInspector(widget, $event)">
        <slot/>
    </div>
</template>
