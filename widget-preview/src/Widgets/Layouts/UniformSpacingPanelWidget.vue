<script setup lang="ts">
import {ref} from "vue";
import {type StackPanelWidgetProps} from "./StackPanelWidget.ts";
import {defaultWidgetProps} from "../Widget.ts";
import {closeInspectorDelay, openInspector, openInspectorDelay} from "../../Components/Inspector.ts";
import {UniformSpacingPanelWidgetClass} from "./UniformSpacingPanelWidget.ts";

const htmlElement = ref<HTMLElement | null>(null);
const props = withDefaults(defineProps<StackPanelWidgetProps>(), defaultWidgetProps);
const widget = UniformSpacingPanelWidgetClass.create(htmlElement,
    props as StackPanelWidgetProps,
    "UniformSpacingPanelWidget");
defineExpose({widget});
</script>

<template>
    <div ref="htmlElement" style="display: flex; flex-wrap: nowrap;" :style="widget.getStyle()" @mouseenter="openInspectorDelay(widget, $event)" @mouseleave="closeInspectorDelay(widget)" @click="openInspector(widget, $event)">
        <slot/>
    </div>
</template>
