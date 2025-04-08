<script setup lang="ts">
import type {AttributeInfo} from "./Inspector.ts";
import {ref, watch} from "vue";

const {attribute} = defineProps<{
    attribute: AttributeInfo<string>
}>();
const str = ref(attribute.getter());

function updateValue(newValue: string) {
    attribute.setter(newValue);
}

watch(() => attribute.getter(), newValue => {
    if (str.value !== newValue) {
        str.value = newValue;
    }
});
</script>

<template>
    <tr>
        <td>{{attribute.title}}</td>
        <td>
            <div style="display: flex; justify-content: end;">
                <input type="text" :id="attribute.title" :value="str" @change="updateValue(($event.target as HTMLInputElement).value)" placeholder="undefined" style="width: 90px; text-align: right;"/>
            </div>
        </td>
    </tr>
</template>
