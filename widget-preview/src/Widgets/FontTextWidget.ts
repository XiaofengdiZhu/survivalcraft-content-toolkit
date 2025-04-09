import {type BoolString, Color, SizeLength, SizeLengthType, string2TextAnchor, string2TextOrientation, TextAnchor, TextOrientation, type TextOrientationString, type Vector2} from "../Common.ts";
import {defaultWidgetProps, WidgetClass, type WidgetProps} from "./Widget.ts";
import type {CSSProperties} from "@vue/runtime-dom";
import {computed, ref} from "vue";
import {AttributeType} from "../Components/Inspector.ts";
import {fontSelected} from "../main.ts";

export interface FontTextWidgetProps extends WidgetProps {
    Text?: string,
    TextAnchor?: string,//TextAnchor,TextAnchor,...
    TextOrientation?: TextOrientationString,
    Font?: string,
    FontScale?: string | number,
    FontSpacing?: string,//number,number
    WordWrap?: BoolString | boolean,
    Ellipsis?: BoolString | boolean,
    MaxLines?: string | number,
    Color?: string | Color,
    DropShadow?: BoolString | boolean,
    TextureLinearFilter?: BoolString | boolean
}

export const defaultFontTextWidgetProps = {
    ...defaultWidgetProps, TextureLinearFilter: true
};

const defaultFontSize = 19;
const defaultLineHeight = 25.5;

const context2D = new OffscreenCanvas(0, 0).getContext("2d");

export class FontTextWidgetClass extends WidgetClass<FontTextWidgetProps> {
    text = ref("");
    textAnchor = ref<Set<TextAnchor>>(new Set<TextAnchor>());
    textOrientation = ref(TextOrientation.Horizontal);
    font?: string;
    fontScale = ref(1);
    fontSpacingX = ref(0);
    fontSpacingY = ref(0);
    wordWrap = ref(false);
    ellipsis = ref(false);
    maxLines = ref(2147483647);
    color = ref(new Color(255, 255, 255, 255));
    dropShadow = ref(false);
    textureLinearFilter = ref(true);

    get width() {
        if (this._width.type === SizeLengthType.FitContent) {
            return this.textSize2.value?.width ?? -1;
        }
        else {
            return this._width.value;
        }
    }

    set width(value: number) {
        super.width = value;
    }

    get height() {
        if (this._height.type === SizeLengthType.FitContent) {
            return this.textSize2.value?.height ?? -1;
        }
        else {
            return this._height.value;
        }
    }

    set height(value: number) {
        super.height = value;
    }

    lastTextSize = {width: 0, height: 0};

    textSize = computed(() => {
        let result = {
            width: 0, height: 0
        };
        if (this.text.value.length > 0) {
            let maxCharLength = 0;
            const lines = this.getTreatedText().split("\n");
            for (const line of lines) {
                let charLength = 0;
                for (const char of line) {
                    if (/[\u3400-\u9FBF\u2E80-\u2EFF\uF900-\uFAFF\u3040-\u309F\uAC00-\uD7AF]/.test(
                        char)) {//CJK
                        charLength += 1;
                    }
                    else {
                        charLength += 0.5;
                    }
                }
                maxCharLength = Math.max(maxCharLength, charLength);
            }
            if (maxCharLength > 0) {
                const letterSpacing = this.fontSpacingX.value > 0 ?
                    this.fontSpacingX.value * this.fontScale.value :
                    0;
                const lineHeight = this.fontSpacingY.value > 0 ?
                    (defaultLineHeight + this.fontSpacingY.value) * this.fontScale.value :
                    defaultLineHeight * this.fontScale.value;
                const textOrientationVertical = this.textOrientation.value === TextOrientation.VerticalLeft;
                const columnCount = maxCharLength * (defaultFontSize * this.fontScale.value + letterSpacing);
                const rowCount = lineHeight * lines.length;
                result.width = textOrientationVertical ? rowCount : columnCount;
                result.height = textOrientationVertical ? columnCount : rowCount;
            }
        }
        if (this.parent && (result.width !== this.lastTextSize.width || result.height !== this.lastTextSize.height)) {
            this.lastTextSize.width = result.width;
            this.lastTextSize.height = result.height;
            this.parent.updateSize();
        }
        return result;
    });

