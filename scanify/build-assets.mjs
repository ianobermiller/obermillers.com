// Regenerates the static assets for the Scanify page:
//
//   scanner.gif          animated flatbed scanner, drawn frame by frame on a canvas
//   example-before.jpg   page 1 of a sample memo, rendered clean
//   example-after.jpg    the same page run through the real scanify pipeline
//
// The before/after pair is produced by the shipping effect code rather than by
// hand, so the demo can never drift from what the tool actually does.
//
// Requires ffmpeg on PATH. Run with: npm run scanify:assets

import puppeteer from 'puppeteer';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);
const here = path.dirname(fileURLToPath(import.meta.url));
const PDFJS = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build';

const GIF = { width: 640, height: 400, outWidth: 320, outHeight: 200, frames: 30, delayMs: 60 };
// Rendered larger than it displays so the thumbnails can link to a readable
// full-size version.
const EXAMPLE = { dpi: 120, outWidth: 1000, preset: 'medium' };

const MEMO = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  @page { size: letter; margin: 0.9in 1in; }
  body { font: 12pt/1.55 "Times New Roman", Times, serif; color: #000; }
  h1 { font-size: 15pt; letter-spacing: 0.14em; text-align: center; margin-bottom: 26px; }
  table.head { width: 100%; font-family: "Courier New", monospace; font-size: 10.5pt;
               margin-bottom: 24px; }
  table.head td:first-child { width: 68px; font-weight: bold; }
  p { margin: 0 0 11px; text-align: justify; }
  ol { margin: 0 0 11px 22px; }
  li { margin-bottom: 5px; }
  .sig { margin-top: 26px; font-family: "Courier New", monospace; font-size: 10.5pt; }
  .sig .line { border-bottom: 1px solid #000; width: 240px; height: 30px; }
  .cc { margin-top: 20px; font-family: "Courier New", monospace; font-size: 9.5pt; color: #222; }
</style></head><body>
  <h1>INTEROFFICE MEMORANDUM</h1>
  <table class="head">
    <tr><td>TO:</td><td>All Staff, Floors 2 &amp; 3</td></tr>
    <tr><td>FROM:</td><td>Office Systems &amp; Document Services</td></tr>
    <tr><td>DATE:</td><td>October 14, 1996</td></tr>
    <tr><td>RE:</td><td>New Flatbed Scanner &mdash; Room 214</td></tr>
  </table>
  <p>Effective Monday, the flatbed scanner in Room 214 is available to all
  departments. Please review the following procedures before your first use, as
  the unit is shared and the service contract does not cover misuse.</p>
  <ol>
    <li>Reserve time on the clipboard by the door. Sessions are limited to
    twenty (20) minutes during business hours.</li>
    <li>Lift the lid fully before placing your document. Do not force the lid
    closed over bound reports, three-ring binders, or coffee mugs.</li>
    <li>Align the top-left corner of your original to the arrow etched on the
    glass. Pages fed crooked will scan crooked.</li>
    <li>Clean the glass with the blue cloth provided. The yellow cloth is for
    the monitor and the green cloth is for nothing at all.</li>
  </ol>
  <p>Scanned files are written to the shared volume in the DOCS directory.
  Filenames are limited to eight characters plus extension, so please adopt a
  consistent naming scheme within your department rather than inventing one at
  the machine.</p>
  <p>Questions regarding resolution settings, file formats, or the persistent
  humming noise should be directed to extension 4417. Please do not attempt to
  open the housing; the lamp assembly is not user serviceable.</p>
  <div class="sig">
    <div class="line"></div>
    Authorized Signature
  </div>
  <div class="cc">cc: Facilities, Purchasing, Reception</div>
</body></html>`;

// --- Scanner animation ------------------------------------------------------
// Runs inside the browser: draws one frame of the scanner and returns a PNG.
function drawFrame(frame, cfg) {
    const { width: W, height: H, frames } = cfg;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    const SWEEP = 22;
    const scanning = frame < SWEEP;
    const sweep = scanning ? frame / (SWEEP - 1) : 0;
    const ledOn = scanning || (frame - SWEEP) % 4 < 2;

    // Dim office backdrop.
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#14333d');
    bg.addColorStop(0.62, '#0d2129');
    bg.addColorStop(1, '#091519');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Fluorescent tube glow from above.
    const glow = ctx.createRadialGradient(W / 2, -60, 20, W / 2, -60, 420);
    glow.addColorStop(0, 'rgba(255,244,214,0.30)');
    glow.addColorStop(1, 'rgba(255,244,214,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // Desk.
    const desk = ctx.createLinearGradient(0, 296, 0, H);
    desk.addColorStop(0, '#4a3a2c');
    desk.addColorStop(1, '#2a2019');
    ctx.fillStyle = desk;
    ctx.fillRect(0, 296, W, H - 296);
    ctx.strokeStyle = 'rgba(255,226,170,0.18)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 297);
    ctx.lineTo(W, 297);
    ctx.stroke();

    // Contact shadow.
    ctx.save();
    ctx.filter = 'blur(10px)';
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.ellipse(W / 2, 302, 250, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const outline = (path, fill) => {
        ctx.fillStyle = fill;
        path();
        ctx.fill();
        ctx.strokeStyle = '#1e1b16';
        ctx.lineWidth = 3;
        ctx.stroke();
    };

    // Lid, tilted back and open. The white pressure pad on its underside is
    // what makes it read as a lid rather than a floating panel.
    outline(() => {
        ctx.beginPath();
        ctx.moveTo(110, 152);
        ctx.lineTo(530, 152);
        ctx.lineTo(562, 86);
        ctx.lineTo(142, 86);
        ctx.closePath();
    }, '#a29b89');
    ctx.fillStyle = '#e9e6dc';
    ctx.beginPath();
    ctx.moveTo(138, 144);
    ctx.lineTo(502, 144);
    ctx.lineTo(528, 96);
    ctx.lineTo(164, 96);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(60,56,48,0.45)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#6d6859';
    for (const hx of [122, 492]) {
        ctx.beginPath();
        ctx.roundRect(hx, 146, 28, 12, 3);
        ctx.fill();
    }

    // Body.
    outline(() => {
        ctx.beginPath();
        ctx.roundRect(66, 152, 508, 146, 14);
    }, '#dcd5c3');
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fillRect(80, 158, 480, 5);

    // Platen recess.
    outline(() => {
        ctx.beginPath();
        ctx.roundRect(96, 166, 448, 100, 6);
    }, '#7e776a');

    // Document on the glass.
    const page = { x: 108, y: 174, w: 424, h: 84 };
    ctx.fillStyle = '#f7f5ed';
    ctx.fillRect(page.x, page.y, page.w, page.h);
    ctx.fillStyle = 'rgba(60,58,52,0.55)';
    for (let i = 0; i < 7; i++) {
        const y = page.y + 12 + i * 10;
        const w = i === 0 ? 150 : page.w - 40 - (i % 3) * 46;
        ctx.fillRect(page.x + 16, y, w, i === 0 ? 5 : 3);
    }

    // Lamp sweep, clipped to the page.
    if (scanning) {
        const travel = page.w - 20;
        const x = page.x + 10 + sweep * travel;
        ctx.save();
        ctx.beginPath();
        ctx.rect(page.x, page.y, page.w, page.h);
        ctx.clip();

        // Territory already covered comes out cleaner; what's ahead sits in shade.
        ctx.fillStyle = 'rgba(255,255,255,0.10)';
        ctx.fillRect(page.x, page.y, x - page.x, page.h);
        ctx.fillStyle = 'rgba(108,104,94,0.13)';
        ctx.fillRect(x, page.y, page.x + page.w - x, page.h);

        // Painted normally so the green survives GIF quantization.
        const bar = ctx.createLinearGradient(x - 17, 0, x + 17, 0);
        bar.addColorStop(0, 'rgba(60,235,150,0)');
        bar.addColorStop(0.3, 'rgba(78,240,162,0.62)');
        bar.addColorStop(0.5, 'rgba(206,255,230,0.96)');
        bar.addColorStop(0.7, 'rgba(78,240,162,0.62)');
        bar.addColorStop(1, 'rgba(60,235,150,0)');
        ctx.fillStyle = bar;
        ctx.fillRect(x - 17, page.y, 34, page.h);
        ctx.fillStyle = 'rgba(248,255,252,0.95)';
        ctx.fillRect(x - 1, page.y, 2, page.h);
        ctx.restore();

        // Light escaping upward across the open lid, for atmosphere.
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const spill = ctx.createLinearGradient(0, page.y - 78, 0, page.y + 6);
        spill.addColorStop(0, 'rgba(70,235,150,0)');
        spill.addColorStop(1, 'rgba(96,250,170,0.34)');
        ctx.fillStyle = spill;
        ctx.beginPath();
        ctx.moveTo(x - 16, page.y + 6);
        ctx.lineTo(x + 16, page.y + 6);
        ctx.lineTo(x + 30, page.y - 78);
        ctx.lineTo(x - 30, page.y - 78);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    // Front panel: buttons and status lamp.
    ctx.fillStyle = '#bdb6a3';
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.roundRect(452 + i * 34, 274, 24, 12, 3);
        ctx.fill();
        ctx.strokeStyle = '#1e1b16';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    if (ledOn) {
        ctx.save();
        ctx.filter = 'blur(5px)';
        ctx.fillStyle = 'rgba(90,255,150,0.85)';
        ctx.beginPath();
        ctx.arc(118, 280, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    ctx.fillStyle = ledOn ? '#63f79c' : '#1f3d2b';
    ctx.beginPath();
    ctx.arc(118, 280, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1e1b16';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Vignette.
    const vig = ctx.createRadialGradient(W / 2, H / 2, 120, W / 2, H / 2, 400);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);

    void frames;
    return canvas.toDataURL('image/png');
}

async function buildGif(browser) {
    const page = await browser.newPage();
    await page.goto('about:blank');
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'scanify-gif-'));

    for (let frame = 0; frame < GIF.frames; frame++) {
        const dataUrl = await page.evaluate(drawFrame, frame, GIF);
        const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
        await fs.writeFile(
            path.join(dir, `f${String(frame).padStart(3, '0')}.png`),
            Buffer.from(base64, 'base64'),
        );
    }
    await page.close();

    const gifPath = path.join(here, 'scanner.gif');
    const fps = Math.round(1000 / GIF.delayMs);
    await run('ffmpeg', [
        '-y', '-loglevel', 'error',
        '-framerate', String(fps),
        '-i', path.join(dir, 'f%03d.png'),
        '-vf', `scale=${GIF.outWidth}:${GIF.outHeight}:flags=lanczos,split[a][b];` +
            '[a]palettegen=max_colors=160[p];[b][p]paletteuse=dither=bayer:bayer_scale=3',
        '-loop', '0',
        gifPath,
    ]);
    await fs.rm(dir, { recursive: true, force: true });
    return gifPath;
}

// --- Before / after pair ----------------------------------------------------
const HARNESS = `<!DOCTYPE html><html><body><script type="module">
import * as pdfjsLib from '${PDFJS}/pdf.min.mjs';
import { PRESETS, scanifyPage } from './scanify.js';
pdfjsLib.GlobalWorkerOptions.workerSrc = '${PDFJS}/pdf.worker.min.mjs';

function downscale(source, outWidth) {
  const canvas = document.createElement('canvas');
  canvas.width = outWidth;
  canvas.height = Math.round((source.height / source.width) * outWidth);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.9);
}

window.makeExample = async (bytes, presetKey, dpi, outWidth) => {
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(bytes) }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: dpi / 72 });
  const clean = document.createElement('canvas');
  clean.width = Math.round(viewport.width);
  clean.height = Math.round(viewport.height);
  const ctx = clean.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, clean.width, clean.height);
  await page.render({ canvasContext: ctx, viewport }).promise;

  const { label, ...options } = PRESETS[presetKey];
  const blob = await scanifyPage(clean, options, 20241014);
  const scanned = await createImageBitmap(blob);

  return { before: downscale(clean, outWidth), after: downscale(scanned, outWidth), label };
};
<\/script></body></html>`;

function startServer(root) {
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript' };
    const server = http.createServer(async (req, res) => {
        const url = req.url.split('?')[0];
        if (url === '/harness.html') {
            res.writeHead(200, { 'content-type': 'text/html' }).end(HARNESS);
            return;
        }
        try {
            const file = path.join(root, path.normalize(url).replace(/^(\.\.[/\\])+/, ''));
            const body = await fs.readFile(file);
            res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' });
            res.end(body);
        } catch {
            res.writeHead(404).end('not found');
        }
    });
    return new Promise((resolve) => {
        server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
    });
}

async function buildExample(browser) {
    const maker = await browser.newPage();
    await maker.setContent(MEMO, { waitUntil: 'load' });
    const pdfBytes = await maker.pdf({ format: 'letter', printBackground: true });
    await maker.close();

    const { server, port } = await startServer(here);
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${port}/harness.html`, { waitUntil: 'networkidle2' });
    await page.waitForFunction(() => typeof window.makeExample === 'function', { timeout: 30000 });

    const result = await page.evaluate(
        (bytes, preset, dpi, outWidth) => window.makeExample(bytes, preset, dpi, outWidth),
        [...pdfBytes],
        EXAMPLE.preset,
        EXAMPLE.dpi,
        EXAMPLE.outWidth,
    );

    await page.close();
    server.close();
    if (errors.length) throw new Error(`harness errors: ${errors.join('; ')}`);

    const write = async (name, dataUrl) => {
        const file = path.join(here, name);
        await fs.writeFile(file, Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64'));
        return file;
    };
    return {
        before: await write('example-before.jpg', result.before),
        after: await write('example-after.jpg', result.after),
        label: result.label,
    };
}

// --- Main -------------------------------------------------------------------
const browser = await puppeteer.launch({ headless: 'shell' });
try {
    const gif = await buildGif(browser);
    const example = await buildExample(browser);
    for (const file of [gif, example.before, example.after]) {
        const { size } = await fs.stat(file);
        console.log(`${path.basename(file).padEnd(22)} ${(size / 1024).toFixed(0)} KB`);
    }
    console.log(`example preset: ${example.label}`);
} finally {
    await browser.close();
}
