<script setup lang="ts">
import {type AttributeInfo, AttributeType} from "./Inspector.ts";
import {ref, watch} from "vue";

const {attribute} = defineProps<{
    attribute: AttributeInfo<number>
}>();
const num = ref(attribute.getter());
const infinity = ref(num.value === Infinity);
const inputNum = ref<HTMLInputElement | null>(null);

function updateValue(newValue: number) {
    if (attribute.type === AttributeType.Integer && newValue !== Infinity) {
        const oldValue = newValue;
        newValue = Math.floor(newValue);
        if (newValue !== oldValue) {
            if (newValue !== num.value) {
                num.value = newValue;
            }
            else if (inputNum.value) {
                inputNum.value.value = newValue.toString();
            }
        }
    }
    attribute.setter(newValue);
}

watch(() => attribute.getter(), newValue => {
    if (num.value !== newValue) {
        num.value = newValue;
        infinity.value = newValue === Infinity;
    }
});
</script>

<template>
    <tr>
        <td>{{attribute.title}}</td>
        <td>
            <div style="display: flex; justify-content: end; position: relative;">
                <input type="checkbox" class="infinity" :checked="infinity" @change="updateValue(($event.target as HTMLInputElement).checked ? Infinity : 0)"/> <input type="number" ref="inputNum" :value="num" :disabled="infinity" @change="updateValue(($event.target as HTMLInputElement).valueAsNumber)" style="width: 73px; text-align: right;"/>
                <div style="position: absolute; right: 14px; user-select: none;" v-if="infinity">Infinity</div>
            </div>
        </td>
    </tr>
</template>
