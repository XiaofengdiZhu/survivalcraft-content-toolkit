<script setup lang="ts">
import {ref} from "vue";
import CanvasWidget from "./Layouts/CanvasWidget.vue";
import LabelWidget from "./LabelWidget.vue";
import BevelledRectangleWidget from "./BevelledRectangleWidget.vue";
import {type BevelledButtonWidgetProps, BevelledButtonWidgetClass} from "./BevelledButtonWidget.ts";
import RectangleWidget from "./RectangleWidget.vue";
import {defaultWidgetProps} from "./Widget.ts";
import {Color} from "../Common.ts";
import {closeInspectorDelay, openInspector, openInspectorDelay} from "../Components/Inspector.ts";
import {buttonClickAudio} from "../main.ts";

const htmlElement = ref<HTMLElement | null>(null);
const props = withDefaults(defineProps<BevelledButtonWidgetProps>(), defaultWidgetProps);
const widget = BevelledButtonWidgetClass.create(htmlElement,
    props as BevelledButtonWidgetProps,
    "BevelledButtonWidget");
defineExpose({widget});

function mouseDown() {
    if (widget.isEnabled) {
        widget.isPressed.value = true;
    }
}

function mouseUp(event: MouseEvent) {
    if (widget.isEnabled) {
        widget.isPressed.value = false;
    }
    if (event.target instanceof HTMLElement && htmlElement.value?.contains(event.target)) {
        buttonClickAudio?.play();
    }
}
</script>

<template>
    <div ref="htmlElement" style="cursor: pointer;" :style="widget.getStyle()" @mousedown="mouseDown" @mouseup="mouseUp" @mouseenter="openInspectorDelay(widget, $event)" @mouseleave="closeInspectorDelay(widget)" @click="openInspector(widget, $event)">
        <CanvasWidget Name="BevelledButton.Canvas" Margin="6,6" :NoInspector="true" :OverrideChildren="widget.overrideChildren">
            <BevelledRectangleWidget Name="BevelledButton.Rectangle" :BevelColor="widget.bevelColor.value" :CenterColor="widget.centerColor.value" :AmbientLight="widget.ambientLight.value" :DirectionalLight="widget.directionalLight.value" :BevelSize="(widget.isChecked.value || widget.isPressed.value) ? (-0.5 * widget.bevelSize.value): (widget.bevelSize.value)"/>
            <RectangleWidget Name="BevelledButton.Image" IsVisible="false" :Subtexture="props.Subtexture"/>
            <LabelWidget Name="BevelledButton.Label" :Text="props.Text" :Color="widget.isEnabled ? widget.color.value : new Color(112,112,112)" :Font="widget.font" :FontScale="widget.fontScale.value" HorizontalAlignment="Center" VerticalAlignment="Center"/>
            <slot/>
        </CanvasWidget>
    </div>
</template>
