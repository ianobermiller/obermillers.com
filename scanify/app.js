// Pinned to 4.x on purpose: pdf.js 5.5+ calls Map.prototype.getOrInsertComputed,
// which most shipping browsers still lack.
import * as pdfjsLib from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs';
import { PRESETS, scanifyPage } from './scanify.js';
import { createZip } from './zip.js';

pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';

const DEFAULT_PRESET = 'light';

const el = {
    overlay: document.getElementById('overlay'),
    dropzone: document.getElementById('dropzone'),
    file: document.getElementById('file'),
    progress: document.getElementById('progress'),
    progressFill: document.getElementById('progressFill'),
    progressLabel: document.getElementById('progressLabel'),
    results: document.getElementById('results'),
    advanced: document.getElementById('advanced'),
    presets: document.getElementById('presets'),
    dpi: document.getElementById('dpi'),
    seed: document.getElementById('seed'),
    seedOut: document.getElementById('seedOut'),
    reroll: document.getElementById('reroll'),
    preview: document.getElementById('preview'),
    redownload: document.getElementById('redownload'),
    previewNote: document.getElementById('previewNote'),
    previewBox: document.getElementById('previewBox'),
    previewImg: document.getElementById('previewImg'),
    lamp: document.getElementById('lamp'),
    statusMsg: document.getElementById('statusMsg'),
};

const sliders = [...document.querySelectorAll('input[data-opt]')];

const state = {
    options: optionsFor(DEFAULT_PRESET),
    presetKey: DEFAULT_PRESET,
    busy: false,
    batch: [],
    results: [],
    previewLive: false,
    previewToken: 0,
    previewUrl: '',
};

function optionsFor(key) {
    const { label, ...options } = PRESETS[key];
    return options;
}

const yieldToPaint = () =>
    new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));

function setBusy(busy, message) {
    state.busy = busy;
    el.lamp.classList.toggle('busy', busy);
    el.statusMsg.textContent = message;
}

function setProgress(fraction, label, isError = false) {
    el.progress.hidden = false;
    el.progressFill.style.width = `${Math.round(Math.min(1, Math.max(0, fraction)) * 100)}%`;
    el.progressLabel.textContent = label;
    el.progressLabel.classList.toggle('error', isError);
}

function formatBytes(bytes) {
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function buildPresetButtons() {
    for (const [key, preset] of Object.entries(PRESETS)) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = preset.label;
        button.dataset.preset = key;
        button.addEventListener('click', () => {
            state.presetKey = key;
            state.options = optionsFor(key);
            syncControls();
            refreshLivePreview();
        });
        el.presets.append(button);
    }
}

function syncControls() {
    for (const slider of sliders) {
        const value = state.options[slider.dataset.opt];
        slider.value = value;
        document.getElementById(`${slider.dataset.opt}Out`).textContent = formatValue(slider, value);
    }
    for (const button of el.presets.children) {
        button.setAttribute('aria-pressed', String(button.dataset.preset === state.presetKey));
    }
    el.seedOut.textContent = el.seed.value;
}

function formatValue(slider, value) {
    if (slider.dataset.opt === 'quality') return `${Math.round(value * 100)}%`;
    if (slider.dataset.opt === 'rotation') return `${Number(value).toFixed(2)}°`;
    return Number(value).toFixed(2);
}

function seedFor(fileIndex, pageNumber) {
    return Number(el.seed.value) * 7919 + fileIndex * 31337 + pageNumber * 104729;
}

async function scanifyOnePage(pdf, pageNumber, seed) {
    const page = await pdf.getPage(pageNumber);
    const dpi = Number(el.dpi.value);
    const viewport = page.getViewport({ scale: dpi / 72 });
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(viewport.width));
    canvas.height = Math.max(1, Math.round(viewport.height));
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    const base = page.getViewport({ scale: 1 });
    page.cleanup();
    const blob = await scanifyPage(canvas, { ...state.options }, seed);
    return { blob, widthPt: base.width, heightPt: base.height };
}

