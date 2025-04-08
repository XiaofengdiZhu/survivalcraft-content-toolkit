export type BoolString = "true" | "false";

export enum LayoutDirection {Horizontal, Vertical}

export type LayoutDirectionString = "Horizontal" | "Vertical";

export function string2LayoutDirection(input: string): LayoutDirection {
    switch (input) {
        case "Horizontal":
            return LayoutDirection.Horizontal;
        case "Vertical":
            return LayoutDirection.Vertical;
        default:
            return LayoutDirection.Horizontal;
    }
}

export enum WidgetAlignment { Near, Center, Far, Stretch}

export type WidgetAlignmentString = "Near" | "Center" | "Far" | "Stretch";

export function string2WidgetAlignment(input: string): WidgetAlignment {
    switch (input) {
        case "Near":
            return WidgetAlignment.Near;
        case "Center":
            return WidgetAlignment.Center;
        case "Far":
            return WidgetAlignment.Far;
        default:
            return WidgetAlignment.Stretch;
    }
}

export enum TextAnchor {
    Default = 0,
    Left = 0,
    Top = 0,
    HorizontalCenter = 1,
    VerticalCenter = 2,
    Right = 4,
    Bottom = 8,
    Center = 3,
    DisableSnapToPixels = 16
}

export function string2TextAnchor(input: string): TextAnchor {
    switch (input) {
        case "HorizontalCenter":
            return TextAnchor.HorizontalCenter;
        case "VerticalCenter":
            return TextAnchor.VerticalCenter;
        case "Right":
            return TextAnchor.Right;
        case "Bottom":
            return TextAnchor.Bottom;
        case "Center":
            return TextAnchor.Center;
        case "DisableSnapToPixels":
            return TextAnchor.DisableSnapToPixels;
        default:
            return TextAnchor.Default;
    }
}

export enum TextOrientation {Horizontal, VerticalLeft}

export type TextOrientationString = "Horizontal" | "VerticalLeft";

export function string2TextOrientation(input: string): TextOrientation {
    switch (input) {
        case "VerticalLeft":
            return TextOrientation.VerticalLeft;
        default:
            return TextOrientation.Horizontal;
    }
}

export enum SizeLengthType {
    FitContent, PositiveInfinity, Fixed
}

export class SizeLength {
    type: SizeLengthType = SizeLengthType.FitContent;
    _value: number = -1;

    constructor(value: number | string) {
        if (typeof value === "number") {
            this.value = value;
        }
        else {
            this.value = SizeLength.string2Value(value);
        }
    }

    get value() {
        return this._value;
    }

    set value(newValue: number) {
        if (newValue === this._value) {
            return;
        }
        this._value = newValue;
        this.type = SizeLength.value2Type(newValue);
    }

    static string2Value(input: string) {
        input = input.trim();
        if (input === "Infinity") {
            return Infinity;
        }
        else {
            let num = parseFloat(input);
            if (isNaN(num)) {
                throw "Invalid SizeLength";
            }
            if (num < 0) {
                num = -1;
            }
            return num;
        }
    }

    static value2Type(value: number) {
        if (value === Infinity) {
            return SizeLengthType.PositiveInfinity;
        }
        else if (value < 0) {
            return SizeLengthType.FitContent;
        }
        else {
            return SizeLengthType.Fixed;
        }
    }

    toCssString(margin?: number) {
        return SizeLength.toCssString(this._value, margin);
    }

    static toCssString(value: number, margin?: number) {
        switch (SizeLength.value2Type(value)) {
            case SizeLengthType.FitContent:
                return "fit-content";
            case SizeLengthType.PositiveInfinity:
                if (margin && margin > 0) {
                    return `calc(100% - ${margin * 2}px)`;
                }
                else {
                    return "100%";
                }
            default:
                return `${value}px`;
        }
    }
}

export class Color {
    R: number = 0;
    G: number = 0;
    B: number = 0;
    A: number = 0;

