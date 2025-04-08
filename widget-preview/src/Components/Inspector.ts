import {ref, shallowRef} from "vue";
import type {WidgetClass} from "../Widgets/Widget.ts";

export const dialogReference = ref<HTMLElement | null>(null);
export const dialogWidget = shallowRef<WidgetClass | null>(null);
export const dialogWidgetChildren = ref<WidgetClass[]>([]);
export const displayDialog = ref(false);

let floatingDisplayTimeout: number | null = null;
let floatingHideTimeout: number | null = null;
let floatingHideTimeout2: number | null = null;
let lastEnterWidget: WidgetClass | null = null;
export const mouseInDialog = ref(false);
export const clickToDisplayDialog = ref(false);

export function openInspector(widget: WidgetClass, event?: Event) {
    clearInspectorTimeouts();
    dialogWidget.value?.htmlElement?.value?.classList.remove("beingInspected");
    if (!widget.isNoInspector) {
        dialogWidget.value = widget;
        dialogWidgetChildren.value = widget.children;
        displayDialog.value = true;
        dialogReference.value = widget.htmlElement?.value ?? null;
        dialogWidget.value?.htmlElement?.value?.classList.add("beingInspected");
        event?.stopPropagation();
    }
}

export function closeInspector() {
    clearInspectorTimeouts();
    dialogWidget.value?.htmlElement?.value?.classList.remove("beingInspected");
    displayDialog.value = false;
    floatingHideTimeout2 = setTimeout(() => {
        dialogWidget.value = null;
        dialogWidgetChildren.value = [];
        dialogReference.value = null;
    }, 330);
}

export function openInspectorDelay(widget: WidgetClass, event: Event) {
    if (!widget.isNoInspector) {
        if (clickToDisplayDialog.value) {
            const reference = event.currentTarget as HTMLElement;
            lastEnterWidget?.htmlElement?.value?.classList.remove("beingInspected");
            lastEnterWidget = widget;
            reference.classList.add("beingInspected");
        }
        else {
            clearInspectorTimeouts();
            const reference = event.currentTarget as HTMLElement;
            lastEnterWidget?.htmlElement?.value?.classList.remove("beingInspected");
            lastEnterWidget = widget;
            reference.classList.add("beingInspected");
            floatingDisplayTimeout = setTimeout(() => {
                floatingDisplayTimeout = null;
                if (widget === lastEnterWidget) {
                    if (dialogWidget.value !== widget) {
                        dialogWidget.value?.htmlElement?.value?.classList.remove("beingInspected");
                        dialogWidget.value = widget;
                        dialogWidget.value?.htmlElement?.value?.classList.add("beingInspected");
                    }
                    dialogWidgetChildren.value = widget.children;
                    dialogReference.value = reference;
                    displayDialog.value = true;
                }
            }, 500);
        }
    }
}

export function closeInspectorDelay(widget?: WidgetClass) {
    if (widget?.isNoInspector) {
        return;
    }
    if (clickToDisplayDialog.value) {
        lastEnterWidget?.htmlElement?.value?.classList.remove("beingInspected");
        if (dialogWidget.value) {
            dialogWidget.value.htmlElement?.value?.classList.add("beingInspected");
        }
    }
    else {
        clearInspectorTimeouts();
        if (dialogWidget.value !== lastEnterWidget) {
            lastEnterWidget?.htmlElement?.value?.classList.remove("beingInspected");
        }
        lastEnterWidget = null;
        floatingHideTimeout = setTimeout(() => {
            if (!mouseInDialog.value) {
                floatingHideTimeout = null;
                if (dialogWidget.value) {
                    dialogWidget.value.htmlElement?.value?.classList.remove("beingInspected");
                }
                displayDialog.value = false;
                floatingHideTimeout2 = setTimeout(() => {
                    floatingHideTimeout2 = null;
                    dialogWidget.value = null;
                    dialogWidgetChildren.value = [];
                    dialogReference.value = null;
                }, 330);
            }
        }, 500);
    }
}

function clearInspectorTimeouts() {
    if (floatingDisplayTimeout !== null) {
        clearTimeout(floatingDisplayTimeout);
        floatingDisplayTimeout = null;
    }
    if (floatingHideTimeout !== null) {
        clearTimeout(floatingHideTimeout);
        floatingHideTimeout = null;
    }
    if (floatingHideTimeout2 !== null) {
        clearTimeout(floatingHideTimeout2);
        floatingHideTimeout2 = null;
    }
}

export enum ColorChannelType {
    Red, Green, Blue, Alpha
}

export interface ColorPickerInfo {
    channel: ColorChannelType;
    xGetter: () => number;
    xSetter: (value: number) => void;
    RGBGetter: () => string;
    RGBHighContrast: () => string;
    start: string;
    end: string;
}

export const displayColorPicker = ref(false);
export const mouseInColorPicker = ref(false);
let colorPickerHideTimeout1: number | null = null;
let colorPickerHideTimeout2: number | null = null;
export let colorPickerReference = ref<HTMLElement | null>(null);
export let colorPickerInfo = ref<ColorPickerInfo | null>(null);

export function openColorPicker(info: ColorPickerInfo, event: Event) {
    clearColorPickerTimeouts();
    colorPickerInfo.value = info;
    colorPickerReference.value = event.currentTarget as HTMLElement;
    displayColorPicker.value = true;
}

export function closeColorPicker() {
    clearColorPickerTimeouts();
    colorPickerHideTimeout1 = setTimeout(() => {
        if (!mouseInColorPicker.value) {
            colorPickerHideTimeout1 = null;
            displayColorPicker.value = false;
            colorPickerHideTimeout2 = setTimeout(() => {
                colorPickerReference.value = null;
                colorPickerHideTimeout2 = null;
            }, 330);
        }
    }, 330);
}

function clearColorPickerTimeouts() {
    if (colorPickerHideTimeout1 !== null) {
        clearTimeout(colorPickerHideTimeout1);
        colorPickerHideTimeout1 = null;
    }
    if (colorPickerHideTimeout2 !== null) {
        clearTimeout(colorPickerHideTimeout2);
        colorPickerHideTimeout2 = null;
    }
}

export enum AttributeType {
    String, Boolean, Number,//float
    Integer, Vector2, WidgetAlignment, LayoutDirection, Color, TextAnchors, TextOrientation
}

export interface AttributeInfo<T extends unknown> {
    title: string,
    type: AttributeType,
    getter: () => T,
    setter: (value: T) => void
}

export class InspectorProvider {
    widgetName: string;
    attributes: AttributeInfo<unknown>[] = [];

    constructor(widgetName: string) {
        this.widgetName = widgetName;
    }

    addAttribute<T extends unknown>(title: string,
        type: AttributeType,
        getter: () => T,
        setter: (value: T) => void) {
        this.attributes.push({
            title, type, getter, setter: setter as (value: unknown) => void
        });
    }

    removeAttribute(title: string) {
        this.attributes = this.attributes.filter(attribute => attribute.title !== title);
    }
}
