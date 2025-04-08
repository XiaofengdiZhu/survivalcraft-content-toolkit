<script setup lang="ts">
import type {AttributeInfo} from "./Inspector.ts";
import {ref, watch} from "vue";
import {type WidgetAlignment, WidgetAlignment as WidgetAlignmentEnum} from "../Common.ts";

const {attribute} = defineProps<{
    attribute: AttributeInfo<WidgetAlignment>
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
                    <option :value="WidgetAlignmentEnum.Near">Near</option>
                    <option :value="WidgetAlignmentEnum.Center">Center</option>
                    <option :value="WidgetAlignmentEnum.Far">Far</option>
                    <option :value="WidgetAlignmentEnum.Stretch">Stretch</option>
                </select>
            </div>
        </td>
    </tr>
</template>
