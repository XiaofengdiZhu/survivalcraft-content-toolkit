<script setup lang="ts">
import type {AttributeInfo} from "./Inspector.ts";
import {ref, watch} from "vue";

const {attribute} = defineProps<{
    attribute: AttributeInfo<boolean>
}>();
const checked = ref(attribute.getter());

function updateValue(newValue: boolean) {
    attribute.setter(newValue);
}

watch(() => attribute.getter(), newValue => {
    if (checked.value !== newValue) {
        checked.value = newValue;
    }
});
</script>

<template>
    <tr>
        <td>{{attribute.title}}</td>
        <td>
            <div style="display: flex; justify-content: end;">
                <input type="checkbox" :id="attribute.title" :checked="checked" @change="updateValue(($event.target as HTMLInputElement).checked)"/><label :for="attribute.title" style="width: 36px; cursor: pointer;">{{checked}}</label>
            </div>
        </td>
    </tr>
</template>
