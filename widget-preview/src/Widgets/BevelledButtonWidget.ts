import {ButtonWidgetClass, type ButtonWidgetProps} from "./ButtonWidget.ts";
import {ref} from "vue";
import {Color} from "../Common.ts";
import {AttributeType} from "../Components/Inspector.ts";

export interface BevelledButtonWidgetProps extends ButtonWidgetProps {
    FontScale?: string | number;
    Subtexture?: string;
    BevelColor?: string | Color;
    CenterColor?: string | Color;
    AmbientLight?: string | number;
    DirectionalLight?: string | number;
    BevelSize?: string | number;
}

export class BevelledButtonWidgetClass extends ButtonWidgetClass<BevelledButtonWidgetProps> {
    fontScale = ref(1);
    subtexture = ref("");
    bevelColor = ref(new Color(181, 172, 154));
    centerColor = ref(new Color(181, 172, 154));
    ambientLight = ref(0.6);
    directionalLight = ref(0.4);
    bevelSize = ref(2);

    updateFromProps(props: BevelledButtonWidgetProps) {
        super.updateFromProps(props);
        if (props.FontScale !== undefined) {
            if (typeof props.FontScale === "string") {
                const num = parseFloat(props.FontScale);
                this.fontScale.value = isNaN(num) ? 1 : num;
            }
            else {
                this.fontScale.value = props.FontScale;
            }
        }
        else {
            this.fontScale.value = 1;
        }
        if (props.Subtexture !== undefined) {
            this.subtexture.value = props.Subtexture;
        }
        else {
            this.subtexture.value = "";
        }
        if (props.BevelColor !== undefined) {
            this.bevelColor.value.update(props.BevelColor);
        }
        else {
            this.bevelColor.value.update(new Color(181, 172, 154));
        }
        if (props.CenterColor !== undefined) {
            this.centerColor.value.update(props.CenterColor);
        }
        else {
            this.centerColor.value.update(new Color(181, 172, 154));
        }
        if (props.AmbientLight !== undefined) {
            if (typeof props.AmbientLight === "string") {
                const num = parseFloat(props.AmbientLight);
                this.ambientLight.value = isNaN(num) ? 0.6 : num;
            }
            else {
                this.ambientLight.value = props.AmbientLight;
            }
        }
        else {
            this.ambientLight.value = 0.6;
        }
        if (props.DirectionalLight !== undefined) {
            if (typeof props.DirectionalLight === "string") {
                const num = parseFloat(props.DirectionalLight);
                this.directionalLight.value = isNaN(num) ? 0.4 : num;
            }
            else {
                this.directionalLight.value = props.DirectionalLight;
            }
        }
        else {
            this.directionalLight.value = 0.4;
        }
        if (props.BevelSize !== undefined) {
            if (typeof props.BevelSize === "string") {
                const num = parseFloat(props.BevelSize);
                this.bevelSize.value = isNaN(num) ? 2 : num;
            }
            else {
                this.bevelSize.value = props.BevelSize;
            }
        }
        else {
            this.bevelSize.value = 2;
        }
    }

    initInspectorProvider() {
        super.initInspectorProvider();
        this.inspectorProvider.addAttribute<number>("Font\u200BScale",
            AttributeType.Number,
            () => this.fontScale.value,
            value => this.fontScale.value = value);
        this.inspectorProvider.addAttribute<string>("Subtexture",
            AttributeType.String,
            () => this.subtexture.value,
            value => this.subtexture.value = value);
        this.inspectorProvider.addAttribute<Color>("Bevel\u200BColor",
            AttributeType.Color,
            () => this.bevelColor.value,
            value => this.bevelColor.value = new Color(value));
        this.inspectorProvider.addAttribute<Color>("Center\u200BColor",
            AttributeType.Color,
            () => this.centerColor.value,
            value => this.centerColor.value = new Color(value));
        this.inspectorProvider.addAttribute<number>("Ambient\u200BLight",
            AttributeType.Number,
            () => this.ambientLight.value,
            value => this.ambientLight.value = value);
        this.inspectorProvider.addAttribute<number>("Directional\u200BLight",
            AttributeType.Number,
            () => this.directionalLight.value,
            value => this.directionalLight.value = value);
        this.inspectorProvider.addAttribute<number>("Bevel\u200BSize",
            AttributeType.Number,
            () => this.bevelSize.value,
            value => this.bevelSize.value = value);
    }
}

export const bevelledButtonWidgetLinearDescents = new Map<string, string>([["BevelledButton.Canvas",
    "CanvasWidget"],
    ["BevelledButton.Rectangle", "BevelledRectangleWidget"],
    ["BevelledButton.Image", "RectangleWidget"],
    ["BevelledButton.Label", "LabelWidget"]]);
