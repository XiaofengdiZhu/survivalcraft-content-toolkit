import type {ButtonWidgetProps} from "./ButtonWidget.ts";
import {ButtonWidgetClass} from "./ButtonWidget.ts";
import {AttributeType} from "../Components/Inspector.ts";
import {ref} from "vue";

export interface BitmapButtonWidgetProps extends ButtonWidgetProps {
    NormalSubtexture?: string;
    ClickedSubtexture?: string;
}

export class BitmapButtonWidgetClass extends ButtonWidgetClass<BitmapButtonWidgetProps> {
    normalSubtexture = ref("");
    clickedSubtexture = ref("");

    updateFromProps(props: BitmapButtonWidgetProps) {
        super.updateFromProps(props);
        if (props.NormalSubtexture !== undefined) {
            this.normalSubtexture.value = props.NormalSubtexture;
        }
        else {
            this.normalSubtexture.value = "";
        }
        if (props.ClickedSubtexture !== undefined) {
            this.clickedSubtexture.value = props.ClickedSubtexture;
        }
        else {
            this.clickedSubtexture.value = "";
        }
    }

    initInspectorProvider() {
        super.initInspectorProvider();
        this.inspectorProvider.addAttribute<string>("Normal\u200BSubtexture",
            AttributeType.String,
            () => this.normalSubtexture.value,
            value => this.normalSubtexture.value = value);
        this.inspectorProvider.addAttribute<string>("Clicked\u200BSubtexture",
            AttributeType.String,
            () => this.clickedSubtexture.value,
            value => this.clickedSubtexture.value = value);
    }
}

export const bitmapButtonWidgetLinearDescents = new Map<string, string>([["Button.Rectangle",
    "BevelledRectangleWidget"],
    ["Button.Image", "RectangleWidget"],
    ["Button.Label", "LabelWidget"]]);
