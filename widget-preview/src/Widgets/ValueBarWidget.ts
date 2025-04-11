import {WidgetClass, type WidgetProps} from "./Widget.ts";
import {type BoolString, clamp, Color, LayoutDirection, lerp, string2LayoutDirection, type Vector2} from "../Common.ts";
import {AttributeType} from "../Components/Inspector.ts";
import {onMounted, ref, watch} from "vue";
import type {CSSProperties} from "@vue/runtime-dom";
import {getFlexDirection} from "./Layouts/StackPanelWidget.ts";
import {atlasDefinition, getImageBitmap} from "../main.ts";

export interface ValueBarWidgetProps extends WidgetProps {
    Value?: string | number;
    BarsCount?: string | number;
    FlipDirection?: BoolString | boolean;
    BarSize?: string;//number,number
    Spacing?: string | number;
    LitBarColor?: string | Color;
    LitBarColor2?: string | Color;
    UnlitBarColor?: string | Color;
    BarBlending?: BoolString | boolean;
    HalfBars?: BoolString | boolean;
    BarSubtexture?: string;
    TextureLinearFilter?: BoolString | boolean;
    LayoutDirection?: string | LayoutDirection;
}

export class ValueBarWidgetClass extends WidgetClass<ValueBarWidgetProps> {
    value = ref(0);
    barsCount = ref(8);
    flipDirection = ref(false);
    barSizeX = ref(24);
    barSizeY = ref(24);
    spacing = ref(0);
    litBarColor = ref(new Color(16, 140, 0));
    litBarColor2 = ref(new Color(0, 0, 0, 0));
    unlitBarColor = ref(new Color(48, 48, 48));
    barBlending = ref(true);
    halfBars = ref(false);
    barSubtexture = ref("");
    textureLinearFilter = ref(true);
    layoutDirection = ref(LayoutDirection.Horizontal);

    get width(): number {
        return this.layoutDirection.value === LayoutDirection.Horizontal ?
            ((this.barSizeX.value + this.spacing.value) * this.barsCount.value) :
            this.barSizeX.value;
    }

    set width(_value: number) {
        return;
    }

    get height(): number {
        return this.layoutDirection.value === LayoutDirection.Horizontal ?
            this.barSizeY.value :
            ((this.barSizeY.value + this.spacing.value) * this.barsCount.value);
    }

    set height(_value: number) {
        return;
    }

    canvasElement = ref<HTMLCanvasElement | null>(null);
    renderer2D: Renderer2D | null = null;
    textureCoords = {u1: 0, v1: 0, u2: 1, v2: 1};

