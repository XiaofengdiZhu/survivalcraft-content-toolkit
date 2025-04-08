<script setup lang="ts">
import {ref} from "vue";
import {StackPanelWidgetClass, type StackPanelWidgetProps} from "./StackPanelWidget.ts";
import {defaultWidgetProps} from "./Widget.ts";
import {closeInspectorDelay, openInspector, openInspectorDelay} from "../Components/Inspector.ts";

const htmlElement = ref<HTMLElement | null>(null);
const props = withDefaults(defineProps<StackPanelWidgetProps>(), defaultWidgetProps);
const widget = StackPanelWidgetClass.create(htmlElement,
    props as StackPanelWidgetProps,
    "StackPanelWidget");
defineExpose({widget});
</script>

<template>
    <div ref="htmlElement" style="display: flex; flex-wrap: nowrap;" :style="widget.getStyle()" @mouseenter="openInspectorDelay(widget, $event)" @mouseleave="closeInspectorDelay(widget)" @click="openInspector(widget, $event)">
        <slot/>
    </div>
</template>
