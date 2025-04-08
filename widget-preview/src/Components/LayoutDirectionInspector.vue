<script setup lang="ts">
import type {AttributeInfo} from "./Inspector.ts";
import {ref, watch} from "vue";
import {type LayoutDirection, LayoutDirection as LayoutDirectionEnum} from "../Common.ts";

const {attribute} = defineProps<{
    attribute: AttributeInfo<LayoutDirection>
}>();
const direction = ref(attribute.getter());

function updateValue(newValue: string) {
    attribute.setter(parseInt(newValue));
}

watch(() => attribute.getter(), newValue => {
    if (direction.value !== newValue) {
        direction.value = newValue;
    }
});
</script>

<template>
    <tr>
        <td>{{attribute.title}}</td>
        <td>
            <div style="display: flex; justify-content: end; gap: 8px; flex-wrap: wrap;">
                <select :value="direction" @change="updateValue(($event.target as HTMLSelectElement).value)">
                    <option :value="LayoutDirectionEnum.Horizontal">Horizontal</option>
                    <option :value="LayoutDirectionEnum.Vertical">Vertical</option>
                </select>
            </div>
        </td>
    </tr>
</template>