    updateCanvas() {
        if (!this.canvasElement.value) {
            this.renderer2D = null;
            return;
        }
        if (!this.renderer2D) {
            const gl = this.canvasElement.value.getContext("webgl2");
            if (gl) {
                this.renderer2D = new Renderer2D(gl);
            }
            else {
                return;
            }
        }
        this.renderer2D.clearCanvas(this.width, this.height);
        const flatBatch2D = this.renderer2D.flatBatch2D;
        const texturedBatch2D = this.renderer2D.texturedBatch2D;
        let zeroX = 0;
        let zeroY = 0;
        if (this.layoutDirection.value === LayoutDirection.Horizontal) {
            zeroX += this.spacing.value / 2;
        }
        else {
            zeroY += this.spacing.value / 2;
        }
        const num2 = this.halfBars.value ? 1 : 2;
        for (let i = 0; i < 2 * this.barsCount.value; i += num2) {
            const flag = (i % 2 === 0);
            const num3 = 0.5 * i;
            let num4 = this.flipDirection.value ?
                clamp((this.value.value - (this.barsCount.value - num3 - 1 / this.barsCount.value)) * this.barsCount.value,
                    0,
                    1) :
                clamp((this.value.value - num3 / this.barsCount.value) * this.barsCount.value,
                    0,
                    1);
            if (!this.barBlending.value) {
                num4 = Math.ceil(num4);
            }
            const c = (!this.litBarColor2.value.equals(0, 0, 0, 0) && this.barsCount.value > 1) ?
                Color.lerp(this.litBarColor.value,
                    this.litBarColor2.value,
                    num3 / (this.barsCount.value - 1)) :
                new Color(this.litBarColor.value);
            const color = Color.lerp(this.unlitBarColor.value, c, num4);
            if (this.halfBars.value) {
                if (flag) {
                    const vX = this.layoutDirection.value === LayoutDirection.Horizontal ? 0.5 : 1;
                    const vY = this.layoutDirection.value === LayoutDirection.Horizontal ? 1 : 0.5;
                    if (texturedBatch2D) {
                        texturedBatch2D.queueQuad(zeroX,
                            zeroY,
                            zeroX + vX * this.barSizeX.value,
                            zeroY + vY * this.barSizeY.value,
                            color,
                            this.textureCoords.u1,
                            this.textureCoords.v1,
                            lerp(this.textureCoords.u1, this.textureCoords.u2, vX),
                            lerp(this.textureCoords.v1, this.textureCoords.v2, vY));
                    }
                    else {
                        flatBatch2D.queueQuad(zeroX,
                            zeroY,
                            zeroX + vX * this.barSizeX.value,
                            zeroY + vY * this.barSizeY.value,
                            color);
                    }
                }
                else {
                    const v2X = this.layoutDirection.value === LayoutDirection.Horizontal ? 0.5 : 0;
                    const v2Y = this.layoutDirection.value === LayoutDirection.Horizontal ? 0 : 0.5;
                    if (texturedBatch2D) {
                        texturedBatch2D.queueQuad(zeroX + v2X * this.barSizeX.value,
                            zeroY + v2Y * this.barSizeY.value,
                            zeroX + this.barSizeX.value,
                            zeroY + this.barSizeY.value,
                            color,
                            lerp(this.textureCoords.u1, this.textureCoords.u2, v2X),
                            lerp(this.textureCoords.v1, this.textureCoords.v2, v2Y),
                            this.textureCoords.u2,
                            this.textureCoords.v2);
                    }
                    else {
                        flatBatch2D.queueQuad(zeroX + v2X * this.barSizeX.value,
                            zeroY + v2Y * this.barSizeY.value,
                            zeroX + this.barSizeX.value,
                            zeroY + this.barSizeY.value,
                            color);
                    }
                }
            }
            else {
                if (texturedBatch2D) {
                    texturedBatch2D.queueQuad(zeroX,
                        zeroY,
                        zeroX + this.barSizeX.value,
                        zeroY + this.barSizeY.value,
                        color,
                        this.textureCoords.u1,
                        this.textureCoords.v1,
                        this.textureCoords.u2,
                        this.textureCoords.v2);
                }
                else {
                    flatBatch2D.queueQuad(zeroX,
                        zeroY,
                        zeroX + this.barSizeX.value,
                        zeroY + this.barSizeY.value,
                        color);
                    flatBatch2D.queueRectangle(zeroX,
                        zeroY,
                        zeroX + this.barSizeX.value,
                        zeroY + this.barSizeY.value,
                        Color.multiplyColorOnly(color, 0.75));
                }
            }
            if (!flag || !this.halfBars.value) {
                if (this.layoutDirection.value == LayoutDirection.Horizontal) {
                    zeroX += this.barSizeX.value + this.spacing.value;
                }
                else {
                    zeroY += this.barSizeY.value + this.spacing.value;
                }
            }
        }
        this.renderer2D.flush(true);
    }

