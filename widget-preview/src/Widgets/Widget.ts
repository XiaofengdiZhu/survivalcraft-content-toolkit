import {type BoolString, SizeLength, SizeLengthType, string2WidgetAlignment, type Vector2, WidgetAlignment, type WidgetAlignmentString} from "../Common.ts";
import {type CSSProperties} from "@vue/runtime-dom";
import {getCurrentInstance, onUnmounted, reactive, type Ref, ref, watch} from "vue";
import {AttributeType, InspectorProvider} from "../Components/Inspector.ts";

export interface WidgetProps {
    Name?: string;
    GlobalScale?: string | number;
    IsVisible?: BoolString | boolean;
    IsEnabled?: BoolString | boolean;
    ClampToBounds?: BoolString | boolean;
    Margin?: string;//number, number
    HorizontalAlignment?: WidgetAlignmentString | WidgetAlignment;
    VerticalAlignment?: WidgetAlignmentString | WidgetAlignment;
    Size?: string;//number, number
    Style?: string;
    CanvasWidgetPosition?: string;//number, number
    //For this toolkit
    NoInspector?: boolean;
    OverrideChildren?: string | any;
}

export const defaultWidgetProps = {
    IsVisible: true, IsEnabled: true
};

export class WidgetClass<T extends WidgetProps = WidgetProps> {
    props?: T;
    htmlElement?: Ref<HTMLElement | null, HTMLElement | null>;
    parent?: WidgetClass;
    children: WidgetClass[] = [];
    overrideChildren: Map<string, any> = new Map();
    inspectorProvider: InspectorProvider;
    isCanvasWidget = false;
    _isNoInspector: boolean = false;
    _isParentNoInspector: boolean = false;

    get isNoInspector(): boolean {
        return this._isNoInspector || this._isParentNoInspector;
    }

    set isNoInspector(value: boolean) {
        this._isNoInspector = value;
        if (!this._isParentNoInspector) {
            for (const child of this.children) {
                child.isParentNoInspector = value;
            }
        }
    }

    set isParentNoInspector(value: boolean) {
        if (value !== this._isParentNoInspector) {
            this._isParentNoInspector = value;
            if (!this._isNoInspector) {
                for (const child of this.children) {
                    child.isParentNoInspector = value;
                }
            }
        }
    }

    name = ref("");
    globalScale = ref(1);
    isVisible = ref(true);
    _isEnabled = ref(true);
    _isParentEnabled = ref(true);

    get isEnabled(): boolean {
        return this._isEnabled.value && this._isParentEnabled.value;
    }

    set isEnabled(value: boolean) {
        if (value !== this._isEnabled.value) {
            this._isEnabled.value = value;
            if (this._isParentEnabled.value) {
                for (const child of this.children) {
                    child.isParentEnabled = value;
                }
            }
        }
    }

    set isParentEnabled(value: boolean) {
        if (value !== this._isParentEnabled.value) {
            this._isParentEnabled.value = value;
            if (this._isEnabled.value) {
                for (const child of this.children) {
                    child.isParentEnabled = value;
                }
            }
        }
    }

    clampToBounds = ref(false);
    marginX = ref(0);
    marginY = ref(0);
    horizontalAlignment = ref(WidgetAlignment.Stretch);
    verticalAlignment = ref(WidgetAlignment.Stretch);
    _width = reactive(new SizeLength(-1));
    get width(): number {
        return this._width.value;
    }

    set width(value: number) {
        if (value !== this._width.value) {
            this._width.value = value;
            if (this.parent) {
                this.parent.updateSize();
            }
        }
    }

    _height = reactive(new SizeLength(-1));
    get height(): number {
        return this._height.value;
    }

    set height(value: number) {
        if (value !== this._height.value) {
            this._height.value = value;
            if (this.parent) {
                this.parent.updateSize();
            }
        }
    }

    style?: string;
    canvasWidgetPositionX = ref(-1);
    canvasWidgetPositionY = ref(-1);

    constructor(customNameInInspector?: string) {
        this.inspectorProvider = new InspectorProvider(customNameInInspector ?? this.constructor.name.replace(
            "Class",
            ""));
    }

