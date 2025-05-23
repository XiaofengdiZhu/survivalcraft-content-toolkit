import {type BoolString, Color} from "../Common.ts";
import type {ButtonWidgetProps} from "./ButtonWidget.ts";
import {CanvasWidgetClass} from "./Layouts/CanvasWidget.ts";
import type {CSSProperties} from "@vue/runtime-dom";
import {ref} from "vue";
import {AttributeType} from "../Components/Inspector.ts";

export interface BevelledRectangleWidgetProps extends ButtonWidgetProps {
    RoundingRadius?: string | number;
    RoundingCount?: string | number;
    BevelSize?: string | number;
    AmbientLight?: string | number;
    DirectionalLight?: string | number;
    Texture?: string;// Not supported in this preview
    TextureScale?: string | number;
    TextureLinearFilter?: BoolString | boolean;
    CenterColor?: string | Color;
    BevelColor?: string | Color;
    ShadowColor?: string | Color;
    ShadowSize?: string | number;
    TextureOffset?: string;//number,number
}

export class BevelledRectangleWidgetClass extends CanvasWidgetClass<BevelledRectangleWidgetProps> {
    roundingRadius = ref(6);
    roundingCount = ref(3);
    bevelSize = ref(2);
    ambientLight = ref(0.6);
    directionalLight = ref(0.4);
    texture?: string;
    textureScale = ref(1);
    textureLinearFilter = ref(false);
    centerColor = ref(new Color(181, 172, 154));
    bevelColor = ref(new Color(181, 172, 154));
    shadowColor = ref(new Color(0, 0, 0, 32));
    shadowSize = ref(2);
    textureOffset?: string;

    updateFromProps(props: BevelledRectangleWidgetProps) {
        super.updateFromProps(props);
        if (props.RoundingRadius !== undefined) {
            if (typeof props.RoundingRadius === "string") {
                const num = parseFloat(props.RoundingRadius);
                this.roundingRadius.value = isNaN(num) ? 6 : num;
            }
            else {
                this.roundingRadius.value = props.RoundingRadius;
            }
        }
        else {
            this.roundingRadius.value = 6;
        }
        if (props.RoundingCount !== undefined) {
            if (typeof props.RoundingCount === "string") {
                const num = parseInt(props.RoundingCount);
                this.roundingCount.value = isNaN(num) ? 3 : num;
            }
            else {
                this.roundingCount.value = props.RoundingCount;
            }
        }
        else {
            this.roundingCount.value = 3;
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
        if (props.Texture !== undefined) {
            this.texture = props.Texture;
        }
        else {
            this.texture = undefined;
        }
        if (props.TextureScale !== undefined) {
            if (typeof props.TextureScale === "string") {
                const num = parseFloat(props.TextureScale);
                this.textureScale.value = isNaN(num) ? 1 : num;
            }
            else {
                this.textureScale.value = props.TextureScale;
            }
        }
        else {
            this.textureScale.value = 1;
        }
        this.textureLinearFilter.value = props.TextureLinearFilter === "true" || this.props?.TextureLinearFilter === true;
        if (props.CenterColor !== undefined) {
            this.centerColor.value.update(props.CenterColor);
        }
        else {
            this.centerColor.value.update(new Color(181, 172, 154));
        }
        if (props.BevelColor !== undefined) {
            this.bevelColor.value.update(props.BevelColor);
        }
        else {
            this.bevelColor.value.update(new Color(181, 172, 154));
        }
        if (props.ShadowColor !== undefined) {
            this.shadowColor.value.update(props.ShadowColor);
        }
        else {
            this.shadowColor.value.update(new Color(0, 0, 0, 32));
        }
        if (props.TextureOffset !== undefined) {
            this.textureOffset = props.TextureOffset;
        }
        else {
            this.textureOffset = undefined;
        }
    }

    getStyle(): CSSProperties {
        const style = super.getStyle();
        style.boxSizing = "border-box";
        if (this.roundingRadius.value > 0) {
            style.borderRadius = `${this.roundingRadius.value}px`;
        }
        if (this.bevelSize.value != 0) {
            style.padding = `${Math.abs(this.bevelSize.value)}px`;
            const color1 = this.bevelColor.value.darker(this.ambientLight.value + this.directionalLight.value);
            const color2 = this.bevelColor.value.darker(this.ambientLight.value - this.directionalLight.value);
            style.background = `linear-gradient(${this.bevelSize.value > 0 ?
                "165" :
                "-15"}deg, ${color1.toCssString()}, ${color2.toCssString()})`;
        }
        if (this.shadowSize.value > 0) {
            style.boxShadow = `${this.shadowColor.value.toCssString()} ${this.shadowSize.value}px ${this.shadowSize.value}px`;
        }
        return style;
    }

    getContentStyle(): CSSProperties {
        const style: CSSProperties = {width: "100%", height: "100%"};
        if (this.roundingRadius.value > 0) {
            style.borderRadius = `${this.roundingRadius.value}px`;
        }
        style.backgroundColor = this.centerColor.value.darker(0.6).toCssString();
        return style;
    }

    initInspectorProvider() {
        super.initInspectorProvider();
        this.inspectorProvider.addAttribute<number>("Rounding\u200BRadius",
            AttributeType.Number,
            () => this.roundingRadius.value,
            value => this.roundingCount.value = value);
        this.inspectorProvider.addAttribute<number>("Rounding\u200BCount",
            AttributeType.Integer,
            () => this.roundingCount.value,
            value => this.roundingCount.value = value);
        this.inspectorProvider.addAttribute<number>("Bevel\u200BSize",
            AttributeType.Number,
            () => this.bevelSize.value,
            value => this.bevelSize.value = value);
        this.inspectorProvider.addAttribute<number>("Ambient\u200BLight",
            AttributeType.Number,
            () => this.ambientLight.value,
            value => this.ambientLight.value = value);
        this.inspectorProvider.addAttribute<number>("Directional\u200BLight",
            AttributeType.Number,
            () => this.directionalLight.value,
            value => this.directionalLight.value = value);
        this.inspectorProvider.addAttribute<string>("Texture",
            AttributeType.String,
            () => this.texture ?? "",
            value => this.texture = value);
        this.inspectorProvider.addAttribute<number>("Texture\u200BScale",
            AttributeType.Number,
            () => this.textureScale.value,
            value => this.textureScale.value = value);
        this.inspectorProvider.addAttribute<boolean>("Texture\u200BLinear\u200BFilter",
            AttributeType.Boolean,
            () => this.textureLinearFilter.value,
            value => this.textureLinearFilter.value = value);
        this.inspectorProvider.addAttribute<string>("Center\u200BColor",
            AttributeType.Color,
            () => this.centerColor.value.toCssString(),
            value => this.centerColor.value.update(value));
        this.inspectorProvider.addAttribute<string>("Bevel\u200BColor",
            AttributeType.Color,
            () => this.bevelColor.value.toCssString(),
            value => this.bevelColor.value.update(value));
        this.inspectorProvider.addAttribute<string>("Shadow\u200BColor",
            AttributeType.Color,
            () => this.shadowColor.value.toCssString(),
            value => this.shadowColor.value.update(value));
        this.inspectorProvider.addAttribute<string>("Texture\u200BOffset",
            AttributeType.String,
            () => this.textureOffset ?? "",
            value => this.textureOffset = value);
    }
}
