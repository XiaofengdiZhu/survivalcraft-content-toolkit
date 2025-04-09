import {WidgetClass} from "./Widget.ts";
import {onMounted, ref} from "vue";
import {getImageBitmap} from "../main.ts";

let texture: ImageBitmap | undefined;

export class PanoramaWidgetClass extends WidgetClass {
    canvasElement = ref<HTMLCanvasElement | null>(null);
    m_timeOffset = Math.random() * 1000;
    startTime: number = 0;
    lastTime: number = 0;
    m_positionX: number = 0;
    m_positionY: number = 0;

    afterInit() {
        onMounted(() => {
            if (texture === undefined) {
                getImageBitmap("Textures\\Gui\\Panorama")
                .then((bitmap) => {
                    if (bitmap !== null) {
                        texture = bitmap;
                        globalThis.requestAnimationFrame(time => {
                            this.draw(time);
                        });
                    }
                });
            }
        });
    }

    draw(time: number) {
        if (this.startTime === 0) {
            this.startTime = time;
            this.lastTime = time;
        }
        if (!texture) {
            return;
        }
        const canvas = this.canvasElement.value;
        if (!canvas) {
            return;
        }
        const context2D = canvas.getContext("2d");
        if (!context2D) {
            return;
        }
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        const num = remainder((time - this.startTime) / 1000 + this.m_timeOffset, 10000.0);
        const x = (2 * octavedNoise(num, 0.02, 4, 2, 0.5)) - 1;
        const y = (2 * octavedNoise(num + 100, 0.02, 4, 2, 0.5)) - 1;
        const temp = 0.06 * Math.min((time - this.lastTime) / 1000, 0.1);
        this.lastTime = time;
        this.m_positionX = remainder(this.m_positionX + x * temp, 1);
        this.m_positionY = remainder(this.m_positionY + y * temp, 1);
        const f = (0.5 * powSign(Math.sin((0.21 * num) + 2), 2)) + 0.5;
        const sWidthHalf = lerp(0.3, 0.5, f);
        const sHeightHalf = sWidthHalf / texture.height * texture.width / canvas.width * canvas.height;
        const sx = (this.m_positionX - sWidthHalf) * texture.width;
        const sy = (this.m_positionY - sHeightHalf) * texture.height;
        const sWidth = sWidthHalf * 2 * texture.width;
        const sHeight = sHeightHalf * 2 * texture.height;
        drawImageRepeated(context2D,
            texture,
            sx,
            sy,
            sWidth,
            sHeight,
            0,
            0,
            canvas.width,
            canvas.height);
        const num2 = canvas.width / 12;
        for (let num4 = 0; num4 < canvas.width; num4 += num2) {
            for (let num5 = 0; num5 < canvas.height; num5 += num2) {
                const num6 = 0.35 * Math.pow(saturate(octavedNoise3(num4 + 1000,
                    num5,
                    0.7 * num,
                    0.5,
                    1,
                    2,
                    1) - 0.1), 1);
                const num7 = 0.7 * Math.pow(octavedNoise3(num4, num5, 0.5 * num, 0.5, 1, 2, 1), 3);
                if (num6 > 0.01) {
                    context2D.strokeStyle = `rgba(0,0,0,${num6})`;
                    context2D.strokeRect(num4, num5, num2, num2);
                }
                if (num7 > 0.01) {
                    context2D.fillStyle = `rgba(0,0,0,${num7})`;
                    context2D.fillRect(num4, num5, num2, num2);
                }
            }
        }
        globalThis.requestAnimationFrame(time => {
            this.draw(time);
        });
    }
}

function remainder(x: number, y: number) {
    return x - Math.floor(x / y) * y;
}

function octavedNoise(x: number,
    frequency: number,
    octaves: number,
    frequencyStep: number,
    amplitudeStep: number,
    ridged: boolean = false): number {
    let num = 0;
    let num2 = 0;
    let num3 = 1;

    for (let i = 0; i < octaves; i++) {
        num += num3 * noise(x * frequency);
        num2 += num3;
        frequency *= frequencyStep;
        num3 *= amplitudeStep;
    }

    return ridged ? 1 - Math.abs((2 * num / num2) - 1) : num / num2;
}

