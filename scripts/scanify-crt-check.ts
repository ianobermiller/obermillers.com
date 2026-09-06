#!/usr/bin/env tsx
// Confirms the CRT scanline overlay no longer lands on the sample scans:
// samples a vertical strip of the rendered BEFORE image and looks for the
// 3px-period darkening the overlay would introduce.
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: 'shell' });
const page = await browser.newPage();
await page.setViewport({ width: 900, height: 1100, deviceScaleFactor: 1 });
await page.goto(process.env["SCANIFY_ORIGIN"] ?? "http://localhost:5173/scanify/", {
  waitUntil: "networkidle2",
});

// The real test: capture the pixels as composited by the compositor.
const strip = await page.$eval('.compare figure:first-child img', (n: Element) => {
  const r = n.getBoundingClientRect();
  return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) };
});
const shot = await page.screenshot({ clip: strip, encoding: 'base64' });

// Decode the PNG in-page (no image deps in node) and look for row periodicity.
const rows = await page.evaluate(async (b64: string): Promise<number[]> => {
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('2d canvas context unavailable');
  }
  ctx.drawImage(bitmap, 0, 0);
  const { data } = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
  // Average luminance per row across a blank left margin column band.
  const x0 = Math.round(bitmap.width * 0.04);
  const x1 = Math.round(bitmap.width * 0.10);
  const out: number[] = [];
  // Skip the image border; only sample the composited photo pixels.
  for (let y = 3; y < Math.min(63, bitmap.height); y++) {
    let sum = 0;
    for (let x = x0; x < x1; x++) {
      const i = (y * bitmap.width + x) * 4;
      const r = data[i] ?? 0;
      const g = data[i + 1] ?? 0;
      const b = data[i + 2] ?? 0;
      sum += 0.299 * r + 0.587 * g + 0.114 * b;
    }
    out.push(+(sum / (x1 - x0)).toFixed(2));
  }
  return out;
}, shot);

const byPhase = [0, 1, 2].map((p) => {
  const vals = rows.filter((_, i) => i % 3 === p);
  return +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2);
});
const spread = +(Math.max(...byPhase) - Math.min(...byPhase)).toFixed(2);
console.log('row luminance, first 24:', rows.slice(0, 24).join(' '));
console.log('mean luminance by 3px phase:', byPhase, '→ spread', spread);
console.log(spread < 1.5 ? 'PASS: no 3px scanline pattern on the sample scan' : 'FAIL: scanlines still striping the sample');

await browser.close();