    static create<T1 extends WidgetProps, T2 extends WidgetClass<T1>>(this: new(_?: string) => T2,
        htmlElement?: Ref<HTMLElement | null, HTMLElement | null>,
        props?: T1,
        customNameInInspector?: string) {
        const widget = new this(customNameInInspector);
        if (htmlElement) {
            widget.htmlElement = htmlElement;
        }
        widget.props = props;
        const parent = (getCurrentInstance()?.parent?.exposed?.widget as WidgetClass) ?? undefined;
        if (parent) {
            widget.parent = parent;
            parent.children.push(widget);
            widget.isParentNoInspector = parent._isNoInspector || parent._isParentNoInspector;
            widget.isParentEnabled = parent.isEnabled;
            const name = props?.Name;
            if (name && name.length > 0) {
                const override = parent.overrideChildren.get(name);
                if (override !== undefined) {
                    widget.updateFromProps(Object.assign(props, override));
                    watch(props,
                        newProps => widget.updateFromProps(Object.assign(newProps, override)));
                }
                else if (props) {
                    widget.updateFromProps(props);
                    watch(props, newProps => widget.updateFromProps(newProps));
                }
            }
            else if (props) {
                widget.updateFromProps(props);
                watch(props, newProps => widget.updateFromProps(newProps));
            }
            if (widget._width.type !== SizeLengthType.FitContent || widget._height.type !== SizeLengthType.FitContent) {
                parent.updateSize();
            }
        }
        else if (props) {
            widget.updateFromProps(props);
            watch(props, newProps => widget.updateFromProps(newProps));
        }
        onUnmounted(() => {
            if (widget.parent) {
                parent.children.splice(parent.children.indexOf(widget), 1);
            }
        });
        widget.initInspectorProvider();
        widget.afterInit();
        return widget;
    }

    updateFromProps(props: T) {
        if (props.Name !== undefined && props.Name.length > 0) {
            this.name.value = props.Name.trim();
        }
        else {
            this.name.value = "";
        }
        if (props.GlobalScale !== undefined) {
            if (typeof props.GlobalScale === "number") {
                this.globalScale.value = props.GlobalScale;
            }
            else {
                const num = parseFloat(props.GlobalScale);
                this.globalScale.value = isNaN(num) ? 1 : num;
            }
        }
        this.isVisible.value = !(props.IsVisible === "false" || props.IsVisible === false);
        this.isEnabled = !(props.IsEnabled === "false" || props.IsEnabled === false);
        this.clampToBounds.value = props.ClampToBounds === "true" || props.ClampToBounds === true;
        if (props.Margin !== undefined) {
            const array = props.Margin.split(",");
            if (array.length > 1) {
                const num1 = parseFloat(array[0].trim());
                this.marginX.value = isNaN(num1) ? 0 : num1;
                const num2 = parseFloat(array[1].trim());
                this.marginY.value = isNaN(num2) ? 0 : num2;
            }
            else {
                this.marginX.value = 0;
                this.marginY.value = 0;
            }
        }
        else {
            this.marginX.value = 0;
            this.marginY.value = 0;
        }
        if (props.HorizontalAlignment !== undefined) {
            if (typeof props.HorizontalAlignment === "string") {
                this.horizontalAlignment.value = string2WidgetAlignment(props.HorizontalAlignment);
            }
            else {
                this.horizontalAlignment.value = props.HorizontalAlignment;
            }
        }
        else {
            this.horizontalAlignment.value = WidgetAlignment.Stretch;
        }
        if (props.VerticalAlignment !== undefined) {
            if (typeof props.VerticalAlignment === "string") {
                this.verticalAlignment.value = string2WidgetAlignment(props.VerticalAlignment);
            }
            else {
                this.verticalAlignment.value = props.VerticalAlignment;
            }
        }
        else {
            this.verticalAlignment.value = WidgetAlignment.Stretch;
        }
        if (props.Size !== undefined) {
            const array = props.Size.split(",");
            if (array.length > 1) {
                const num1 = parseFloat(array[0].trim());
                this.width = isNaN(num1) ? -1 : num1;
                const num2 = parseFloat(array[1].trim());
                this.height = isNaN(num2) ? -1 : num2;
            }
            else {
                this.width = -1;
                this.height = -1;
            }
        }
        else {
            this.width = -1;
            this.height = -1;
        }
        this.isNoInspector = props.NoInspector === true;
        if (props.OverrideChildren !== undefined) {
            if (typeof props.OverrideChildren === "string") {
                const temp = JSON.parse(props.OverrideChildren);
                for (const [key, value] of Object.entries(temp)) {
                    this.overrideChildren.set(key, value);
                }
            }
            else if (props.OverrideChildren instanceof Map) {
                for (const [key, value] of props.OverrideChildren) {
                    this.overrideChildren.set(key, value);
                }
            }
            else if (typeof props.OverrideChildren === "object") {
                for (const [key, value] of Object.entries(props.OverrideChildren)) {
                    this.overrideChildren.set(key, value);
                }
            }
        }
        if (props.Style !== undefined && props.Style.length > 0) {
            this.style = props.Style.trim();
        }
        else {
            this.style = "";
        }
        if (props.CanvasWidgetPosition !== undefined) {
            const array = props.CanvasWidgetPosition.split(",");
            if (array.length > 1) {
                const num1 = parseFloat(array[0].trim());
                this.canvasWidgetPositionX.value = isNaN(num1) ? -1 : num1;
                const num2 = parseFloat(array[1].trim());
                this.canvasWidgetPositionY.value = isNaN(num2) ? -1 : num2;
            }
            else {
                this.canvasWidgetPositionX.value = -1;
                this.canvasWidgetPositionY.value = -1;
            }
        }
        else {
            this.canvasWidgetPositionX.value = -1;
            this.canvasWidgetPositionY.value = -1;
        }
    }

