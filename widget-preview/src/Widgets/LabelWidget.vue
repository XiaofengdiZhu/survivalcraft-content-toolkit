<script setup lang="ts">
import {defaultFontTextWidgetProps, type FontTextWidgetProps} from "./FontTextWidget.ts";
import {LabelWidgetClass} from "./LabelWidget.ts";
import {closeInspectorDelay, openInspector, openInspectorDelay} from "../Components/Inspector.ts";
import {ref} from "vue";

const htmlElement = ref<HTMLElement | null>(null);
const props = withDefaults(defineProps<FontTextWidgetProps>(), defaultFontTextWidgetProps);
const widget = LabelWidgetClass.create(htmlElement, props as FontTextWidgetProps, "LabelWidget");
</script>

<template>
    <div ref="htmlElement" :style="widget.getStyle()" @mouseenter="openInspectorDelay(widget, $event)" @mouseleave="closeInspectorDelay(widget)" @click="openInspector(widget, $event)">{{
            widget.getTreatedText()}}
    </div>
</template>
