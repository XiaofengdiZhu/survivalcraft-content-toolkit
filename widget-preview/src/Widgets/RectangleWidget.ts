import {type BoolString, Color, type Vector2} from "../Common.ts";
import {defaultWidgetProps, WidgetClass, type WidgetProps} from "./Widget.ts";
import type {CSSProperties} from "@vue/runtime-dom";
import {ref, watch} from "vue";
import {AttributeType} from "../Components/Inspector.ts";
import {atlasDefinition, getImageBitmap} from "../main.ts";

export interface RectangleWidgetProps extends WidgetProps {
    Depth?: string | number;
    DepthWriteEnabled?: BoolString | boolean;
    Subtexture?: string;
    TextureWrap?: BoolString | boolean;//Not supported in this preview
    TextureLinearFilter?: BoolString | boolean;
    FlipHorizontal?: BoolString | boolean;
    FlipVertical?: BoolString | boolean;
    FillColor?: string | Color;
    OutlineColor?: string | Color;
    OutlineThickness?: string | number;
    Texcoord1?: string;//number,number
    Texcoord2?: string;//number,number
}

export const defaultRectangleWidgetProps = {
    ...defaultWidgetProps, Size: "Infinity,Infinity"
};

export class RectangleWidgetClass extends WidgetClass<RectangleWidgetProps> {
    depth = ref(0);
    depthWriteEnabled = ref(false);
    subtexture = ref("");
    textureWrap = ref(false);
    textureLinearFilter = ref(true);
    flipHorizontal = ref(false);
    flipVertical = ref(false);
    fillColor = ref(new Color(0, 0, 0, 255));
    outlineColor = ref(new Color(255, 255, 255, 255));
    outlineThickness = ref(1);
    texcoord1X = ref(0);
    texcoord1Y = ref(0);
    texcoord2X = ref(1);
    texcoord2Y = ref(1);

    filterId: string = Math.random().toString(36).slice(2, 15);
    canvasElement = ref<HTMLCanvasElement | null>(null);

