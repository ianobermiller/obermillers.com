// Turns a cleanly rendered PDF page into something that looks printed and scanned.

export const PRESETS = {
    light: {
        label: 'Barely used',
        rotation: 0.25,
        offset: 0.002,
        inkSpread: 0.15,
        blur: 0.3,
        lighting: 0.35,
        noise: 0.02,
        contrast: 0.1,
        gamma: 1.02,
        black: 22,
        white: 252,
        desaturate: 0.5,
        warmth: 0.25,
        specks: 0.15,
        jitter: 0,
        edgeShadow: 0.3,
        quality: 0.9,
    },
    medium: {
        label: 'Office scanner',
        rotation: 0.7,
        offset: 0.005,
        inkSpread: 0.35,
        blur: 0.55,
        lighting: 0.7,
        noise: 0.045,
        contrast: 0.22,
        gamma: 1.06,
        black: 34,
        white: 246,
        desaturate: 0.75,
        warmth: 0.6,
        specks: 0.4,
        jitter: 0.3,
        edgeShadow: 0.6,
        quality: 0.72,
    },
    heavy: {
        label: 'Faxed twice',
        rotation: 1.6,
        offset: 0.012,
        inkSpread: 0.6,
        blur: 0.9,
        lighting: 1,
        noise: 0.09,
        contrast: 0.4,
        gamma: 1.15,
        black: 46,
        white: 238,
        desaturate: 1,
        warmth: 0.7,
        specks: 0.8,
        jitter: 0.7,
        edgeShadow: 1,
        quality: 0.5,
    },
    photocopy: {
        label: 'Photocopy',
        rotation: 1.1,
        offset: 0.008,
        inkSpread: 0.8,
        blur: 0.7,
        lighting: 0.9,
        noise: 0.06,
        contrast: 0.85,
        gamma: 1.3,
        black: 18,
        white: 250,
        desaturate: 1,
        warmth: 0.15,
        specks: 0.6,
        jitter: 0.4,
        edgeShadow: 0.8,
        quality: 0.65,
    },
};

