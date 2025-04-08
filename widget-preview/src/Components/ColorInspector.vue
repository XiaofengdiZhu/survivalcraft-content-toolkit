<script setup lang="ts">
import {type AttributeInfo, closeColorPicker, ColorChannelType, openColorPicker} from "./Inspector.ts";
import {ref, watch} from "vue";
import {type Color, Color as ColorClass} from "../Common.ts";

const {attribute} = defineProps<{
    attribute: AttributeInfo<Color>
}>();
const originalColor = attribute.getter();
const numR = ref(originalColor.R);
const numG = ref(originalColor.G);
const numB = ref(originalColor.B);
const numA = ref(originalColor.A);

const RGB = ref(`rgb(${originalColor.R},${originalColor.G},${originalColor.B})`);
const RGBHighContrast = ref(getHighContrast(originalColor.R,
    originalColor.G,
    originalColor.B,
    255));

const inputNumR = ref<HTMLInputElement | null>(null);
const inputNumG = ref<HTMLInputElement | null>(null);
const inputNumB = ref<HTMLInputElement | null>(null);
const inputNumA = ref<HTMLInputElement | null>(null);

function updateValueR(newValue: number) {
    const oldValue = attribute.getter();
    newValue = Math.max(0, Math.min(255, newValue));
    attribute.setter(new ColorClass(newValue, oldValue.G, oldValue.B, oldValue.A));
}

function updateValueG(newValue: number) {
    const oldValue = attribute.getter();
    newValue = Math.max(0, Math.min(255, newValue));
    attribute.setter(new ColorClass(oldValue.R, newValue, oldValue.B, oldValue.A));
}

function updateValueB(newValue: number) {
    const oldValue = attribute.getter();
    newValue = Math.max(0, Math.min(255, newValue));
    attribute.setter(new ColorClass(oldValue.R, oldValue.G, newValue, oldValue.A));
}

function updateValueA(newValue: number) {
    const oldValue = attribute.getter();
    newValue = Math.max(0, Math.min(255, newValue));
    attribute.setter(new ColorClass(oldValue.R, oldValue.G, oldValue.B, newValue));
}

watch([() => attribute.getter().R,
    () => attribute.getter().G,
    () => attribute.getter().B,
    () => attribute.getter().A], ([newR, newG, newB, newA]) => {
    let flag = false;
    if (numR.value !== newR) {
        numR.value = newR;
        flag = true;
    }
    if (numG.value !== newG) {
        numG.value = newG;
        flag = true;
    }
    if (numB.value !== newB) {
        numB.value = newB;
        flag = true;
    }
    if (numA.value !== newA) {
        numA.value = newA;
        flag = true;
    }
    if (flag) {
        RGB.value = `rgb(${newR},${newG},${newB})`;
        RGBHighContrast.value = getHighContrast(newR, newG, newB, newA);
    }
});

function inputNumMouseEnter(channel: ColorChannelType, event: Event) {
    let xGetter: () => number;
    let xSetter: (value: number) => void;
    let start: string;
    let end: string;
    switch (channel) {
        case ColorChannelType.Red:
            xGetter = () => numR.value;
            xSetter = (value: number) => updateValueR(value);
            start = `rgb(0,${numG.value},${numB.value})`;
            end = `rgb(255,${numG.value},${numB.value})`;
            break;
        case ColorChannelType.Green:
            xGetter = () => numG.value;
            xSetter = (value: number) => updateValueG(value);
            start = `rgb(${numR.value},0,${numB.value})`;
            end = `rgb(${numR.value},255,${numB.value})`;
            break;
        case ColorChannelType.Blue:
            xGetter = () => numB.value;
            xSetter = (value: number) => updateValueB(value);
            start = `rgb(${numR.value},${numG.value},0)`;
            end = `rgb(${numR.value},${numG.value},255)`;
            break;
        default:
            xGetter = () => numA.value;
            xSetter = (value: number) => updateValueA(value);
            start = `rgba(${numR.value},${numG.value},${numB.value},0)`;
            end = `rgba(${numR.value},${numG.value},${numB.value},255)`;
            break;
    }
    openColorPicker({
        channel: channel,
        xGetter: xGetter,
        xSetter: xSetter,
        RGBGetter: () => `rgb(${numR.value},${numG.value},${numB.value})`,
        RGBHighContrast: () => RGBHighContrast.value,
        start: start,
        end: end
    }, event);
}

function inputNumMouseLeave() {
    closeColorPicker();
}

function getHighContrast(red: number, green: number, blue: number, alpha: number) {
    return (alpha < 102) ?
        "black" :
        ((0.2126 * red + 0.7152 * green + 0.0722 * blue > 128) ? "black" : "white");
}
</script>

<template>
    <tr>
        <td>{{attribute.title}}</td>
        <td style="padding: 2px;">
            <div style="padding: 4px 6px; flex-grow: 1;" :style="{backgroundColor: RGB, color: RGBHighContrast}">
                <div style="display: flex; justify-content: end; gap: 8px; flex-wrap: wrap;">
                    <div :class="$style.inputNumberContainer" @mouseenter="inputNumMouseEnter(ColorChannelType.Red, $event)" @mouseleave="inputNumMouseLeave">
                        R:<input type="number" ref="inputNumR" :value="numR" @change="updateValueR(($event.target as HTMLInputElement).valueAsNumber)"/>
                    </div>
                    <div :class="$style.inputNumberContainer" @mouseenter="inputNumMouseEnter(ColorChannelType.Green, $event)" @mouseleave="inputNumMouseLeave">
                        G:<input type="number" ref="inputNumG" :value="numG" @change="updateValueG(($event.target as HTMLInputElement).valueAsNumber)"/>
                    </div>
                    <div :class="$style.inputNumberContainer" @mouseenter="inputNumMouseEnter(ColorChannelType.Blue, $event)" @mouseleave="inputNumMouseLeave">
                        B:<input type="number" ref="inputNumB" :value="numB" @change="updateValueB(($event.target as HTMLInputElement).valueAsNumber)"/>
                    </div>
                    <div :class="$style.inputNumberContainer" @mouseenter="inputNumMouseEnter(ColorChannelType.Alpha, $event)" @mouseleave="inputNumMouseLeave">
                        A:<input type="number" ref="inputNumA" :value="numA" @change="updateValueA(($event.target as HTMLInputElement).valueAsNumber)"/>
                    </div>
                </div>
            </div>
        </td>
    </tr>
</template>

<style module>
.inputNumberContainer {
    display: flex;
    position: relative;
    gap: 4px;

    & input[type="number"] {
        width: 24px;
        text-align: right;
    }
}
</style>