    updateBarSubtexture() {
        if (this.barSubtexture.value.startsWith("{Textures/Atlas/")) {
            const name = this.barSubtexture.value.replace("{Textures/Atlas/", "").replace("}", "");
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
                    if (this.renderer2D) {
                        this.textureCoords = {
                            u1: definition.sx / bitmap.width,
                            v1: definition.sy / bitmap.height,
                            u2: (definition.sx + definition.sWidth) / bitmap.width,
                            v2: (definition.sy + definition.sHeight) / bitmap.height
                        };
                        this.renderer2D.createOrUpdateTexturedBatch2D(bitmap,
                            this.textureLinearFilter.value);
                        this.updateCanvas();
                    }
                })
                .catch(error => console.log(error));
            }
        }
        else if (this.barSubtexture.value.startsWith("{")) {
            getImageBitmap(this.barSubtexture.value.replace("{", "")
            .replace("}", "")
            .replaceAll("/", "\\"))
            .then((bitmap) => {
                if (bitmap === null) {
                    return;
                }
                if (this.renderer2D) {
                    this.textureCoords = {
                        u1: 0, v1: 0, u2: 1, v2: 1
                    };
                    this.renderer2D.createOrUpdateTexturedBatch2D(bitmap,
                        this.textureLinearFilter.value);
                    this.updateCanvas();
                }
            });
        }
    }

    updateFromProps(props: ValueBarWidgetProps) {
        super.updateFromProps(props);
        if (props.Value !== undefined) {
            if (typeof props.Value === "string") {
                const num = parseFloat(props.Value);
                this.value.value = isNaN(num) ? 0 : num;
            }
            else {
                this.value.value = props.Value;
            }
        }
        else {
            this.value.value = 0;
        }
        if (props.BarsCount !== undefined) {
            if (typeof props.BarsCount === "string") {
                const num = parseInt(props.BarsCount);
                this.barsCount.value = isNaN(num) ? 8 : num;
            }
            else {
                this.barsCount.value = props.BarsCount;
            }
        }
        else {
            this.barsCount.value = 8;
        }
        this.flipDirection.value = props.FlipDirection === "true" || props.FlipDirection === true;
        if (props.BarSize !== undefined) {
            const array = props.BarSize.split(",");
            if (array.length > 1) {
                const num1 = parseFloat(array[0].trim());
                this.barSizeX.value = isNaN(num1) ? 24 : num1;
                const num2 = parseFloat(array[1].trim());
                this.barSizeY.value = isNaN(num2) ? 24 : num2;
            }
        }
        else {
            this.barSizeX.value = 24;
            this.barSizeY.value = 24;
        }
        if (props.Spacing !== undefined) {
            if (typeof props.Spacing === "string") {
                const num = parseFloat(props.Spacing);
                this.spacing.value = isNaN(num) ? 0 : num;
            }
            else {
                this.spacing.value = props.Spacing;
            }
        }
        else {
            this.spacing.value = 0;
        }
        if (props.LitBarColor !== undefined) {
            this.litBarColor.value.update(props.LitBarColor);
        }
        else {
            this.litBarColor.value.update(new Color(16, 140, 0));
        }
        if (props.LitBarColor2 !== undefined) {
            this.litBarColor2.value.update(props.LitBarColor2);
        }
        else {
            this.litBarColor2.value.update(new Color(0, 0, 0, 0));
        }
        if (props.UnlitBarColor !== undefined) {
            this.unlitBarColor.value.update(props.UnlitBarColor);
        }
        else {
            this.unlitBarColor.value.update(new Color(48, 48, 48));
        }
        this.barBlending.value = !(props.BarBlending === "false" || props.BarBlending === false);
        this.halfBars.value = props.HalfBars === "true" || props.HalfBars === true;
        this.barSubtexture.value = props.BarSubtexture ?? "";
        this.textureLinearFilter.value = !(props.TextureLinearFilter === "false" || props.TextureLinearFilter === false);
        if (props.LayoutDirection !== undefined) {
            if (typeof props.LayoutDirection === "string") {
                this.layoutDirection.value = string2LayoutDirection(props.LayoutDirection);
            }
            else {
                this.layoutDirection.value = props.LayoutDirection;
            }
        }
        else {
            this.layoutDirection.value = LayoutDirection.Horizontal;
        }
    }

    getStyle(): CSSProperties {
        const style = super.getStyle();
        style.width = `${this.width}px`;
        style.height = `${this.height}px`;
        style.flexDirection = getFlexDirection(this.layoutDirection.value,
            this.flipDirection.value);
        style.gap = `${this.spacing.value}px`;
        return style;
    }

    initInspectorProvider() {
        super.initInspectorProvider();
        this.inspectorProvider.removeAttribute("Size");
        this.inspectorProvider.addAttribute<number>("Value",
            AttributeType.Number,
            () => this.value.value,
            value => this.value.value = value);
        this.inspectorProvider.addAttribute<number>("Bars\u200BCount",
            AttributeType.Number,
            () => this.barsCount.value,
            value => this.barsCount.value = value);
        this.inspectorProvider.addAttribute<boolean>("Flip\u200BDirection",
            AttributeType.Boolean,
            () => this.flipDirection.value,
            value => this.flipDirection.value = value);

        this.inspectorProvider.addAttribute<Vector2>("Bar\u200BSize", AttributeType.Vector2, () => {
            return {X: this.barSizeX.value, Y: this.barSizeY.value};
        }, value => {
            if (value.X !== this.barSizeX.value) {
                this.barSizeX.value = value.X;
            }
            if (value.Y !== this.barSizeY.value) {
                this.barSizeY.value = value.Y;
            }
        });
        this.inspectorProvider.addAttribute<number>("Spacing",
            AttributeType.Number,
            () => this.spacing.value,
            value => this.spacing.value = value);
        this.inspectorProvider.addAttribute<Color>("Lit\u200BBar\u200BColor",
            AttributeType.Color,
            () => this.litBarColor.value,
            value => this.litBarColor.value.update(value));
        this.inspectorProvider.addAttribute<Color>("Lit\u200BBar\u200BColor2",
            AttributeType.Color,
            () => this.litBarColor2.value,
            value => this.litBarColor2.value.update(value));
        this.inspectorProvider.addAttribute<Color>("Unlit\u200BBar\u200BColor",
            AttributeType.Color,
            () => this.unlitBarColor.value,
            value => this.unlitBarColor.value.update(value));
        this.inspectorProvider.addAttribute<boolean>("Bar\u200BBlending",
            AttributeType.Boolean,
            () => this.barBlending.value,
            value => this.barBlending.value = value);
        this.inspectorProvider.addAttribute<boolean>("Half\u200BBars",
            AttributeType.Boolean,
            () => this.halfBars.value,
            value => this.halfBars.value = value);
        this.inspectorProvider.addAttribute<string>("Bar\u200BSubtexture",
            AttributeType.String,
            () => this.barSubtexture.value,
            value => this.barSubtexture.value = value);
        this.inspectorProvider.addAttribute<boolean>("Texture\u200BLinear\u200BFilter",
            AttributeType.Boolean,
            () => this.textureLinearFilter.value,
            value => this.textureLinearFilter.value = value);
        this.inspectorProvider.addAttribute<LayoutDirection>("Layout\u200BDirection",
            AttributeType.LayoutDirection,
            () => this.layoutDirection.value,
            value => this.layoutDirection.value = value);
    }

    afterInit() {
        watch([this.value,
            this.barsCount,
            this.flipDirection,
            this.barSizeX,
            this.barSizeY,
            this.spacing,
            this.litBarColor,
            this.litBarColor2,
            this.unlitBarColor,
            this.barBlending,
            this.halfBars,
            this.textureLinearFilter,
            this.layoutDirection], () => this.updateCanvas());
        watch(this.barSubtexture, () => this.updateBarSubtexture());
        watch(this.textureLinearFilter, newValue => {
            this.renderer2D?.texturedBatch2D?.updateFilter(newValue);
        });
        onMounted(() => {
            this.updateBarSubtexture();
            this.updateCanvas();
        });
    }
}