// Deterministic PRNG so the same seed reproduces the same "scan".
export function makeRng(seed) {
    let a = (seed >>> 0) || 1;
    return function rng() {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function between(rng, lo, hi) {
    return lo + rng() * (hi - lo);
}

function buildToneCurve(o) {
    const lut = new Uint8Array(256);
    const contrast = 1 + o.contrast * 2.5;
    const lo = o.black / 255;
    const span = (o.white - o.black) / 255;
    for (let i = 0; i < 256; i++) {
        let v = Math.pow(i / 255, o.gamma);
        v = (v - 0.5) * contrast + 0.5;
        v = lo + Math.min(1, Math.max(0, v)) * span;
        lut[i] = Math.min(255, Math.max(0, Math.round(v * 255)));
    }
    return lut;
}

// Uneven lamp brightness, approximated as a separable field so it stays cheap.
function buildLightField(w, h, o, rng) {
    const strength = o.lighting;
    const tiltX = between(rng, -0.07, 0.07) * strength;
    const tiltY = between(rng, -0.05, 0.05) * strength;
    const vignetteX = between(rng, 0.03, 0.11) * strength;
    const vignetteY = between(rng, 0.02, 0.08) * strength;
    const bandAmp = between(rng, 0.002, 0.008) * strength;
    const bandFreq = between(rng, 40, 120);
    const bandPhase = rng() * Math.PI * 2;

    const fx = new Float32Array(w);
    for (let x = 0; x < w; x++) {
        const u = w > 1 ? x / (w - 1) : 0;
        const centered = 2 * u - 1;
        fx[x] = 1 + tiltX * (u - 0.5) * 2 - vignetteX * centered * centered;
    }
    const fy = new Float32Array(h);
    for (let y = 0; y < h; y++) {
        const t = h > 1 ? y / (h - 1) : 0;
        const centered = 2 * t - 1;
        let v = 1 + tiltY * (t - 0.5) * 2 - vignetteY * centered * centered;
        v += bandAmp * Math.sin(t * bandFreq + bandPhase);
        v += (rng() - 0.5) * 0.004 * strength;
        fy[y] = v;
    }
    return { fx, fy };
}

// Feed rollers pull the page unevenly, so rows drift sideways by a pixel or two.
function buildRowShifts(h, o, rng) {
    const max = o.jitter * 2.2;
    const shifts = new Int16Array(h);
    if (max <= 0) return shifts;
    let drift = 0;
    for (let y = 0; y < h; y++) {
        drift += (rng() - 0.5) * 0.35;
        drift = Math.max(-max, Math.min(max, drift * 0.985));
        shifts[y] = Math.round(drift);
    }
    return shifts;
}

function paperColor(o) {
    const warm = o.warmth;
    const r = Math.round(255 - 3 * warm);
    const g = Math.round(255 - 9 * warm);
    const b = Math.round(255 - 24 * warm);
    return `rgb(${r},${g},${b})`;
}

// Signed magnitudes are kept away from zero so a page never lands perfectly
// square on the glass, which is the giveaway that it was never really scanned.
function signedJitter(rng, max) {
    return (rng() < 0.5 ? -1 : 1) * between(rng, 0.4, 1) * max;
}

function layoutPage(w, h, o, rng) {
    return {
        angle: (signedJitter(rng, o.rotation) * Math.PI) / 180,
        dx: signedJitter(rng, o.offset) * w,
        dy: signedJitter(rng, o.offset) * h,
        paperW: w * 0.988,
        paperH: h * 0.988,
    };
}

function compose(src, o, rng) {
    const w = src.width;
    const h = src.height;
    const out = document.createElement('canvas');
    out.width = w;
    out.height = h;
    const ctx = out.getContext('2d', { willReadFrequently: true });

    const bedShade = Math.round(255 - 40 * o.edgeShadow - 10);
    ctx.fillStyle = `rgb(${bedShade},${bedShade},${bedShade + 2})`;
    ctx.fillRect(0, 0, w, h);

    const { angle, dx, dy, paperW, paperH } = layoutPage(w, h, o, rng);
    ctx.save();
    ctx.translate(w / 2 + dx, h / 2 + dy);
    ctx.rotate(angle);

    const shadowScale = Math.max(w, h) / 1600;
    ctx.shadowColor = `rgba(0,0,0,${0.45 * o.edgeShadow})`;
    ctx.shadowBlur = 14 * shadowScale * o.edgeShadow;
    ctx.shadowOffsetX = between(rng, -3, 3) * shadowScale;
    ctx.shadowOffsetY = between(rng, 1, 5) * shadowScale;
    ctx.fillStyle = paperColor(o);
    ctx.fillRect(-paperW / 2, -paperH / 2, paperW, paperH);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    if (o.blur > 0) ctx.filter = `blur(${o.blur}px)`;
    ctx.drawImage(src, -paperW / 2, -paperH / 2, paperW, paperH);

    // Toner and inkjet ink both bleed outward; multiply-blending nudged copies
    // thickens glyph edges without touching the white paper.
    if (o.inkSpread > 0) {
        const step = Math.max(0.6, shadowScale * 1.4);
        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha = 0.16 * o.inkSpread;
        for (const [ox, oy] of [[step, 0], [-step, 0], [0, step], [0, -step]]) {
            ctx.drawImage(src, -paperW / 2 + ox, -paperH / 2 + oy, paperW, paperH);
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
    }
    ctx.filter = 'none';
    ctx.restore();

    return { canvas: out, ctx };
}

function applyPixelPass(ctx, w, h, o, rng) {
    const image = ctx.getImageData(0, 0, w, h);
    const data = image.data;
    const lut = buildToneCurve(o);
    const { fx, fy } = buildLightField(w, h, o, rng);
    const shifts = buildRowShifts(h, o, rng);
    const source = o.jitter > 0 ? new Uint8ClampedArray(data) : data;

    const noiseAmp = o.noise * 90;
    const desat = o.desaturate;
    const tintG = 1 - 0.004 * o.warmth;
    const tintB = 1 - 0.03 * o.warmth;

    for (let y = 0; y < h; y++) {
        const rowLight = fy[y];
        const shift = shifts[y];
        const rowStart = y * w * 4;
        for (let x = 0; x < w; x++) {
            const i = rowStart + x * 4;
            let sx = x + shift;
            if (sx < 0) sx = 0;
            else if (sx >= w) sx = w - 1;
            const s = rowStart + sx * 4;

            let r = lut[source[s]];
            let g = lut[source[s + 1]];
            let b = lut[source[s + 2]];

            if (desat > 0) {
                const luma = 0.299 * r + 0.587 * g + 0.114 * b;
                r += (luma - r) * desat;
                g += (luma - g) * desat;
                b += (luma - b) * desat;
                g *= tintG;
                b *= tintB;
            }

            const light = rowLight * fx[x];
            const n = (rng() - 0.5) * noiseAmp;
            data[i] = r * light + n;
            data[i + 1] = g * light + n;
            data[i + 2] = b * light + n;
        }
    }
    ctx.putImageData(image, 0, 0);
}

function addDebris(ctx, w, h, o, rng) {
    if (o.specks <= 0) return;
    const scale = Math.max(w, h) / 1600;
    const dots = Math.round(o.specks * 260 * scale);
    ctx.save();
    for (let i = 0; i < dots; i++) {
        const dark = rng() < 0.72;
        ctx.fillStyle = dark
            ? `rgba(40,38,36,${between(rng, 0.1, 0.5)})`
            : `rgba(255,255,255,${between(rng, 0.15, 0.6)})`;
        const radius = between(rng, 0.3, 1.5) * scale;
        ctx.beginPath();
        ctx.arc(rng() * w, rng() * h, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    const hairs = Math.round(o.specks * 3);
    for (let i = 0; i < hairs; i++) {
        ctx.strokeStyle = `rgba(60,58,55,${between(rng, 0.06, 0.2)})`;
        ctx.lineWidth = between(rng, 0.4, 1.1) * scale;
        const x0 = rng() * w;
        const y0 = rng() * h;
        const len = between(rng, 20, 160) * scale;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.bezierCurveTo(
            x0 + between(rng, -len, len), y0 + between(rng, -len, len),
            x0 + between(rng, -len, len), y0 + between(rng, -len, len),
            x0 + between(rng, -len, len), y0 + between(rng, -len, len),
        );
        ctx.stroke();
    }
    ctx.restore();
}

function toBlob(canvas, quality) {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error('Could not encode page image'))),
            'image/jpeg',
            quality,
        );
    });
}

/**
 * @param {HTMLCanvasElement} src clean render of a single PDF page
 * @param {object} options merged preset + overrides
 * @param {number} seed per-page seed, so pages differ but stay reproducible
 * @returns {Promise<Blob>} JPEG of the scanned-looking page
 */
export async function scanifyPage(src, options, seed) {
    const rng = makeRng(seed);
    const { canvas, ctx } = compose(src, options, rng);
    applyPixelPass(ctx, canvas.width, canvas.height, options, rng);
    addDebris(ctx, canvas.width, canvas.height, options, rng);
    return toBlob(canvas, options.quality);
}