    getStyle(): CSSProperties {
        let style: CSSProperties = {position: "relative"};
        style.width = SizeLength.toCssString(this.width, this.marginX.value);
        style.height = SizeLength.toCssString(this.height, this.marginY.value);
        if (this.clampToBounds.value) {
            style.overflow = "hidden";
        }
        if (this.marginX.value > 0 || this.marginY.value > 0) {
            style.margin = `${this.marginY.value}px ${this.marginX.value}px`;
        }
        if (this.parent) {
            if (this.parent.isCanvasWidget && this.canvasWidgetPositionX.value >= 0) {
                style.position = "absolute";
                style.left = `${this.canvasWidgetPositionX.value}px`;
                style.top = `${this.canvasWidgetPositionY.value}px`;
            }
            else {
                style = Object.assign(style,
                    this.parent.alignment2Style(this.horizontalAlignment.value,
                        this.verticalAlignment.value,
                        SizeLength.value2Type(this.width),
                        SizeLength.value2Type(this.height)));
            }
        }
        if (this.globalScale.value !== 1) {
            style.scale = this.globalScale.value;
        }
        if (!this.isVisible.value) {
            style.display = "none";
        }
        return style;
    }

    alignment2Style(_horizontalAlignment?: WidgetAlignment,
        _verticalAlignment?: WidgetAlignment,
        _widthType?: SizeLengthType,
        _heightType?: SizeLengthType): CSSProperties {
        return {};
    }

    updateSize() {
    }

    initInspectorProvider() {
        this.inspectorProvider.addAttribute<string>("Name",
            AttributeType.String,
            () => this.name.value,
            value => this.name.value = value);
        this.inspectorProvider.addAttribute<number>("Global\u200BScale",
            AttributeType.Integer,
            () => this.globalScale.value,
            value => this.globalScale.value = value);
        this.inspectorProvider.addAttribute<boolean>("Is\u200BVisible",
            AttributeType.Boolean,
            () => this.isVisible.value,
            value => this.isVisible.value = value);
        this.inspectorProvider.addAttribute<boolean>("Is\u200BEnabled",
            AttributeType.Boolean,
            () => this._isEnabled.value,
            value => this.isEnabled = value);
        this.inspectorProvider.addAttribute<Vector2>("Margin", AttributeType.Vector2, () => {
            return {X: this.marginX.value, Y: this.marginY.value};
        }, value => {
            if (value.X !== this.marginX.value) {
                this.marginX.value = value.X;
            }
            if (value.Y !== this.marginY.value) {
                this.marginY.value = value.Y;
            }
        });
        this.inspectorProvider.addAttribute<Vector2>("Size", AttributeType.Vector2, () => {
            return {X: this._width.value, Y: this._height.value};
        }, value => {
            if (value.X !== this._width.value) {
                this._width.value = value.X;
            }
            if (value.Y !== this._height.value) {
                this._height.value = value.Y;
            }
        });
        this.inspectorProvider.addAttribute<WidgetAlignment>("Horizontal\u200BAlignment",
            AttributeType.WidgetAlignment,
            () => {
                return this.horizontalAlignment.value;
            },
            value => {
                this.horizontalAlignment.value = value;
            });
        this.inspectorProvider.addAttribute<WidgetAlignment>("Vertical\u200BAlignment",
            AttributeType.WidgetAlignment,
            () => {
                return this.verticalAlignment.value;
            },
            value => {
                this.verticalAlignment.value = value;
            });
        this.inspectorProvider.addAttribute<boolean>("Clamp\u200BTo\u200BBounds",
            AttributeType.Boolean,
            () => {
                return this.clampToBounds.value;
            },
            value => {
                this.clampToBounds.value = value;
            });
        this.inspectorProvider.addAttribute<string>("Style", AttributeType.String, () => {
            return this.style ?? "";
        }, value => {
            this.style = value;
        });
        if (this.parent && this.parent.isCanvasWidget) {
            this.inspectorProvider.addAttribute<Vector2>("Canvas\u200BWidget\u200B.Position",
                AttributeType.Vector2,
                () => {
                    return {
                        X: this.canvasWidgetPositionX.value, Y: this.canvasWidgetPositionY.value
                    };
                },
                value => {
                    if (value.X !== this.canvasWidgetPositionX.value) {
                        this.canvasWidgetPositionX.value = value.X;
                    }
                    if (value.Y !== this.canvasWidgetPositionY.value) {
                        this.canvasWidgetPositionY.value = value.Y;
                    }
                });
        }
    }

    afterInit() {
    }
}