function octavedNoise3(x: number,
    y: number,
    z: number,
    frequency: number,
    octaves: number,
    frequencyStep: number,
    amplitudeStep: number,
    ridged: boolean = false) {
    let num = 0;
    let num2 = 0;
    let num3 = 1;
    for (let i = 0; i < octaves; i++) {
        num += num3 * noise3(x * frequency, y * frequency, z * frequency);
        num2 += num3;
        frequency *= frequencyStep;
        num3 *= amplitudeStep;
    }
    return !ridged ? num / num2 : 1 - Math.abs((2 * num / num2) - 1);
}

function noise(x: number): number {
    const num = Math.floor(x);
    const x2 = Math.ceil(x);
    const num2 = x - num;
    const num3 = hash(num);
    const num4 = hash(x2);

    // 使用平滑插值公式
    return num3 + (num2 * num2 * (3 - (2 * num2)) * (num4 - num3));
}

const m_permutations = [151,
    160,
    137,
    91,
    90,
    15,
    131,
    13,
    201,
    95,
    96,
    53,
    194,
    233,
    7,
    225,
    140,
    36,
    103,
    30,
    69,
    142,
    8,
    99,
    37,
    240,
    21,
    10,
    23,
    190,
    6,
    148,
    247,
    120,
    234,
    75,
    0,
    26,
    197,
    62,
    94,
    252,
    219,
    203,
    117,
    35,
    11,
    32,
    57,
    177,
    33,
    88,
    237,
    149,
    56,
    87,
    174,
    20,
    125,
    136,
    171,
    168,
    68,
    175,
    74,
    165,
    71,
    134,
    139,
    48,
    27,
    166,
    77,
    146,
    158,
    231,
    83,
    111,
    229,
    122,
    60,
    211,
    133,
    230,
    220,
    105,
    92,
    41,
    55,
    46,
    245,
    40,
    244,
    102,
    143,
    54,
    65,
    25,
    63,
    161,
    1,
    216,
    80,
    73,
    209,
    76,
    132,
    187,
    208,
    89,
    18,
    169,
    200,
    196,
    135,
    130,
    116,
    188,
    159,
    86,
    164,
    100,
    109,
    198,
    173,
    186,
    3,
    64,
    52,
    217,
    226,
    250,
    124,
    123,
    5,
    202,
    38,
    147,
    118,
    126,
    255,
    82,
    85,
    212,
    207,
    206,
    59,
    227,
    47,
    16,
    58,
    17,
    182,
    189,
    28,
    42,
    223,
    183,
    170,
    213,
    119,
    248,
    152,
    2,
    44,
    154,
    163,
    70,
    221,
    153,
    101,
    155,
    167,
    43,
    172,
    9,
    129,
    22,
    39,
    253,
    19,
    98,
    108,
    110,
    79,
    113,
    224,
    232,
    178,
    185,
    112,
    104,
    218,
    246,
    97,
    228,
    251,
    34,
    242,
    193,
    238,
    210,
    144,
    12,
    191,
    179,
    162,
    241,
    81,
    51,
    145,
    235,
    249,
    14,
    239,
    107,
    49,
    192,
    214,
    31,
    181,
    199,
    106,
    157,
    184,
    84,
    204,
    176,
    115,
    121,
    50,
    45,
    127,
    4,
    150,
    254,
    138,
    236,
    205,
    93,
    222,
    114,
    67,
    29,
    24,
    72,
    243,
    141,
    128,
    195,
    78,
    66,
    215,
    61,
    156,
    180,
    151,
    160,
    137,
    91,
    90,
    15,
    131,
    13,
    201,
    95,
    96,
    53,
    194,
    233,
    7,
    225,
    140,
    36,
    103,
    30,
    69,
    142,
    8,
    99,
    37,
    240,
    21,
    10,
    23,
    190,
    6,
    148,
    247,
    120,
    234,
    75,
    0,
    26,
    197,
    62,
    94,
    252,
    219,
    203,
    117,
    35,
    11,
    32,
    57,
    177,
    33,
    88,
    237,
    149,
    56,
    87,
    174,
    20,
    125,
    136,
    171,
    168,
    68,
    175,
    74,
    165,
    71,
    134,
    139,
    48,
    27,
    166,
    77,
    146,
    158,
    231,
    83,
    111,
    229,
    122,
    60,
    211,
    133,
    230,
    220,
    105,
    92,
    41,
    55,
    46,
    245,
    40,
    244,
    102,
    143,
    54,
    65,
    25,
    63,
    161,
    1,
    216,
    80,
    73,
    209,
    76,
    132,
    187,
    208,
    89,
    18,
    169,
    200,
    196,
    135,
    130,
    116,
    188,
    159,
    86,
    164,
    100,
    109,
    198,
    173,
    186,
    3,
    64,
    52,
    217,
    226,
    250,
    124,
    123,
    5,
    202,
    38,
    147,
    118,
    126,
    255,
    82,
    85,
    212,
    207,
    206,
    59,
    227,
    47,
    16,
    58,
    17,
    182,
    189,
    28,
    42,
    223,
    183,
    170,
    213,
    119,
    248,
    152,
    2,
    44,
    154,
    163,
    70,
    221,
    153,
    101,
    155,
    167,
    43,
    172,
    9,
    129,
    22,
    39,
    253,
    19,
    98,
    108,
    110,
    79,
    113,
    224,
    232,
    178,
    185,
    112,
    104,
    218,
    246,
    97,
    228,
    251,
    34,
    242,
    193,
    238,
    210,
    144,
    12,
    191,
    179,
    162,
    241,
    81,
    51,
    145,
    235,
    249,
    14,
    239,
    107,
    49,
    192,
    214,
    31,
    181,
    199,
    106,
    157,
    184,
    84,
    204,
    176,
    115,
    121,
    50,
    45,
    127,
    4,
    150,
    254,
    138,
    236,
    205,
    93,
    222,
    114,
    67,
    29,
    24,
    72,
    243,
    141,
    128,
    195,
    78,
    66,
    215,
    61,
    156,
    180];
