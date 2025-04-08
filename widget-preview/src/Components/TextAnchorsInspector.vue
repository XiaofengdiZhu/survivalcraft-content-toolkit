<script setup lang="ts">
import type {AttributeInfo} from "./Inspector.ts";
import {ref, watch} from "vue";
import {type TextAnchor, TextAnchor as TextAnchorEnum} from "../Common.ts";

const {attribute} = defineProps<{
    attribute: AttributeInfo<Set<TextAnchor>>
}>();

const anchorX = ref(TextAnchorEnum.Default);
const anchorY = ref(TextAnchorEnum.Default);
const disableSnapToPixels = ref(false);

updateFromOriginalAnchors(attribute.getter());

function updateAnchorX(newValue: string) {
    const oldAnchors = attribute.getter();
    const newAnchorX = parseInt(newValue) as TextAnchor;
    switch (newAnchorX) {
        case TextAnchorEnum.Left:
            oldAnchors.delete(TextAnchorEnum.HorizontalCenter);
            oldAnchors.delete(TextAnchorEnum.Right);
            if (oldAnchors.delete(TextAnchorEnum.Center)) {
                oldAnchors.add(TextAnchorEnum.VerticalCenter);
            }
            break;
        case TextAnchorEnum.HorizontalCenter:
            oldAnchors.delete(TextAnchorEnum.Left);
            oldAnchors.delete(TextAnchorEnum.Right);
            if (oldAnchors.delete(TextAnchorEnum.VerticalCenter)) {
                oldAnchors.add(TextAnchorEnum.Center);
            }
            else if (!oldAnchors.has(TextAnchorEnum.Center)) {
                oldAnchors.add(TextAnchorEnum.HorizontalCenter);
            }
            break;
        case TextAnchorEnum.Right:
            oldAnchors.delete(TextAnchorEnum.HorizontalCenter);
            if (oldAnchors.delete(TextAnchorEnum.Center)) {
                oldAnchors.add(TextAnchorEnum.VerticalCenter);
            }
            oldAnchors.add(TextAnchorEnum.Right);
            break;
    }
    attribute.setter(new Set(oldAnchors));
}

function updateAnchorY(newValue: string) {
    const oldAnchors = attribute.getter();
    const newAnchorY = parseInt(newValue) as TextAnchor;
    switch (newAnchorY) {
        case TextAnchorEnum.Top:
            oldAnchors.delete(TextAnchorEnum.VerticalCenter);
            oldAnchors.delete(TextAnchorEnum.Bottom);
            if (oldAnchors.delete(TextAnchorEnum.Center)) {
                oldAnchors.add(TextAnchorEnum.HorizontalCenter);
            }
            break;
        case TextAnchorEnum.VerticalCenter:
            oldAnchors.delete(TextAnchorEnum.Top);
            oldAnchors.delete(TextAnchorEnum.Bottom);
            if (oldAnchors.delete(TextAnchorEnum.HorizontalCenter)) {
                oldAnchors.add(TextAnchorEnum.Center);
            }
            else if (!oldAnchors.has(TextAnchorEnum.Center)) {
                oldAnchors.add(TextAnchorEnum.VerticalCenter);
            }
            break;
        case TextAnchorEnum.Bottom:
            oldAnchors.delete(TextAnchorEnum.VerticalCenter);
            if (oldAnchors.delete(TextAnchorEnum.Center)) {
                oldAnchors.add(TextAnchorEnum.HorizontalCenter);
            }
            oldAnchors.add(TextAnchorEnum.Bottom);
            break;
    }
    attribute.setter(new Set(oldAnchors));
}

function updateDisableSnapToPixels(newValue: boolean) {
    const oldAnchors = attribute.getter();
    if (newValue && !oldAnchors.has(TextAnchorEnum.DisableSnapToPixels)) {
        attribute.setter(new Set(oldAnchors.add(TextAnchorEnum.DisableSnapToPixels)));
    }
    else if (!newValue && oldAnchors.has(TextAnchorEnum.DisableSnapToPixels)) {
        oldAnchors.delete(TextAnchorEnum.DisableSnapToPixels);
        attribute.setter(new Set(oldAnchors));
    }
}

watch(() => attribute.getter(), newValue => {
    updateFromOriginalAnchors(newValue);
});

function updateFromOriginalAnchors(anchors: Set<TextAnchorEnum>) {
    let newAnchorX = TextAnchorEnum.Left;
    let newAnchorY = TextAnchorEnum.Top;
    for (const anchor of anchors) {
        switch (anchor) {
            case TextAnchorEnum.DisableSnapToPixels:
                disableSnapToPixels.value = true;
                break;
            case TextAnchorEnum.Center:
                newAnchorX = TextAnchorEnum.HorizontalCenter;
                newAnchorY = TextAnchorEnum.VerticalCenter;
                break;
            case TextAnchorEnum.HorizontalCenter:
                newAnchorX = TextAnchorEnum.HorizontalCenter;
                break;
            case TextAnchorEnum.VerticalCenter:
                newAnchorY = TextAnchorEnum.VerticalCenter;
                break;
            case TextAnchorEnum.Right:
                if (newAnchorX !== TextAnchorEnum.HorizontalCenter) {
                    newAnchorX = TextAnchorEnum.Right;
                }
                break;
            case TextAnchorEnum.Bottom:
                if (newAnchorY !== TextAnchorEnum.VerticalCenter) {
                    newAnchorY = TextAnchorEnum.Bottom;
                }
                break;
        }
    }
    if (anchorX.value !== newAnchorX) {
        anchorX.value = newAnchorX;
    }
    if (anchorY.value !== newAnchorY) {
        anchorY.value = newAnchorY;
    }
}
</script>

<template>
    <tr>
        <td>{{attribute.title}}</td>
        <td>
            <div style="display: flex; justify-content: end; gap: 8px; flex-wrap: wrap;">
                <div>X:
                    <select :value="anchorX" @change="updateAnchorX(($event.target as HTMLSelectElement).value)">
                        <option :value="TextAnchorEnum.Left">Left</option>
                        <option :value="TextAnchorEnum.HorizontalCenter">HorizontalCenter</option>
                        <option :value="TextAnchorEnum.Right">Right</option>
                    </select>
                </div>
                <div>Y:
                    <select :value="anchorY" @change="updateAnchorY(($event.target as HTMLSelectElement).value)">
                        <option :value="TextAnchorEnum.Top">Top</option>
                        <option :value="TextAnchorEnum.VerticalCenter">VerticalCenter</option>
                        <option :value="TextAnchorEnum.Bottom">Bottom</option>
                    </select>
                </div>
            </div>
            <div style="display: flex; justify-content: end; gap: 6px; margin-top: 8px;">
                <input type="checkbox" id="disableSnapToPixels" :checked="disableSnapToPixels" @change="updateDisableSnapToPixels(($event.target as HTMLInputElement).checked)"><label for="disableSnapToPixels" style="cursor: pointer;">DisableSnapToPixels</label>
            </div>
        </td>
    </tr>
</template>