async function assemblePdf(pages) {
    const doc = await PDFLib.PDFDocument.create();
    for (const item of pages) {
        const bytes = new Uint8Array(await item.blob.arrayBuffer());
        const image = await doc.embedJpg(bytes);
        const page = doc.addPage([item.widthPt, item.heightPt]);
        page.drawImage(image, { x: 0, y: 0, width: item.widthPt, height: item.heightPt });
    }
    return new Blob([await doc.save()], { type: 'application/pdf' });
}

function triggerDownload(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
}

function clearResults() {
    for (const result of state.results) URL.revokeObjectURL(result.url);
    state.results = [];
    el.results.replaceChildren();
}

function pageLabel(pageCount) {
    return `${pageCount} page${pageCount === 1 ? '' : 's'}`;
}

function addResult(name, blob, description) {
    const url = URL.createObjectURL(blob);
    state.results.push({ name, url });

    const item = document.createElement('li');
    const left = document.createElement('div');
    const label = document.createElement('div');
    label.className = name.toLowerCase().endsWith('.zip') ? 'name archive' : 'name';
    label.textContent = name;
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = `${description} · ${formatBytes(blob.size)}`;
    left.append(label, meta);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.textContent = 'Download again';
    item.append(left, link);
    el.results.append(item);
    return url;
}

async function openDocuments(files) {
    const docs = [];
    for (const [index, file] of files.entries()) {
        setProgress(0, `Reading ${file.name} (${index + 1} of ${files.length})…`);
        await yieldToPaint();
        const data = new Uint8Array(await file.arrayBuffer());
        const pdf = await pdfjsLib.getDocument({ data }).promise;
        docs.push({ name: file.name || 'document.pdf', pdf });
    }
    return docs;
}

function releaseBatch() {
    for (const doc of state.batch) doc.pdf.destroy();
    state.batch = [];
}

async function run(docs) {
    const totalPages = docs.reduce((sum, doc) => sum + doc.pdf.numPages, 0);
    const outputs = [];
    let done = 0;

    for (const [fileIndex, doc] of docs.entries()) {
        const suffix = docs.length > 1 ? ` (file ${fileIndex + 1} of ${docs.length})` : '';
        const pages = [];
        for (let pageNumber = 1; pageNumber <= doc.pdf.numPages; pageNumber++) {
            setProgress(
                done / totalPages,
                `${doc.name} — page ${pageNumber} of ${doc.pdf.numPages}${suffix}`,
            );
            await yieldToPaint();
            pages.push(await scanifyOnePage(doc.pdf, pageNumber, seedFor(fileIndex, pageNumber)));
            done++;
        }
        setProgress(done / totalPages, `Assembling ${doc.name}${suffix}…`);
        await yieldToPaint();
        const blob = await assemblePdf(pages);
        const name = `${doc.name.replace(/\.pdf$/i, '')}-scanned.pdf`;
        outputs.push({ name, blob, pageCount: doc.pdf.numPages });
    }

    const pageWord = `${totalPages} page${totalPages === 1 ? '' : 's'}`;

    // One download only. A second programmatic download in the same batch gets
    // blocked by the browser, so several files travel together in a ZIP.
    if (outputs.length === 1) {
        const [only] = outputs;
        const url = addResult(only.name, only.blob, pageLabel(only.pageCount));
        triggerDownload(url, only.name);
        setProgress(1, `Done — 1 file, ${pageWord}. Check your downloads.`);
        return;
    }

    setProgress(1, `Packing ${outputs.length} files into a ZIP…`);
    await yieldToPaint();
    const zip = createZip(
        await Promise.all(
            outputs.map(async (output) => ({
                name: output.name,
                bytes: new Uint8Array(await output.blob.arrayBuffer()),
            })),
        ),
    );
    const zipName = `scanified-${outputs.length}-files.zip`;
    const zipUrl = addResult(zipName, zip, `${outputs.length} files · all of the below`);
    for (const output of outputs) addResult(output.name, output.blob, pageLabel(output.pageCount));
    triggerDownload(zipUrl, zipName);
    setProgress(
        1,
        `Done — ${outputs.length} files, ${pageWord}, downloaded together as ${zipName}.`,
    );
}