const m_grad3: number[][] = [[1, 1, 0],
    [-1, 1, 0],
    [1, -1, 0],
    [-1, -1, 0],
    [1, 0, 1],
    [-1, 0, 1],
    [1, 0, -1],
    [-1, 0, -1],
    [0, 1, 1],
    [0, -1, 1],
    [0, 1, -1],
    [0, -1, -1]];

function noise3(x: number, y: number, z: number) {
    const num = (x + y + z) * 0.333333343;
    const num2 = Math.floor(x + num);
    const num3 = Math.floor(y + num);
    const num4 = Math.floor(z + num);
    const num5 = (num2 + num3 + num4) * (355 / (678 * Math.PI));
    const num6 = num2 - num5;
    const num7 = num3 - num5;
    const num8 = num4 - num5;
    const num9 = x - num6;
    const num10 = y - num7;
    const num11 = z - num8;
    let num12: number;
    let num13: number;
    let num14: number;
    let num15: number;
    let num16: number;
    let num17: number;
    if (num9 >= num10) {
        if (num10 >= num11) {
            num12 = 1;
            num13 = 0;
            num14 = 0;
            num15 = 1;
            num16 = 1;
            num17 = 0;
        }
        else if (num9 >= num11) {
            num12 = 1;
            num13 = 0;
            num14 = 0;
            num15 = 1;
            num16 = 0;
            num17 = 1;
        }
        else {
            num12 = 0;
            num13 = 0;
            num14 = 1;
            num15 = 1;
            num16 = 0;
            num17 = 1;
        }
    }
    else if (num10 < num11) {
        num12 = 0;
        num13 = 0;
        num14 = 1;
        num15 = 0;
        num16 = 1;
        num17 = 1;
    }
    else if (num9 < num11) {
        num12 = 0;
        num13 = 1;
        num14 = 0;
        num15 = 0;
        num16 = 1;
        num17 = 1;
    }
    else {
        num12 = 0;
        num13 = 1;
        num14 = 0;
        num15 = 1;
        num16 = 1;
        num17 = 0;
    }
    const num18 = num9 - num12 + (355 / (678 * Math.PI));
    const num19 = num10 - num13 + (355 / (678 * Math.PI));
    const num20 = num11 - num14 + (355 / (678 * Math.PI));
    const num21 = num9 - num15 + 0.333333343;
    const num22 = num10 - num16 + 0.333333343;
    const num23 = num11 - num17 + 0.333333343;
    const num24 = num9 - 1 + 0.5;
    const num25 = num10 - 1 + 0.5;
    const num26 = num11 - 1 + 0.5;
    const num27 = num2 & 0xFF;
    const num28 = num3 & 0xFF;
    const num29 = num4 & 0xFF;
    const num30 = m_permutations[num27 + m_permutations[num28 + m_permutations[num29]]] % 12;
    const num31 = m_permutations[num27 + num12 + m_permutations[num28 + num13 + m_permutations[num29 + num14]]] % 12;
    const num32 = m_permutations[num27 + num15 + m_permutations[num28 + num16 + m_permutations[num29 + num17]]] % 12;
    const num33 = m_permutations[num27 + 1 + m_permutations[num28 + 1 + m_permutations[num29 + 1]]] % 12;
    let num34 = 0.6 - (num9 * num9) - (num10 * num10) - (num11 * num11);
    let num35: number;
    if (num34 < 0) {
        num35 = 0;
    }
    else {
        num34 *= num34;
        num35 = num34 * num34 * dot(m_grad3[num30], num9, num10, num11);
    }
    let num36 = 0.6 - (num18 * num18) - (num19 * num19) - (num20 * num20);
    let num37: number;
    if (num36 < 0) {
        num37 = 0;
    }
    else {
        num36 *= num36;
        num37 = num36 * num36 * dot(m_grad3[num31], num18, num19, num20);
    }
    let num38 = 0.6 - (num21 * num21) - (num22 * num22) - (num23 * num23);
    let num39: number;
    if (num38 < 0) {
        num39 = 0;
    }
    else {
        num38 *= num38;
        num39 = num38 * num38 * dot(m_grad3[num32], num21, num22, num23);
    }
    let num40 = 0.6 - (num24 * num24) - (num25 * num25) - (num26 * num26);
    let num41: number;
    if (num40 < 0) {
        num41 = 0;
    }
    else {
        num40 *= num40;
        num41 = num40 * num40 * dot(m_grad3[num33], num24, num25, num26);
    }
    return (16 * (num35 + num37 + num39 + num41)) + 0.5;
}

