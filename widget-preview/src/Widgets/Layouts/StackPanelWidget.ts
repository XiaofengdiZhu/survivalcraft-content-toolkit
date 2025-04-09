import {type BoolString, LayoutDirection, type LayoutDirectionString, SizeLength, SizeLengthType, string2LayoutDirection, WidgetAlignment} from "../../Common.ts";
import {WidgetClass, type WidgetProps} from "../Widget.ts";
import type {CSSProperties} from "@vue/runtime-dom";
import {reactive, ref} from "vue";
import {AttributeType} from "../../Components/Inspector.ts";

export interface StackPanelWidgetProps extends WidgetProps {
    Direction?: LayoutDirectionString | LayoutDirection;
    IsInverted?: BoolString | boolean;
}

export class StackPanelWidgetClass extends WidgetClass<StackPanelWidgetProps> {
    direction = ref(LayoutDirection.Horizontal);
    isInverted = ref(false);
    isWidthInfinity = ref(false);
    isHeightInfinity = ref(false);
    realWidth = reactive(new SizeLength(-1));
    realHeight = reactive(new SizeLength(-1));

    get width(): number {
        return this.realWidth.value;
    }

    set width(_value: number) {
        return;
    }

    get height(): number {
        return this.realHeight.value;
    }

    set height(_value: number) {
        return;
    }

    updateFromProps(props: StackPanelWidgetProps) {
        super.updateFromProps(props);
        if (props.Direction !== undefined) {
            if (typeof props.Direction === "string") {
                this.direction.value = string2LayoutDirection(props.Direction);
            }
            else {
                this.direction.value = props.Direction;
            }
        }
        else {
            this.direction.value = LayoutDirection.Horizontal;
        }
        this.isInverted.value = props.IsInverted === "true" || this.props?.IsInverted === true;
    }

    getStyle(): CSSProperties {
        const style = super.getStyle();
        style.flexDirection = getFlexDirection(this.direction.value, this.isInverted.value);
        return style;
    }

    alignment2Style(horizontalAlignment?: WidgetAlignment,
        verticalAlignment?: WidgetAlignment,
        widthType?: SizeLengthType,
        heightType?: SizeLengthType): CSSProperties {
        const style: CSSProperties = {};
        const alignment = this.direction.value === LayoutDirection.Horizontal ?
            verticalAlignment :
            horizontalAlignment;
        switch (alignment) {
            case WidgetAlignment.Near:
                style.alignSelf = "flex-start";
                break;
            case WidgetAlignment.Center:
                style.alignSelf = "center";
                break;
            case WidgetAlignment.Far:
                style.alignSelf = "flex-end";
                break;
            default:
                style.alignSelf = "stretch";
        }

        if (this.direction.value === LayoutDirection.Horizontal) {
            switch (widthType) {
                case SizeLengthType.Fixed:
                    style.flexShrink = "0";
                    break;
                case SizeLengthType.PositiveInfinity:
                    style.flexGrow = "1";
                    break;
            }
        }
        else {
            switch (heightType) {
                case SizeLengthType.Fixed:
                    style.flexShrink = "0";
                    break;
                case SizeLengthType.PositiveInfinity:
                    style.flexGrow = "1";
                    break;
            }
        }

        return style;
    }

    updateSize() {
        let realWidth = -1;
        let realHeight = -1;
        if (this.children.length > 0) {
            for (const child of this.children) {
                if (realWidth !== Infinity) {
                    if (child.width == Infinity) {
                        realWidth = Infinity;
                    }
                    else {
                        if (this.direction.value === LayoutDirection.Horizontal) {
                            if (child.width > 0) {
                                if (realWidth === -1) {
                                    realWidth = child.width;
                                }
                                else {
                                    realWidth += child.width;
                                }
                            }
                        }
                        else if (child.width > realWidth) {
                            realWidth = child.width;
                        }
                    }
                }
                if (realHeight !== Infinity) {
                    if (child.height == Infinity) {
                        realHeight = Infinity;
                    }
                    else {
                        if (this.direction.value === LayoutDirection.Vertical) {
                            if (child.height > 0) {
                                if (realHeight === -1) {
                                    realHeight = child.height;
                                }
                                else {
                                    realHeight += child.height;
                                }
                            }
                        }
                        else if (child.height > realHeight) {
                            realHeight = child.height;
                        }
                    }
                }
            }
        }
        let flag = false;
        if (this.realWidth.value !== realWidth) {
            this.realWidth.value = realWidth;
            flag = true;
        }
        if (this.realHeight.value !== realHeight) {
            this.realHeight.value = realHeight;
            flag = true;
        }
        if (flag && this.parent) {
            this.parent.updateSize();
        }
    }

    initInspectorProvider() {
        super.initInspectorProvider();
        this.inspectorProvider.removeAttribute("Size");
        this.inspectorProvider.addAttribute<LayoutDirection>("Direction",
            AttributeType.LayoutDirection,
            () => this.direction.value,
            (value) => this.direction.value = value);
        this.inspectorProvider.addAttribute<boolean>("Is\u200BInverted",
            AttributeType.Boolean,
            () => this.isInverted.value,
            (value) => this.isInverted.value = value);
    }
}

function getFlexDirection(direction?: LayoutDirection, isInverted?: boolean) {
    if (direction !== LayoutDirection.Vertical) {
        return isInverted ? "row-reverse" : "row";
    }
    else {
        return isInverted ? "column-reverse" : "column";
    }
}
