<script setup lang="ts">
import {BevelledRectangleWidgetClass, type BevelledRectangleWidgetProps} from "./BevelledRectangleWidget.ts";
import {defaultRectangleWidgetProps} from "./RectangleWidget.ts";
import {closeInspectorDelay, openInspector, openInspectorDelay} from "../Components/Inspector.ts";
import {ref} from "vue";

const htmlElement = ref<HTMLElement | null>(null);
const props = withDefaults(defineProps<BevelledRectangleWidgetProps>(),
    defaultRectangleWidgetProps);
const widget = BevelledRectangleWidgetClass.create(htmlElement,
    props as BevelledRectangleWidgetProps,
    "BevelledRectangleWidget");
</script>

<template>
    <div ref="htmlElement" :style="widget.getStyle()" @mouseenter="openInspectorDelay(widget, $event)" @mouseleave="closeInspectorDelay(widget)" @click="openInspector(widget, $event)">
        <div :style="widget.getContentStyle()"></div>
    </div>
</template>
