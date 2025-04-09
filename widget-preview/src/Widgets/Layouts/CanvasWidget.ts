import {SizeLengthType, WidgetAlignment} from "../../Common.ts";
import {WidgetClass, type WidgetProps} from "../Widget.ts";
import type {CSSProperties} from "@vue/runtime-dom";
import {ref} from "vue";

export class CanvasWidgetClass<T extends WidgetProps = WidgetProps> extends WidgetClass<T> {
    widthFromChildren = ref(-1);
    heightFromChildren = ref(-1);

    get width(): number {
        if (this._width.type === SizeLengthType.FitContent) {
            return this.widthFromChildren.value;
        }
        else {
            return this._width.value;
        }
    }

    set width(value: number) {
        if (value !== this._width.value) {
            if (this.parent) {
                const oldWidth = this.width;
                this._width.value = value;
                if (this.width !== oldWidth) {
                    this.parent.updateSize();
                }
            }
            else {
                this._width.value = value;
            }
        }
    }

    get height(): number {
        if (this._height.type === SizeLengthType.FitContent) {
            return this.heightFromChildren.value;
        }
        else {
            return this._height.value;
        }
    }

    set height(value: number) {
        if (value !== this._height.value) {
            if (this.parent) {
                const oldHeight = this.height;
                this._height.value = value;
                if (this.height !== oldHeight) {
                    this.parent.updateSize();
                }
            }
            else {
                this._height.value = value;
            }
        }
    }

    alignment2Style(horizontalAlignment?: WidgetAlignment,
        verticalAlignment?: WidgetAlignment,
        _widthType?: SizeLengthType,
        _heightType?: SizeLengthType): CSSProperties {
        let style: CSSProperties = {position: "absolute"};
        let translateX = false;
        if (horizontalAlignment !== undefined) {
            switch (horizontalAlignment) {
                case WidgetAlignment.Near:
                    style.left = "0";
                    break;
                case WidgetAlignment.Center:
                    style.left = "50%";
                    translateX = true;
                    break;
                case WidgetAlignment.Far:
                    style.right = "0";
                    break;
                default:
                    style.left = "0";
                    style.right = "0";
                    break;
            }
        }
        if (verticalAlignment !== undefined) {
            switch (verticalAlignment) {
                case WidgetAlignment.Near:
                    style.top = "0";
                    if (translateX) {
                        style.translate = "-50% 0";
                    }
                    break;
                case WidgetAlignment.Center:
                    style.top = "50%";
                    if (translateX) {
                        style.translate = "-50% -50%";
                    }
                    else {
                        style.translate = "0 -50%";
                    }
                    break;
                case WidgetAlignment.Far:
                    style.bottom = "0";
                    if (translateX) {
                        style.translate = "-50% 0";
                    }
                    break;
                default:
                    style.top = "0";
                    style.bottom = "0";
                    if (translateX) {
                        style.translate = "-50% 0";
                    }
                    break;
            }
        }
        else if (translateX) {
            style.translate = "-50% 0";
        }
        return style;
    }

    updateSize() {
        if (this.children.length > 0) {
            let widthFromChildren = -1;
            let heightFromChildren = -1;
            for (const child of this.children) {
                if (widthFromChildren != Infinity) {
                    if (child.width == Infinity) {
                        widthFromChildren = Infinity;
                    }
                    else if (child.width > widthFromChildren) {
                        widthFromChildren = child.width;
                    }
                }
                if (heightFromChildren != Infinity) {
                    if (child.height == Infinity) {
                        heightFromChildren = Infinity;
                    }
                    else if (child.height > heightFromChildren) {
                        heightFromChildren = child.height;
                    }
                }
            }
            let flag = false;
            if (this.widthFromChildren.value != widthFromChildren) {
                this.widthFromChildren.value = widthFromChildren;
                flag = true;
            }
            if (this.heightFromChildren.value != heightFromChildren) {
                this.heightFromChildren.value = heightFromChildren;
                flag = true;
            }
            if (flag && this.parent && this._width.type === SizeLengthType.FitContent) {
                this.parent.updateSize();
            }
        }
    }

    afterInit() {
        this.isCanvasWidget = true;
    }
}
