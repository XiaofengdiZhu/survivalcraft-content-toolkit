import {type BoolString, Color} from "../Common.ts";
import type {ButtonWidgetProps} from "./ButtonWidget.ts";
import {CanvasWidgetClass} from "./CanvasWidget.ts";
import type {CSSProperties} from "@vue/runtime-dom";
import {ref} from "vue";
import {AttributeType} from "../Components/Inspector.ts";

export interface BevelledRectangleWidgetProps extends ButtonWidgetProps {
    RoundingRadius?: string | number;
    RoundingCount?: string | number;
    BevelSize?: string | number;
    AmbientLight?: string | number;
    DirectionalLight?: string | number;
    Texture?: string;
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
                if (!isNaN(num)) {
                    this.roundingRadius.value = num;
                }
            }
            else {
                this.roundingRadius.value = props.RoundingRadius;
            }
        }
        if (props.RoundingCount !== undefined) {
            if (typeof props.RoundingCount === "string") {
                const num = parseInt(props.RoundingCount);
                if (!isNaN(num)) {
                    this.roundingCount.value = num;
                }
            }
            else {
                this.roundingCount.value = props.RoundingCount;
            }
        }
        if (props.BevelSize !== undefined) {
            if (typeof props.BevelSize === "string") {
                const num = parseFloat(props.BevelSize);
                if (!isNaN(num)) {
                    this.bevelSize.value = num;
                }
            }
            else {
                this.bevelSize.value = props.BevelSize;
            }
        }
        if (props.AmbientLight !== undefined) {
            if (typeof props.AmbientLight === "string") {
                const num = parseFloat(props.AmbientLight);
                if (!isNaN(num)) {
                    this.ambientLight.value = num;
                }
            }
            else {
                this.ambientLight.value = props.AmbientLight;
            }
        }
        if (props.DirectionalLight !== undefined) {
            if (typeof props.DirectionalLight === "string") {
                const num = parseFloat(props.DirectionalLight);
                if (!isNaN(num)) {
                    this.directionalLight.value = num;
                }
            }
            else {
                this.directionalLight.value = props.DirectionalLight;
            }
        }
        if (props.Texture !== undefined) {
            this.texture = props.Texture;
        }
        if (props.TextureScale !== undefined) {
            if (typeof props.TextureScale === "string") {
                const num = parseFloat(props.TextureScale);
                if (!isNaN(num)) {
                    this.textureScale.value = num;
                }
            }
            else {
                this.textureScale.value = props.TextureScale;
            }
        }
        if (props.TextureLinearFilter === "true" || this.props?.TextureLinearFilter === true) {
            this.textureLinearFilter.value = true;
        }
        if (props.CenterColor !== undefined) {
            this.centerColor.value.update(props.CenterColor);
        }
        if (props.BevelColor !== undefined) {
            this.bevelColor.value.update(props.BevelColor);
        }
        if (props.ShadowColor !== undefined) {
            this.shadowColor.value.update(props.ShadowColor);
        }
        if (props.TextureOffset !== undefined) {
            this.textureOffset = props.TextureOffset;
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
