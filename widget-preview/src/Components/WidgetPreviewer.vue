<script setup lang="ts">
import {type Component, shallowRef, watch} from "vue";
import {widgetToPreview} from "../main.ts";
import {createComponentFromString} from "../WidgetManager.ts";

const componentToPreview = shallowRef<Component | null>(null);

watch(widgetToPreview, newWidget => {
    if (newWidget) {
        //console.log("Previewing widget:", newWidget);
        componentToPreview.value = createComponentFromString(newWidget.name,
            newWidget.content,
            false);
    }
});
</script>

<template>
    <component v-if="componentToPreview" :is="componentToPreview"/>
    <div v-else :class="$style.loading">
        <!--TODO: BusyBarWidget-->
        <svg width="40" height="40" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M13.917 7A6.002 6.002 0 0 0 2.083 7H1.071a7.002 7.002 0 0 1 13.858 0h-1.012z"/>
        </svg>
    </div>
</template>

<style module>

.loading {
    position: absolute;
    top: 50%;
    left: 50%;
    translate: -50% -50%;
    animation: spin 1.5s linear infinite;
}

@keyframes spin {
    to {
        rotate: 360deg;
    }
}
</style>
