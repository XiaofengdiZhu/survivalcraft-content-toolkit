<script setup lang="ts">
import {defaultRectangleWidgetProps, RectangleWidgetClass, type RectangleWidgetProps} from "./RectangleWidget.ts";
import {closeInspectorDelay, openInspector, openInspectorDelay} from "../Components/Inspector.ts";
import {ref} from "vue";

const htmlElement = ref<HTMLElement | null>(null);
const props = withDefaults(defineProps<RectangleWidgetProps>(), defaultRectangleWidgetProps);
const widget = RectangleWidgetClass.create(htmlElement,
    props as RectangleWidgetProps,
    "RectangleWidget");
</script>

<template>
    <div ref="htmlElement" :style="widget.getStyle()" @mouseenter="openInspectorDelay(widget, $event)" @mouseleave="closeInspectorDelay(widget)" @click="openInspector(widget, $event)">
        <svg v-if="widget.subtexture.value.length > 0" style="display: none;">
            <defs>
                <filter :id="widget.filterId">
                    <feColorMatrix type="matrix" :values="`${widget.fillColor.value.R / 255} 0 0 0 0
                0 ${widget.fillColor.value.G / 255} 0 0 0
                0 0 ${widget.fillColor.value.B / 255} 0 0
                0 0 0 ${widget.fillColor.value.A / 255} 0`"/>
                </filter>
            </defs>
        </svg>
        <canvas :ref="widget.canvasElement" v-if="widget.subtexture.value.length > 0" style="width: 100%; height: 100%;" :style="{filter:`url(#${widget.filterId})`}"/>
    </div>
</template>
