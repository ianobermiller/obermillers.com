#!/usr/bin/env tsx
// Guards the download path: the browser must begin exactly ONE download per
// batch. Dropping several PDFs used to fire one download per file, and browsers
// silently blocked everything after the first.
//
// A single PDF should arrive as a bare PDF; several should arrive as one ZIP.
//
// Needs the site served locally (npm run dev) plus puppeteer.
// Run with: npm run scanify:download-check

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import puppeteer from 'puppeteer';
import type { Browser, ElementHandle, Page } from 'puppeteer';

const ORIGIN = process.env["SCANIFY_ORIGIN"] ?? "http://localhost:5173";
const work = await fs.mkdtemp(path.join(os.tmpdir(), 'scanify-download-'));
const browser: Browser = await puppeteer.launch({ headless: 'shell' });
const failures: string[] = [];

function check(label: string, actual: string | number, expected: string | number): void {
  const ok = String(actual) === String(expected);
  console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${label}: ${actual}${ok ? '' : ` (expected ${expected})`}`);
  if (!ok) failures.push(label);
}

async function makePdf(name: string, pages: number): Promise<string> {
  const page = await browser.newPage();
  await page.setContent(`<style>body{font:12pt/1.6 Georgia,serif;margin:1in}
    .p{page-break-after:always}</style>${Array.from({ length: pages }, (_, i) =>
    `<div class="p"><h1>${name} page ${i + 1}</h1><p>${'Sample body copy. '.repeat(40)}</p></div>`).join('')}`);
  const file = path.join(work, `${name}.pdf`);
  await fs.writeFile(file, await page.pdf({ format: 'letter' }));
  await page.close();
  return file;
}

async function runBatch(
  label: string,
  inputs: string[],
): Promise<{ started: string[]; onDisk: string[]; dir: string }> {
  console.log(`\n${label}`);
  const downloadDir = path.join(work, label.replace(/\W+/g, '-'));
  await fs.mkdir(downloadDir, { recursive: true });

  const page: Page = await browser.newPage();
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e: unknown) => {
    errors.push(e instanceof Error ? e.message : String(e));
  });
  await page.goto(`${ORIGIN}/scanify/`, { waitUntil: 'networkidle2' });

  const client = await page.createCDPSession();
  const started: string[] = [];
  client.on('Browser.downloadWillBegin', (event: { suggestedFilename: string }) => {
    started.push(event.suggestedFilename);
  });
  await client.send('Browser.setDownloadBehavior', {
    behavior: 'allow', downloadPath: downloadDir, eventsEnabled: true,
  });

  const fileInput = await page.$('#file');
  if (fileInput === null) {
    throw new Error('missing #file input');
  }
  await (fileInput as ElementHandle<HTMLInputElement>).uploadFile(...inputs);
  await page.waitForFunction(
    () => document.querySelector('#progressLabel')?.textContent?.startsWith('Done') === true,
    { timeout: 180000 },
  );
  await new Promise((resolve) => setTimeout(resolve, 2500));

  check('downloads begun', started.length, 1);
  check('console errors', errors.length, 0);
  const onDisk = (await fs.readdir(downloadDir)).filter((f) => !f.endsWith('.crdownload'));
  console.log(`  ..    saved: ${onDisk.join(', ')}`);
  await page.close();
  return { started, onDisk, dir: downloadDir };
}

const single = await makePdf('solo', 2);
const one = await runBatch('single file', [single]);
check('extension', path.extname(one.started[0] || ''), '.pdf');

const many = [await makePdf('alpha', 2), await makePdf('beta', 1), await makePdf('gamma', 3)];
const batch = await runBatch('three files', many);
check('extension', path.extname(batch.started[0] || ''), '.zip');

// The archive must be readable and hold one PDF per input.
const zip = path.join(batch.dir, batch.started[0] || '');
const bytes = await fs.readFile(zip);
const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
check('zip signature', view.getUint32(0, true).toString(16), '4034b50');
const eocd = bytes.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
check('entries in central directory', view.getUint16(eocd + 10, true), many.length);

await browser.close();
await fs.rm(work, { recursive: true, force: true });

console.log(failures.length ? `\nFAILED: ${failures.join(', ')}` : '\nAll download checks passed.');
process.exit(failures.length ? 1 : 0);
