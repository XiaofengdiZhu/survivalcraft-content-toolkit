import {CanvasWidgetClass} from "./CanvasWidget.ts";
import {defaultRectangleWidgetProps} from "../RectangleWidget.ts";
import {ref} from "vue";
import {LayoutDirection, type LayoutDirectionString, string2LayoutDirection} from "../../Common.ts";
import type {CSSProperties} from "@vue/runtime-dom";
import type {WidgetProps} from "../Widget.ts";

export interface ScrollPanelWidgetProps extends WidgetProps {
    Direction?: LayoutDirectionString | LayoutDirection;
}

export const defaultScrollPanelWidgetProps = {
    ...defaultRectangleWidgetProps, ClampToBounds: true
};

export class ScrollPanelWidgetClass extends CanvasWidgetClass<ScrollPanelWidgetProps> {
    direction = ref(LayoutDirection.Horizontal);

    updateFromProps(props: ScrollPanelWidgetProps) {
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
    }

    getStyle(): CSSProperties {
        const style = super.getStyle();
        if (this.direction.value === LayoutDirection.Horizontal) {
            style.overflowX = "auto";
        }
        else {
            style.overflowY = "auto";
        }
        return style;
    }
}