const vertexShaderSource = `#version 300 es
precision highp float;

layout(location = 0) in vec2 a_position;
layout(location = 1) in vec4 a_color;
layout(location = 2) in vec2 a_texcoord;

out vec4 v_color;
out vec2 v_texcoord;

uniform vec2 u_resolution;

void main() {
    vec2 zeroToOne = a_position / u_resolution;
    vec2 zeroToTwo = zeroToOne * 2.0;
    vec2 clipSpace = zeroToTwo - 1.0;
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    v_color = a_color;
    v_texcoord = a_texcoord;
}
`;

const fragmentShaderSource = `#version 300 es
precision highp float;

in vec4 v_color;
in vec2 v_texcoord;

out vec4 outColor;

uniform bool u_useTexture;
uniform sampler2D u_texture;

void main() {
    vec4 base = u_useTexture ? texture(u_texture, v_texcoord) : vec4(1.0);
    outColor = base * v_color;
}
`;

class Renderer2D {
    gl: WebGL2RenderingContext;
    glProgram: WebGLProgram;
    flatBatch2D: FlatBatch2D;
    texturedBatch2D?: TexturedBatch2D;

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
        const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
        this.glProgram = gl.createProgram();
        gl.attachShader(this.glProgram, vertexShader);
        gl.attachShader(this.glProgram, fragmentShader);
        gl.linkProgram(this.glProgram);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        gl.useProgram(this.glProgram);
        const texUniLoc = gl.getUniformLocation(this.glProgram, "u_texture");
        gl.uniform1i(texUniLoc, 0);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.flatBatch2D = new FlatBatch2D(this);
    }

    compileShader(type: GLenum, source: string) {
        const shader = this.gl.createShader(type);
        if (shader) {
            this.gl.shaderSource(shader, source);
            this.gl.compileShader(shader);
            if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
                this.gl.deleteShader(shader);
                throw "Shader compilation failed";
            }
            return shader;
        }
        throw "Shader compilation failed";
    }

    createOrUpdateTexturedBatch2D(bitmap: ImageBitmap, linearFilter: boolean) {
        if (this.texturedBatch2D) {
            this.texturedBatch2D.updateTexture(bitmap, linearFilter);
        }
        else {
            this.texturedBatch2D = new TexturedBatch2D(this, bitmap, linearFilter);
        }
    }

    flush(clear: boolean = false) {
        const resLoc = this.gl.getUniformLocation(this.glProgram, "u_resolution");
        this.gl.uniform2f(resLoc, this.gl.canvas.width, this.gl.canvas.height);
        this.flatBatch2D.flush(clear);
        this.texturedBatch2D?.flush(clear);
    }

    clear() {
        this.flatBatch2D.clear();
        this.texturedBatch2D?.clear();
    }

    clearCanvas(width: number, height: number) {
        if (this.gl) {
            this.gl.canvas.width = width;
            this.gl.canvas.height = height;
            this.gl.viewport(0, 0, width, height);
            this.gl.clearColor(0, 0, 0, 0);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        }
    }
}

