<script setup lang="ts">
import {type AttributeInfo} from "./Inspector.ts";
import {ref, watch} from "vue";
import type {Vector2} from "../Common.ts";

const {attribute} = defineProps<{
    attribute: AttributeInfo<Vector2>
}>();
const originalVector2 = attribute.getter();
const numX = ref(originalVector2.X);
const numY = ref(originalVector2.Y);
const infinityX = ref(numX.value === Infinity);
const infinityY = ref(numY.value === Infinity);
const inputNumX = ref<HTMLInputElement | null>(null);
const inputNumY = ref<HTMLInputElement | null>(null);

function updateValueX(newValue: number) {
    attribute.setter({X: newValue, Y: attribute.getter().Y});
}

function updateValueY(newValue: number) {
    attribute.setter({X: attribute.getter().X, Y: newValue});
}

watch(() => attribute.getter().X, newValue => {
    if (numX.value !== newValue) {
        numX.value = newValue;
        infinityX.value = newValue === Infinity;
    }
});
watch(() => attribute.getter().Y, newValue => {
    if (numY.value !== newValue) {
        numY.value = newValue;
        infinityY.value = newValue === Infinity;
    }
});
</script>

<template>
    <tr>
        <td>{{attribute.title}}</td>
        <td>
            <div style="display: flex; justify-content: end; gap: 8px; flex-wrap: wrap;">
                <div style="display: flex; position: relative;">
                    X:<input type="checkbox" class="infinity" :checked="infinityX" @change="updateValueX(($event.target as HTMLInputElement).checked ? Infinity : 0)"/>
                    <input type="number" ref="inputNumX" :value="numX" :disabled="infinityX" @change="updateValueX(($event.target as HTMLInputElement).valueAsNumber)" style="width: 48px; text-align: right;"/>
                    <div style="position: absolute; right: 4px; user-select: none;" v-if="infinityX">Infinity</div>
                </div>
                <div style="display: flex; position: relative;">
                    Y:<input type="checkbox" class="infinity" :checked="infinityY" @change="updateValueY(($event.target as HTMLInputElement).checked ? Infinity : 0)"/>
                    <input type="number" ref="inputNumY" :value="numY" :disabled="infinityY" @change="updateValueY(($event.target as HTMLInputElement).valueAsNumber)" style="width: 48px; text-align: right;"/>
                    <div style="position: absolute; right: 4px; user-select: none;" v-if="infinityY">Infinity</div>
                </div>
            </div>
        </td>
    </tr>
</template>