    updateCanvas() {
        this.clearCanvas();
        if (this.subtexture.value.length > 0) {
            if (this.subtexture.value.startsWith("{Textures/Atlas/")) {
                const name = this.subtexture.value.replace("{Textures/Atlas/", "").replace("}", "");
                const definition = atlasDefinition[name] as {
                    sx: number,
                    sy: number,
                    sWidth: number,
                    sHeight: number
                };
                if (definition) {
                    getImageBitmap("Atlases\\AtlasTexture")
                    .then((bitmap) => {
                        if (bitmap === null) {
                            return;
                        }
                        const element = this.canvasElement.value;
                        if (element) {
                            const sx = this.texcoord1X.value * definition.sWidth + definition.sx;
                            const sy = this.texcoord1Y.value * definition.sHeight + definition.sy;
                            const sWidth = (this.texcoord2X.value - this.texcoord1X.value) * definition.sWidth;
                            const sHeight = (this.texcoord2Y.value - this.texcoord1Y.value) * definition.sHeight;
                            element.width = sWidth;
                            element.height = sHeight;
                            element.getContext("2d")
                            ?.drawImage(bitmap, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);
                        }
                    })
                    .catch(error => console.log(error));
                }
            }
            else {
                getImageBitmap(this.subtexture.value.replace("{", "")
                .replace("}", "")
                .replaceAll("/", "\\"))
                .then((bitmap) => {
                    if (bitmap === null) {
                        return;
                    }
                    if (this.texcoord1X.value === 0 && this.texcoord1Y.value === 0 && this.texcoord2X.value === 1 && this.texcoord2Y.value === 1) {
                        const element = this.canvasElement.value;
                        if (element) {
                            element.width = bitmap.width;
                            element.height = bitmap.height;
                            element.getContext("2d")
                            ?.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height);
                        }
                    }
                    else {
                        const element = this.canvasElement.value;
                        if (element) {
                            const sx = this.texcoord1X.value * bitmap.width;
                            const sy = this.texcoord1Y.value * bitmap.height;
                            const sWidth = this.texcoord2X.value * bitmap.width - sx;
                            const sHeight = this.texcoord2Y.value * bitmap.height - sy;
                            element.width = sWidth;
                            element.height = sHeight;
                            element.getContext("2d")
                            ?.drawImage(bitmap, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);
                        }
                    }
                });
            }
        }
    }

    clearCanvas() {
        this.canvasElement.value?.getContext("2d")
        ?.clearRect(0, 0, this.canvasElement.value.width, this.canvasElement.value.height);
    }

    updateFromProps(props: RectangleWidgetProps) {
        super.updateFromProps(props);
        if (props.Depth !== undefined) {
            if (typeof props.Depth === "string") {
                const num = parseInt(props.Depth);
                if (!isNaN(num)) {
                    this.depth.value = num;
                }
            }
            else {
                this.depth.value = props.Depth;
            }
        }
        else {
            this.depth.value = 0;
        }
        this.depthWriteEnabled.value = props.DepthWriteEnabled === "true" || props.DepthWriteEnabled === true;
        this.textureWrap.value = props.TextureWrap === "true" || props.TextureWrap === true;
        this.textureLinearFilter.value = !(props.TextureLinearFilter === "false" || props.TextureLinearFilter === false);
        this.flipHorizontal.value = props.FlipHorizontal === "true" || props.FlipHorizontal === true;
        this.flipVertical.value = props.FlipVertical === "true" || props.FlipVertical === true;
        if (props.FillColor !== undefined) {
            this.fillColor.value.update(props.FillColor);
        }
        else {
            this.fillColor.value.update(new Color(0, 0, 0, 255));
        }
        if (props.OutlineColor !== undefined) {
            this.outlineColor.value.update(props.OutlineColor);
        }
        else {
            this.outlineColor.value.update(new Color(255, 255, 255, 255));
        }
        if (props.OutlineThickness !== undefined) {
            if (typeof props.OutlineThickness === "string") {
                const num = parseFloat(props.OutlineThickness);
                if (!isNaN(num)) {
                    this.outlineThickness.value = num;
                }
            }
            else {
                this.outlineThickness.value = props.OutlineThickness;
            }
        }
        else {
            this.outlineThickness.value = 1;
        }
        if (props.Texcoord1 !== undefined) {
            const array = props.Texcoord1.split(",");
            if (array.length > 1) {
                const num1 = parseFloat(array[0].trim());
                if (!isNaN(num1)) {
                    this.texcoord1X.value = num1;
                }
                const num2 = parseFloat(array[1].trim());
                if (!isNaN(num2)) {
                    this.texcoord1Y.value = num2;
                }
            }
        }
        else {
            this.texcoord1X.value = 0;
            this.texcoord1Y.value = 0;
        }
        if (props.Texcoord2 !== undefined) {
            const array = props.Texcoord2.split(",");
            if (array.length > 1) {
                const num1 = parseFloat(array[0].trim());
                if (!isNaN(num1)) {
                    this.texcoord2X.value = num1;
                }
                const num2 = parseFloat(array[1].trim());
                if (!isNaN(num2)) {
                    this.texcoord2Y.value = num2;
                }
            }
        }
        else {
            this.texcoord2X.value = 1;
            this.texcoord2Y.value = 1;
        }
        if (props.Subtexture !== undefined) {
            this.subtexture.value = props.Subtexture;
            this.updateCanvas();
        }
        else {
            this.subtexture.value = "";
            this.clearCanvas();
        }
    }

    getStyle(): CSSProperties {
        const style = super.getStyle();
        if (this.depth.value !== 0) {
            style.zIndex = -this.depth.value;
        }
        if (this.flipVertical.value) {
            style.scale = `${this.flipHorizontal.value ? -1 : 1},-1`;
        }
        else {
            style.scale = `${this.flipHorizontal.value ? -1 : 1},1`;
        }
        if (this.subtexture.value.length === 0) {
            style.backgroundColor = this.fillColor.value.toCssString();
        }
        if (this.outlineThickness.value > 0) {
            style.boxSizing = "border-box";
            style.border = `${this.outlineThickness.value}px solid ${this.outlineColor.value.toCssString()}`;
        }
        return style;
    }

    initInspectorProvider() {
        super.initInspectorProvider();
        this.inspectorProvider.addAttribute<number>("Depth",
            AttributeType.Number,
            () => this.depth.value,
            value => this.depth.value = value);
        this.inspectorProvider.addAttribute<boolean>("Depth\u200BWrite\u200BEnabled",
            AttributeType.Boolean,
            () => this.depthWriteEnabled.value,
            value => this.depthWriteEnabled.value = value);
        this.inspectorProvider.addAttribute<string>("Subtexture",
            AttributeType.String,
            () => this.subtexture.value,
            value => this.subtexture.value = value);
        this.inspectorProvider.addAttribute<boolean>("Texture\u200BWrap",
            AttributeType.Boolean,
            () => this.textureWrap.value,
            value => this.textureWrap.value = value);
        this.inspectorProvider.addAttribute<boolean>("Texture\u200BLinear\u200BFilter",
            AttributeType.Boolean,
            () => this.textureLinearFilter.value,
            value => this.textureLinearFilter.value = value);
        this.inspectorProvider.addAttribute<boolean>("Flip\u200BHorizontal",
            AttributeType.Boolean,
            () => this.flipHorizontal.value,
            value => this.flipHorizontal.value = value);
        this.inspectorProvider.addAttribute<boolean>("Flip\u200BVertical",
            AttributeType.Boolean,
            () => this.flipVertical.value,
            value => this.flipVertical.value = value);
        this.inspectorProvider.addAttribute<Color>("Fill\u200BColor",
            AttributeType.Color,
            () => this.fillColor.value,
            value => this.fillColor.value.update(value));
        this.inspectorProvider.addAttribute<Color>("Outline\u200BColor",
            AttributeType.Color,
            () => this.outlineColor.value,
            value => this.outlineColor.value.update(value));
        this.inspectorProvider.addAttribute<number>("Outline\u200BThickness",
            AttributeType.Number,
            () => this.outlineThickness.value,
            value => this.outlineThickness.value = value);
        this.inspectorProvider.addAttribute<Vector2>("Texcoord1", AttributeType.Vector2, () => {
            return {X: this.texcoord1X.value, Y: this.texcoord1Y.value};
        }, value => {
            if (value.X !== this.texcoord1X.value) {
                this.texcoord1X.value = value.X;
            }
            if (value.Y !== this.texcoord1Y.value) {
                this.texcoord1Y.value = value.Y;
            }
        });
        this.inspectorProvider.addAttribute<Vector2>("Texcoord2", AttributeType.Vector2, () => {
            return {X: this.texcoord2X.value, Y: this.texcoord2Y.value};
        }, value => {
            if (value.X !== this.texcoord2X.value) {
                this.texcoord2X.value = value.X;
            }
            if (value.Y !== this.texcoord1Y.value) {
                this.texcoord2Y.value = value.Y;
            }
        });
    }

    afterInit() {
        watch([this.subtexture, this.texcoord1X, this.texcoord1Y, this.texcoord2X, this.texcoord2Y],
            () => this.updateCanvas());
    }
}
