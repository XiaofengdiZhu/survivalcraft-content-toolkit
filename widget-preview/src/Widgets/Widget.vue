<script setup lang="ts">
import {defaultWidgetProps, WidgetClass, type WidgetProps} from "./Widget.ts";
import {closeInspectorDelay, openInspector, openInspectorDelay} from "../Components/Inspector.ts";
import {ref} from "vue";

const htmlElement = ref<HTMLElement | null>(null);
const props = withDefaults(defineProps<WidgetProps>(), defaultWidgetProps);
const widget = WidgetClass.create(htmlElement, props, "Widget");
</script>

<template>
    <div ref="htmlElement" :style="widget.getStyle()" @mouseenter="openInspectorDelay(widget, $event)" @mouseleave="closeInspectorDelay(widget)" @click="openInspector(widget, $event)"/>
</template>