class FlatBatch2D {
    gl: WebGL2RenderingContext;
    glProgram: WebGLProgram;
    triangleVao: WebGLVertexArrayObject;
    triangleVertexBuffer: WebGLBuffer;
    triangleVertices: number[] = [];
    triangleIndicesBuffer: WebGLBuffer;
    triangleIndices: number[] = [];
    lineVao: WebGLVertexArrayObject;
    lineVertexBuffer: WebGLBuffer;
    lineVertices: number[] = [];
    lineIndicesBuffer: WebGLBuffer;
    lineIndices: number[] = [];

    constructor(render2D: Renderer2D) {
        this.gl = render2D.gl;
        this.glProgram = render2D.glProgram;
        const posLoc = this.gl.getAttribLocation(this.glProgram, "a_position");
        const colorLoc = this.gl.getAttribLocation(this.glProgram, "a_color");
        this.triangleVao = this.gl.createVertexArray();
        this.gl.bindVertexArray(this.triangleVao);
        this.triangleVertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.triangleVertexBuffer);
        this.gl.enableVertexAttribArray(posLoc);
        this.gl.vertexAttribPointer(posLoc, 2, this.gl.FLOAT, false, 24, 0);
        this.gl.enableVertexAttribArray(colorLoc);
        this.gl.vertexAttribPointer(colorLoc, 4, this.gl.FLOAT, false, 24, 8);
        this.triangleIndicesBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.triangleIndicesBuffer);
        this.lineVao = this.gl.createVertexArray();
        this.gl.bindVertexArray(this.lineVao);
        this.lineVertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.lineVertexBuffer);
        this.gl.enableVertexAttribArray(posLoc);
        this.gl.vertexAttribPointer(posLoc, 2, this.gl.FLOAT, false, 24, 0);
        this.gl.enableVertexAttribArray(colorLoc);
        this.gl.vertexAttribPointer(colorLoc, 4, this.gl.FLOAT, false, 24, 8);
        this.lineIndicesBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.lineIndicesBuffer);
    }

    queueQuad(x1: number, y1: number, x2: number, y2: number, color: Color) {
        const count = this.triangleVertices.length / 6;
        const r = color.R / 255;
        const g = color.G / 255;
        const b = color.B / 255;
        const a = color.A / 255;
        this.triangleVertices.push(x1,
            y1,
            r,
            g,
            b,
            a,
            x1,
            y2,
            r,
            g,
            b,
            a,
            x2,
            y2,
            r,
            g,
            b,
            a,
            x2,
            y1,
            r,
            g,
            b,
            a);
        this.triangleIndices.push(count, count + 1, count + 2, count + 2, count + 3, count);
    }

    queueRectangle(x1: number, y1: number, x2: number, y2: number, color: Color) {
        const count = this.lineVertices.length / 6;
        const r = color.R / 255;
        const g = color.G / 255;
        const b = color.B / 255;
        const a = color.A / 255;
        this.lineVertices.push(x1,
            y1,
            r,
            g,
            b,
            a,
            x1,
            y2,
            r,
            g,
            b,
            a,
            x2,
            y2,
            r,
            g,
            b,
            a,
            x2,
            y1,
            r,
            g,
            b,
            a);
        this.lineIndices.push(count, count + 1, count + 2, count + 2, count + 3, count);
    }

    flush(clear: boolean = false) {
        let flag = true;
        if (this.triangleVertices.length > 0) {
            const useTexLoc = this.gl.getUniformLocation(this.glProgram, "u_useTexture");
            this.gl.uniform1i(useTexLoc, 0);
            flag = false;
            this.gl.bindVertexArray(this.triangleVao);
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.triangleVertexBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER,
                new Float32Array(this.triangleVertices),
                this.gl.STATIC_DRAW);
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.triangleIndicesBuffer);
            this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER,
                new Uint16Array(this.triangleIndices),
                this.gl.STATIC_DRAW);
            this.gl.drawElements(this.gl.TRIANGLES,
                this.triangleIndices.length,
                this.gl.UNSIGNED_SHORT,
                0);
        }
        if (this.lineVertices.length > 0) {
            if (flag) {
                const useTexLoc = this.gl.getUniformLocation(this.glProgram, "u_useTexture");
                this.gl.uniform1i(useTexLoc, 0);
            }
            this.gl.bindVertexArray(this.lineVao);
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.lineVertexBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER,
                new Float32Array(this.lineVertices),
                this.gl.STATIC_DRAW);
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.lineIndicesBuffer);
            this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER,
                new Uint16Array(this.lineIndices),
                this.gl.STATIC_DRAW);
            this.gl.drawElements(this.gl.LINES, this.lineIndices.length, this.gl.UNSIGNED_SHORT, 0);
        }
        if (clear) {
            this.clear();
        }
    }

    clear() {
        this.triangleVertices = [];
        this.triangleIndices = [];
        this.lineVertices = [];
        this.lineIndices = [];
    }
}