    constructor(input: string | number[] | Color | number, g?: number, b?: number, a?: number) {
        if (typeof input === "string") {
            const array = Color.string2Color(input);
            this.R = array[0];
            this.G = array[1];
            this.B = array[2];
            this.A = array[3];
        }
        else if (Array.isArray(input)) {
            if (input.length > 2) {
                this.R = input[0];
                this.G = input[1];
                this.B = input[2];
                this.A = input.length > 3 ? input[3] : 255;
            }
        }
        else if (input instanceof Color) {
            this.R = input.R;
            this.G = input.G;
            this.B = input.B;
            this.A = input.A;
        }
        else if (g !== undefined && b !== undefined) {
            this.R = input;
            this.G = g;
            this.B = b;
            this.A = (typeof a === "undefined") ? 255 : a;
        }
        else {
            throw "Invalid Color";
        }
    }

    update(input: string | Color) {
        if (typeof input === "string") {
            const array = Color.string2Color(input);
            this.R = array[0];
            this.G = array[1];
            this.B = array[2];
            this.A = array[3];
        }
        else {
            this.R = input.R;
            this.G = input.G;
            this.B = input.B;
            this.A = input.A;
        }
    }

    darker(factor: number): Color {
        return new Color(this.R * factor, this.G * factor, this.B * factor, this.A);
    }

    static string2Color(input: string) {
        input = input.trim();
        if (input.startsWith("#")) {
            input = input.slice(1);
            if (input.length == 3 || input.length == 4) {
                let num1 = parseInt(input.slice(0, 1), 16);
                if (isNaN(num1)) {
                    throw "Invalid Color";
                }
                num1 = num1 * 16 + num1;
                let num2 = parseInt(input.slice(1, 2), 16);
                if (isNaN(num2)) {
                }
                num2 = num2 * 16 + num2;
                let num3 = parseInt(input.slice(2, 3), 16);
                if (isNaN(num3)) {
                    throw "Invalid Color";
                }
                num3 = num3 * 16 + num3;
                if (input.length == 4) {
                    let num4 = parseInt(input.slice(3, 4), 16);
                    if (isNaN(num4)) {
                        throw "Invalid Color";
                    }
                    num4 = num4 * 16 + num4;
                    return [num1, num2, num3, num4];
                }
                else {
                    return [num1, num2, num3, 255];
                }
            }
            else if (input.length == 6 || input.length == 8) {
                const num1 = parseInt(input.slice(0, 2), 16);
                if (isNaN(num1)) {
                    throw "Invalid Color";
                }
                const num2 = parseInt(input.slice(2, 4), 16);
                if (isNaN(num2)) {
                    throw "Invalid Color";
                }
                const num3 = parseInt(input.slice(4, 6), 16);
                if (isNaN(num3)) {
                    throw "Invalid Color";
                }
                if (input.length == 8) {
                    const num4 = parseInt(input.slice(6, 8), 16);
                    if (isNaN(num4)) {
                        throw "Invalid Color";
                    }
                    return [num1, num2, num3, num4];
                }
                else {
                    return [num1, num2, num3, 255];
                }
            }
            else {
                throw "Invalid Color";
            }
        }
        else {
            const array = input.split(",");
            if (array.length > 2) {
                const num1 = parseInt(array[0].trim());
                if (isNaN(num1)) {
                    throw "Invalid Color";
                }
                const num2 = parseInt(array[1].trim());
                if (isNaN(num2)) {
                    throw "Invalid Color";
                }
                const num3 = parseInt(array[2].trim());
                if (isNaN(num3)) {
                    throw "Invalid Color";
                }
                if (array.length > 3) {
                    const num4 = parseInt(array[3].trim());
                    if (isNaN(num4)) {
                        throw "Invalid Color";
                    }
                    return [num1, num2, num3, num4];
                }
                else {
                    return [num1, num2, num3, 255];
                }
            }
            else {
                throw "Invalid Color";
            }
        }
    }

    toCssString() {
        return `rgba(${this.R},${this.G},${this.B},${this.A / 255})`;
    }

    toArrayString() {
        return `${this.R},${this.G},${this.B},${this.A}`;
    }
}

export interface Vector2 {
    X: number;
    Y: number;
}
