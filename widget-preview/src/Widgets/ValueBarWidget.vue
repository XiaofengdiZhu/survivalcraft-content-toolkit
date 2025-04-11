<script setup lang="ts">
import {closeInspectorDelay, openInspector, openInspectorDelay} from "../Components/Inspector.ts";
import {ref} from "vue";
import {ValueBarWidgetClass, type ValueBarWidgetProps} from "./ValueBarWidget.ts";
import {defaultWidgetProps} from "./Widget.ts";

const htmlElement = ref<HTMLElement | null>(null);
const props = withDefaults(defineProps<ValueBarWidgetProps>(), defaultWidgetProps);
const widget = ValueBarWidgetClass.create(htmlElement,
    props as ValueBarWidgetProps,
    "ValueBarWidget");
</script>

<template>
    <div ref="htmlElement" :style="widget.getStyle()" @mouseenter="openInspectorDelay(widget, $event)" @mouseleave="closeInspectorDelay(widget)" @click="openInspector(widget, $event)">
        <canvas :ref="widget.canvasElement"/>
    </div>
</template>