class TexturedBatch2D {
    gl: WebGL2RenderingContext;
    glProgram: WebGLProgram;
    vao: WebGLVertexArrayObject;
    vertexBuffer: WebGLBuffer;
    vertices: number[] = [];
    indicesBuffer: WebGLBuffer;
    indices: number[] = [];
    texture?: WebGLTexture;

    constructor(render2D: Renderer2D, bitmap: ImageBitmap, linearFilter: boolean) {
        this.gl = render2D.gl;
        this.glProgram = render2D.glProgram;
        const posLoc = this.gl.getAttribLocation(this.glProgram, "a_position");
        const colorLoc = this.gl.getAttribLocation(this.glProgram, "a_color");
        const texLoc = this.gl.getAttribLocation(this.glProgram, "a_texcoord");
        this.vao = this.gl.createVertexArray();
        this.gl.bindVertexArray(this.vao);
        this.vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.indicesBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer);
        this.gl.enableVertexAttribArray(posLoc);
        this.gl.vertexAttribPointer(posLoc, 2, this.gl.FLOAT, false, 32, 0);
        this.gl.enableVertexAttribArray(colorLoc);
        this.gl.vertexAttribPointer(colorLoc, 4, this.gl.FLOAT, false, 32, 8);
        this.gl.enableVertexAttribArray(texLoc);
        this.gl.vertexAttribPointer(texLoc, 2, this.gl.FLOAT, false, 32, 24);
        this.updateTexture(bitmap, linearFilter);
    }

    updateTexture(bitmap: ImageBitmap, linearFilter: boolean) {
        if (this.texture) {
            this.gl.deleteTexture(this.texture);
        }
        this.texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.updateFilter(linearFilter);
        this.gl.texImage2D(this.gl.TEXTURE_2D,
            0,
            this.gl.RGBA,
            this.gl.RGBA,
            this.gl.UNSIGNED_BYTE,
            bitmap);
    }

    updateFilter(linearFilter: boolean) {
        this.gl.texParameteri(this.gl.TEXTURE_2D,
            this.gl.TEXTURE_MAG_FILTER,
            linearFilter ? this.gl.LINEAR : this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D,
            this.gl.TEXTURE_MIN_FILTER,
            linearFilter ? this.gl.LINEAR : this.gl.NEAREST);
    }

    queueQuad(x1: number,
        y1: number,
        x2: number,
        y2: number,
        color: Color,
        u1: number = 0,
        v1: number = 0,
        u2: number = 1,
        v2: number = 1) {
        const count = this.vertices.length / 8;
        const r = color.R / 255;
        const g = color.G / 255;
        const b = color.B / 255;
        const a = color.A / 255;
        this.vertices.push(x1,
            y1,
            r,
            g,
            b,
            a,
            u1,
            v1,
            x1,
            y2,
            r,
            g,
            b,
            a,
            u1,
            v2,
            x2,
            y2,
            r,
            g,
            b,
            a,
            u2,
            v2,
            x2,
            y1,
            r,
            g,
            b,
            a,
            u2,
            v1);
        this.indices.push(count, count + 1, count + 2, count + 2, count + 3, count);
    }

    flush(clear: boolean = false) {
        if (this.vertices.length > 0 && this.texture) {
            const useTexLoc = this.gl.getUniformLocation(this.glProgram, "u_useTexture");
            this.gl.uniform1i(useTexLoc, 1);
            this.gl.activeTexture(this.gl.TEXTURE0);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
            this.gl.bindVertexArray(this.vao);
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER,
                new Float32Array(this.vertices),
                this.gl.STATIC_DRAW);
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer);
            this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER,
                new Uint16Array(this.indices),
                this.gl.STATIC_DRAW);
            this.gl.drawElements(this.gl.TRIANGLES, this.indices.length, this.gl.UNSIGNED_SHORT, 0);
        }
        if (clear) {
            this.clear();
        }
    }

    clear() {
        this.vertices = [];
        this.indices = [];
    }
}