    textSize2 = computed(() => {
        let result = {
            width: 0, height: 0
        };
        if (this.text.value.length > 0 && context2D) {
            let maxCharLength = 0;
            const lines = this.getTreatedText().split("\n");
            let lineIndexWithMaxCharLength = 0;
            for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
                const line = lines[lineIndex];
                let charLength = 0;
                for (const char of line) {
                    if (/[\u3400-\u9FBF\u2E80-\u2EFF\uF900-\uFAFF\u3040-\u309F\uAC00-\uD7AF]/.test(
                        char)) {//CJK
                        charLength += 1;
                    }
                    else {
                        charLength += 0.5;
                    }
                }
                if (charLength > maxCharLength) {
                    lineIndexWithMaxCharLength = lineIndex;
                    maxCharLength = charLength;
                }
            }
            const textOrientationVertical = this.textOrientation.value === TextOrientation.VerticalLeft;
            const lineHeight = this.fontSpacingY.value > 0 ?
                (defaultLineHeight + this.fontSpacingY.value) * this.fontScale.value :
                defaultLineHeight * this.fontScale.value;
            context2D.font = `${(defaultFontSize * this.fontScale.value).toFixed(1)}px ${fontSelected.value}`;
            context2D.letterSpacing = `${(this.fontSpacingX.value * this.fontScale.value).toFixed(1)}px`;
            context2D.fontKerning = "normal";
            const metrics = context2D.measureText(lines[lineIndexWithMaxCharLength]);
            const columnCount = metrics.width;
            const rowCount = lineHeight * lines.length;
            result.width = textOrientationVertical ? rowCount : columnCount;
            result.height = textOrientationVertical ? columnCount : rowCount;
        }
        if (this.parent && (result.width !== this.lastTextSize.width || result.height !== this.lastTextSize.height)) {
            this.lastTextSize.width = result.width;
            this.lastTextSize.height = result.height;
            this.parent.updateSize();
        }
        return result;
    });

    updateFromProps(props: FontTextWidgetProps) {
        super.updateFromProps(props);
        if (props.Text !== undefined) {
            this.text.value = props.Text;
        }
        else {
            this.text.value = "";
        }
        if (props.TextAnchor !== undefined) {
            this.textAnchor.value.clear();
            const array = props.TextAnchor.split(",");
            for (const str of array) {
                this.textAnchor.value.add(string2TextAnchor(str.trim()));
            }
        }
        else {
            this.textAnchor.value.clear();
        }
        if (props.TextOrientation !== undefined) {
            this.textOrientation.value = string2TextOrientation(props.TextOrientation);
        }
        else {
            this.textOrientation.value = TextOrientation.Horizontal;
        }
        if (props.Font !== undefined) {
            this.font = props.Font;
        }
        else {
            this.font = undefined;
        }
        if (props.FontScale !== undefined) {
            if (typeof props.FontScale === "string") {
                const num = parseFloat(props.FontScale);
                if (!isNaN(num)) {
                    this.fontScale.value = num;
                }
            }
            else {
                this.fontScale.value = props.FontScale;
            }
        }
        else {
            this.fontScale.value = 1;
        }
        if (props.FontSpacing !== undefined) {
            const array = props.FontSpacing.split(",");
            if (array.length > 1) {
                const num1 = parseFloat(array[0].trim());
                if (!isNaN(num1)) {
                    this.fontSpacingX.value = num1;
                }
                const num2 = parseFloat(array[1].trim());
                if (!isNaN(num2)) {
                    this.fontSpacingY.value = num2;
                }
            }
        }
        else {
            this.fontSpacingX.value = 0;
            this.fontSpacingY.value = 0;
        }
        this.wordWrap.value = props.WordWrap === "true" || props.WordWrap === true;
        this.ellipsis.value = props.Ellipsis === "true" || props.Ellipsis === true;
        if (props.MaxLines !== undefined) {
            if (typeof props.MaxLines === "string") {
                const num = parseInt(props.MaxLines);
                if (!isNaN(num)) {
                    this.maxLines.value = num;
                }
            }
            else {
                this.maxLines.value = props.MaxLines;
            }
        }
        else {
            this.maxLines.value = 2147483647;
        }
        if (props.Color !== undefined) {
            this.color.value.update(props.Color);
        }
        else {
            this.color.value.update(new Color(255, 255, 255, 255));
        }
        this.dropShadow.value = props.DropShadow === "true" || props.DropShadow === true;
        this.textureLinearFilter.value = !(props.TextureLinearFilter === "false" || props.TextureLinearFilter === false);
    }

    getTreatedText() {
        const lines = this.text.value.split("\n");
        if (lines.length > this.maxLines.value) {
            return lines.slice(0, this.maxLines.value).join("\n");
        }
        else {
            return this.text.value;
        }
    }

    getStyle(): CSSProperties {
        const style = super.getStyle();
        style.width = SizeLength.toCssString(this._width.value, this.marginX.value);
        style.height = SizeLength.toCssString(this._height.value, this.marginY.value);
        if (this.textAnchor.value.size > 0) {
            style.display = "flex";
            for (let item of this.textAnchor.value) {
                switch (item) {
                    case TextAnchor.HorizontalCenter:
                        style.justifyContent = "center";
                        break;
                    case TextAnchor.VerticalCenter:
                        style.alignItems = "center";
                        break;
                    case TextAnchor.Right:
                        if (!this.textAnchor.value.has(TextAnchor.HorizontalCenter) && !this.textAnchor.value.has(
                            TextAnchor.Center)) {
                            style.justifyContent = "end";
                        }
                        break;
                    case TextAnchor.Bottom:
                        if (!this.textAnchor.value.has(TextAnchor.VerticalCenter) && !this.textAnchor.value.has(
                            TextAnchor.Center)) {
                            style.alignItems = "end";
                        }
                        break;
                    case TextAnchor.Center:
                        style.justifyContent = "center";
                        style.alignItems = "center";
                        break;
                }
            }

        }
        if (this.textOrientation.value === TextOrientation.VerticalLeft) {
            style.writingMode = "sideways-lr";
        }
        if (this.fontScale.value != 1) {
            style.fontSize = `${defaultFontSize * this.fontScale.value}px`;
        }
        if (this.fontSpacingX.value > 0) {
            style.letterSpacing = `${this.fontSpacingX.value * this.fontScale.value}px`;
        }
        if (this.fontSpacingY.value > 0) {
            style.lineHeight = `${((defaultLineHeight + this.fontSpacingY.value) * this.fontScale.value).toFixed(
                1)}px`;
        }
        else {
            style.lineHeight = `${(defaultLineHeight * this.fontScale.value).toFixed(1)}px`;
        }
        if (this.wordWrap.value) {
            style.textWrap = "wrap";
        }
        if (this.ellipsis.value) {
            style.textOverflow = "ellipsis";
            style.overflow = "hidden";
        }
        style.color = this.color.value.toCssString();
        if (this.dropShadow.value) {
            style.textShadow = `rgba(0,0,0,${this.color.value.A}) ${this.fontScale.value}px ${this.fontScale.value}px`;
        }
        return style;
    }

    initInspectorProvider() {
        super.initInspectorProvider();
        this.inspectorProvider.addAttribute<string>("Text",
            AttributeType.String,
            () => this.text.value,
            value => this.text.value = value);
        this.inspectorProvider.addAttribute<Set<TextAnchor>>("Text\u200BAnchor",
            AttributeType.TextAnchors,
            () => this.textAnchor.value,
            value => this.textAnchor.value = value);
        this.inspectorProvider.addAttribute<TextOrientation>("Text\u200BOrientation",
            AttributeType.TextOrientation,
            () => this.textOrientation.value,
            value => this.textOrientation.value = value);
        this.inspectorProvider.addAttribute<string>("Font",
            AttributeType.String,
            () => this.font ?? "",
            value => this.font = value);
        this.inspectorProvider.addAttribute<number>("Font\u200BScale",
            AttributeType.Number,
            () => this.fontScale.value,
            value => this.fontScale.value = value);
        this.inspectorProvider.addAttribute<Vector2>("Font\u200BSpacing",
            AttributeType.Vector2,
            () => {
                return {X: this.fontSpacingX.value, Y: this.fontSpacingY.value};
            },
            value => {
                if (value.X !== this.fontSpacingX.value) {
                    this.fontSpacingX.value = value.X;
                }
                if (value.Y !== this.fontSpacingY.value) {
                    this.fontSpacingY.value = value.Y;
                }
            });
        this.inspectorProvider.addAttribute<boolean>("Word\u200BWrap",
            AttributeType.Boolean,
            () => this.wordWrap.value,
            value => this.wordWrap.value = value);
        this.inspectorProvider.addAttribute<boolean>("Ellipsis",
            AttributeType.Boolean,
            () => this.ellipsis.value,
            value => this.ellipsis.value = value);
        this.inspectorProvider.addAttribute<number>("Max\u200BLines",
            AttributeType.Integer,
            () => this.maxLines.value,
            value => this.maxLines.value = value);
        this.inspectorProvider.addAttribute<Color>("Color",
            AttributeType.Color,
            () => this.color.value,
            value => this.color.value.update(value));
        this.inspectorProvider.addAttribute<boolean>("Drop\u200BShadow",
            AttributeType.Boolean,
            () => this.dropShadow.value,
            value => this.dropShadow.value = value);
        this.inspectorProvider.addAttribute<boolean>("Texture\u200BLinear\u200BFilter",
            AttributeType.Boolean,
            () => this.textureLinearFilter.value,
            value => this.textureLinearFilter.value = value);
    }
}
