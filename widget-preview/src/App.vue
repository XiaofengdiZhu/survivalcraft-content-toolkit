<script setup lang="ts">
import {languageNames, languageSelected, requestLanguageStrings} from "./main.ts";
import {onMounted, onUnmounted, ref, watch} from "vue";
import type {CSSProperties} from "@vue/runtime-dom";
import FloatingDialog from "./Components/FloatingDialog.vue";
import {clickToDisplayDialog, closeInspector} from "./Components/Inspector.ts";
import WidgetPreviewer from "./Components/WidgetPreviewer.vue";

const previewContainer = ref<HTMLElement | null>(null);
const previewContainerUserWidth = ref(0);
const previewContainerUserHeight = ref(0);
let previewContainerLastScale = 1;
const previewContainerScaleSetting = ref("0.75");
const previewContainerStyle = ref<CSSProperties>({});

const previewContainerResizeObserver = new ResizeObserver(entries => {
    const rect = entries[0].contentRect;
    if (rect) {
        if (Math.round(previewContainerUserWidth.value) !== Math.round(rect.width) || Math.round(
            previewContainerUserHeight.value) !== Math.round(rect.height)) {
            previewContainerUserWidth.value = rect.width;
            previewContainerUserHeight.value = rect.height;
            updatePreviewContainerStyle();
        }
    }
});

onMounted(() => {
    previewContainerUserWidth.value = previewContainer.value?.clientWidth ?? 0;
    previewContainerUserHeight.value = previewContainer.value?.clientHeight ?? 0;
    updatePreviewContainerStyle();
    previewContainerResizeObserver.observe(previewContainer.value!);
});

onUnmounted(() => {
    previewContainerResizeObserver.disconnect();
});

watch(previewContainerScaleSetting, () => {
    updatePreviewContainerStyle();
});

function updatePreviewContainerStyle() {
    const targetScale = Number(previewContainerScaleSetting.value);
    const num = 850 / targetScale;
    const userWidth = previewContainerUserWidth.value * previewContainerLastScale;
    const userHeight = previewContainerUserHeight.value * previewContainerLastScale;
    let scale = userWidth / num;
    let availableWidth = num;
    let availableHeight = num / userWidth * userHeight;
    const num3 = num * 9 / 16;
    if (userHeight / scale < num3) {
        scale = userHeight / num3;
        availableWidth = num3 / userHeight * userWidth;
        availableHeight = num3;
    }
    previewContainerLastScale = scale;
    previewContainerUserWidth.value = Math.round(availableWidth);
    previewContainerUserHeight.value = Math.round(availableHeight);
    const maxSize = `${95 / scale}%`;
    previewContainerStyle.value = {
        width: `${previewContainerUserWidth.value}px`,
        height: `${previewContainerUserHeight.value}px`,
        maxWidth: maxSize,
        maxHeight: maxSize,
        scale: scale.toString()
    };
}
</script>

<template>
    <div id="configurationArea" @click="closeInspector">
        <div class="configurationItem">
            <button id="clickToDisplayDialogSwitch" :class="clickToDisplayDialog ? 'active' : ''" @click="clickToDisplayDialog = !clickToDisplayDialog">
                <svg width="18" height="18" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                    <path d="M15 5.5a4.394 4.394 0 0 1-4 4.5 2.955 2.955 0 0 0-.2-1A3.565 3.565 0 0 0 14 5.5a3.507 3.507 0 0 0-7-.3A3.552 3.552 0 0 0 6 5a4.622 4.622 0 0 1 4.5-4A4.481 4.481 0 0 1 15 5.5zM5.5 6a4.5 4.5 0 1 0 0 9.001 4.5 4.5 0 0 0 0-9z"/>
                </svg>
            </button>
        </div>
        <div class="configurationItem" style="margin-left: auto;">
            <label for="languageSelector">
                <svg width="24" height="24" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M8.5 1a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zm4.894 4a5.527 5.527 0 0 0-3.053-2.676c.444.84.765 1.74.953 2.676h2.1zm.582 2.995A5.11 5.11 0 0 0 14 7.5a5.464 5.464 0 0 0-.213-1.5h-2.342c.032.331.055.664.055 1a10.114 10.114 0 0 1-.206 2h2.493c.095-.329.158-.665.19-1.005zm-3.535 0l.006-.051A9.04 9.04 0 0 0 10.5 7a8.994 8.994 0 0 0-.076-1H6.576A8.82 8.82 0 0 0 6.5 7a8.98 8.98 0 0 0 .233 2h3.534c.077-.332.135-.667.174-1.005zM10.249 5a8.974 8.974 0 0 0-1.255-2.97C8.83 2.016 8.666 2 8.5 2a3.62 3.62 0 0 0-.312.015l-.182.015L8 2.04A8.97 8.97 0 0 0 6.751 5h3.498zM5.706 5a9.959 9.959 0 0 1 .966-2.681A5.527 5.527 0 0 0 3.606 5h2.1zM3.213 6A5.48 5.48 0 0 0 3 7.5 5.48 5.48 0 0 0 3.213 9h2.493A10.016 10.016 0 0 1 5.5 7c0-.336.023-.669.055-1H3.213zm2.754 4h-2.36a5.515 5.515 0 0 0 3.819 2.893A10.023 10.023 0 0 1 5.967 10zM8.5 12.644A8.942 8.942 0 0 0 9.978 10H7.022A8.943 8.943 0 0 0 8.5 12.644zM11.033 10a10.024 10.024 0 0 1-1.459 2.893A5.517 5.517 0 0 0 13.393 10h-2.36z"/>
                </svg>
            </label>
            <select id="languageSelector" v-model="languageSelected" @change="requestLanguageStrings((($event.target) as HTMLSelectElement).value)" style="min-width: 120px;">
                <option v-for="(languageNativeName, languageName) in languageNames" :value="languageName">{{
                        languageNativeName}}
                </option>
            </select></div>
        <div class="configurationItem">
            <label for="scaleRanger">
                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                    <path d="M15.25 0a8.25 8.25 0 0 0-6.18 13.72L1 22.88l1.12 1 8.05-9.12A8.251 8.251 0 1 0 15.25.01V0zm0 15a6.75 6.75 0 1 1 0-13.5 6.75 6.75 0 0 1 0 13.5z"/>
                </svg>
            </label>
            <input type="range" id="scaleRanger" min="0.1" max="2" step="0.05" v-model="previewContainerScaleSetting" style="margin-top: 10px;"/>
            <label for="scaleRanger" style="width: 48px;">{{
                    (parseFloat(previewContainerScaleSetting) * 100).toFixed(0)}}%</label>
        </div>
    </div>
    <div id="previewArea" @click="closeInspector">
        <div id="previewContainer" ref="previewContainer" :style="previewContainerStyle">
            <WidgetPreviewer/>
        </div>
    </div>
    <FloatingDialog/>
</template>
<style scoped>
#clickToDisplayDialogSwitch {
    width: 28px;
    height: 28px;
    padding: 5px;

    &.active {
        background-color: var(--vscode-button-background);
    }
}
</style>