function hash(x: number) {
    x = (x << 13) ^ x;
    return (((x * ((x * x * 15731) + 789221)) + 1376312589) & 0x7FFFFFFF) / 2.14748365E+09;
}

function dot(g: number[], x: number, y: number, z: number) {
    return (g[0] * x) + (g[1] * y) + (g[2] * z);
}

function powSign(x: number, n: number) {
    return Math.sign(x) * Math.pow(Math.abs(x), n);
}

function lerp(x1: number, x2: number, f: number) {
    return x1 + (x2 - x1) * f;
}

function saturate(x: number) {
    if (!(x < 0)) {
        if (!(x > 1)) {
            return x;
        }
        return 1;
    }
    return 0;
}

// By DeepSeek
function drawImageRepeated(ctx: CanvasRenderingContext2D,
    image: ImageBitmap,
    sx: number,
    sy: number,
    sWidth: number,
    sHeight: number,
    dx: number,
    dy: number,
    dWidth: number,
    dHeight: number) {
    const imgWidth = image.width;
    const imgHeight = image.height;
    const widthRatio = dWidth / sWidth;
    const heightRatio = dHeight / sHeight;
    let currentSx = sx;
    let remainingSWidth = sWidth;
    while (remainingSWidth > 0) {
        const tileSx = ((currentSx % imgWidth) + imgWidth) % imgWidth;
        const tileSW = Math.min(imgWidth - tileSx, remainingSWidth);
        const tileDx = dx + (currentSx - sx) * widthRatio;
        const tileDw = tileSW * widthRatio;
        let currentSy = sy;
        let remainingSHeight = sHeight;
        while (remainingSHeight > 0) {
            const tileSy = ((currentSy % imgHeight) + imgHeight) % imgHeight;
            const tileSH = Math.min(imgHeight - tileSy, remainingSHeight);
            const tileDy = dy + (currentSy - sy) * heightRatio;
            const tileDh = tileSH * heightRatio;
            ctx.drawImage(image, tileSx, tileSy, tileSW, tileSH, tileDx, tileDy, tileDw, tileDh);
            remainingSHeight -= tileSH;
            currentSy += tileSH;
        }
        remainingSWidth -= tileSW;
        currentSx += tileSW;
    }
}