async function handleFiles(fileList) {
    const files = [...(fileList || [])].filter(
        (file) => file.type === 'application/pdf' || /\.pdf$/i.test(file.name),
    );
    if (!files.length) {
        setProgress(0, 'Those files are not PDFs.', true);
        return;
    }
    if (state.busy) {
        setProgress(0, 'Still working on the last batch — one moment.', true);
        return;
    }

    setBusy(true, 'Working…');
    clearResults();
    releaseBatch();
    try {
        const docs = await openDocuments(files);
        state.batch = docs;
        el.preview.disabled = false;
        el.redownload.disabled = false;
        // Any showing preview belongs to the previous batch.
        state.previewLive = false;
        el.previewBox.hidden = true;
        el.previewNote.textContent = 'Proof page 1 to try settings without downloading again.';
        await run(docs);
        setBusy(false, 'Done');
    } catch (error) {
        setProgress(0, `Something went wrong: ${error.message}`, true);
        setBusy(false, 'Error');
    }
}

async function renderPreview() {
    if (!state.batch.length || state.busy) return;
    const token = ++state.previewToken;
    const doc = state.batch[0];
    el.previewNote.textContent = 'Rendering preview…';
    try {
        const { blob } = await scanifyOnePage(doc.pdf, 1, seedFor(0, 1));
        if (token !== state.previewToken) return;
        if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
        state.previewUrl = URL.createObjectURL(blob);
        el.previewImg.src = state.previewUrl;
        el.previewBox.hidden = false;
        state.previewLive = true;
        el.previewNote.textContent = `Page 1 of ${doc.name} — updates as you change settings.`;
    } catch (error) {
        el.previewNote.textContent = `Preview failed: ${error.message}`;
    }
}

let previewTimer = null;

function refreshLivePreview() {
    if (!state.previewLive) return;
    clearTimeout(previewTimer);
    previewTimer = setTimeout(renderPreview, 220);
}

el.dropzone.addEventListener('click', () => el.file.click());
el.dropzone.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        el.file.click();
    }
});
el.file.addEventListener('change', () => {
    handleFiles(el.file.files);
    el.file.value = '';
});

// Drag anywhere on the page. dragenter/dragleave fire for every element the
// cursor crosses, so depth counting is what keeps the overlay stable.
let dragDepth = 0;

function isFileDrag(event) {
    return [...(event.dataTransfer?.types || [])].includes('Files');
}

window.addEventListener('dragenter', (event) => {
    if (!isFileDrag(event)) return;
    event.preventDefault();
    dragDepth++;
    el.overlay.hidden = false;
});
window.addEventListener('dragover', (event) => {
    if (!isFileDrag(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
});
window.addEventListener('dragleave', (event) => {
    if (!isFileDrag(event)) return;
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) el.overlay.hidden = true;
});
window.addEventListener('drop', (event) => {
    if (!isFileDrag(event)) return;
    event.preventDefault();
    dragDepth = 0;
    el.overlay.hidden = true;
    handleFiles(event.dataTransfer.files);
});

for (const slider of sliders) {
    slider.addEventListener('input', () => {
        state.options[slider.dataset.opt] = Number(slider.value);
        document.getElementById(`${slider.dataset.opt}Out`).textContent =
            formatValue(slider, slider.value);
        state.presetKey = '';
        for (const button of el.presets.children) button.setAttribute('aria-pressed', 'false');
        refreshLivePreview();
    });
}

el.dpi.addEventListener('change', refreshLivePreview);
el.seed.addEventListener('input', () => {
    el.seedOut.textContent = el.seed.value;
    refreshLivePreview();
});
el.reroll.addEventListener('click', () => {
    el.seed.value = String(1 + Math.floor(Math.random() * 9999));
    el.seedOut.textContent = el.seed.value;
    refreshLivePreview();
});
el.preview.addEventListener('click', renderPreview);
el.redownload.addEventListener('click', async () => {
    if (!state.batch.length || state.busy) return;
    setBusy(true, 'Working…');
    clearResults();
    try {
        await run(state.batch);
        setBusy(false, 'Done');
    } catch (error) {
        setProgress(0, `Something went wrong: ${error.message}`, true);
        setBusy(false, 'Error');
    }
});

buildPresetButtons();
syncControls();
