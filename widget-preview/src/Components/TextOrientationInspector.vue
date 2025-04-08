<script setup lang="ts">
import type {AttributeInfo} from "./Inspector.ts";
import {ref, watch} from "vue";
import {type TextOrientation, TextOrientation as TextOrientationEnum} from "../Common.ts";

const {attribute} = defineProps<{
    attribute: AttributeInfo<TextOrientation>
}>();
const alignment = ref(attribute.getter());

function updateValue(newValue: string) {
    attribute.setter(parseInt(newValue));
}

watch(() => attribute.getter(), newValue => {
    if (alignment.value !== newValue) {
        alignment.value = newValue;
    }
});
</script>

<template>
    <tr>
        <td>{{attribute.title}}</td>
        <td>
            <div style="display: flex; justify-content: end; gap: 8px; flex-wrap: wrap;">
                <select :value="alignment" @change="updateValue(($event.target as HTMLSelectElement).value)">
                    <option :value="TextOrientationEnum.Horizontal">Horizontal</option>
                    <option :value="TextOrientationEnum.VerticalLeft">VerticalLeft</option>
                </select>
            </div>
        </td>
    </tr>
</template>
