<script setup lang="ts">
import {ref} from "vue";
import {closeInspectorDelay, openInspector, openInspectorDelay} from "../../Components/Inspector.ts";
import {defaultScrollPanelWidgetProps, ScrollPanelWidgetClass, type ScrollPanelWidgetProps} from "./ScrollPanelWidget.ts";

const htmlElement = ref<HTMLElement | null>(null);
const props = withDefaults(defineProps<ScrollPanelWidgetProps>(), defaultScrollPanelWidgetProps);
const widget = ScrollPanelWidgetClass.create(htmlElement,
    props as ScrollPanelWidgetProps,
    "ScrollPanelWidget");
defineExpose({widget});
</script>

<template>
    <div ref="htmlElement" style="position: relative; max-width: 100%; max-height: 100%; scrollbar-color: rgb(80,80,80) transparent;" :style="widget.getStyle()" @mouseenter="openInspectorDelay(widget, $event)" @mouseleave="closeInspectorDelay(widget)" @click="openInspector(widget, $event)">
        <slot/>
    </div>
</template>
