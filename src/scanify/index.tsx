import { Link } from "@zoontek/chicane";
import { PDFDocument } from "pdf-lib";
import { GlobalWorkerOptions, getDocument, type PDFDocumentProxy } from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";

import { Router } from "../router";
import { PRESETS, scanifyPage, type PresetKey, type ScanOptions } from "./scanify";
import { createZip } from "./zip";

GlobalWorkerOptions.workerSrc = pdfWorker;

type OpenDocument = {
  name: string;
  pdf: PDFDocumentProxy;
};

type ScannedPage = {
  blob: Blob;
  widthPt: number;
  heightPt: number;
};

type Output = {
  name: string;
  blob: Blob;
  pageCount: number;
};

type Result = {
  name: string;
  url: string;
  description: string;
  size: number;
};

type Progress = {
  fraction: number;
  label: string;
  error?: boolean;
} | null;

type Control = {
  key: keyof ScanOptions;
  label: string;
  min: number;
  max: number;
  step: number;
};

const CONTROLS: Control[] = [
  { key: "rotation", label: "Skew", min: 0, max: 3, step: 0.05 },
  { key: "inkSpread", label: "Ink spread", min: 0, max: 1, step: 0.02 },
  { key: "blur", label: "Softness", min: 0, max: 2, step: 0.05 },
  { key: "lighting", label: "Uneven light", min: 0, max: 1.5, step: 0.05 },
  { key: "noise", label: "Grain", min: 0, max: 0.2, step: 0.005 },
  { key: "contrast", label: "Contrast", min: 0, max: 1, step: 0.02 },
  { key: "warmth", label: "Paper warmth", min: 0, max: 1, step: 0.05 },
  { key: "specks", label: "Dust & lint", min: 0, max: 1.5, step: 0.05 },
  { key: "jitter", label: "Feed wobble", min: 0, max: 1.5, step: 0.05 },
  {
    key: "edgeShadow",
    label: "Page edge shadow",
    min: 0,
    max: 1.5,
    step: 0.05,
  },
  { key: "quality", label: "JPEG quality", min: 0.2, max: 1, step: 0.02 },
];

const BUTTON =
  "border border-[#625e54] bg-[#cdc8bb] px-3 py-1.5 font-mono text-sm text-[#1b1915] shadow-[inset_1px_1px_0_#fff,inset_-1px_-1px_0_#625e54] enabled:active:shadow-[inset_1px_1px_0_#625e54] disabled:cursor-not-allowed disabled:opacity-50";

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatValue(key: keyof ScanOptions, value: number): string {
  if (key === "quality") return `${Math.round(value * 100)}%`;
  if (key === "rotation") return `${value.toFixed(2)}°`;
  return value.toFixed(2);
}

function triggerDownload(url: string, filename: string): void {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function seedFor(seed: number, fileIndex: number, pageNumber: number): number {
  return seed * 7919 + fileIndex * 31337 + pageNumber * 104729;
}

async function openDocuments(files: File[]): Promise<OpenDocument[]> {
  const documents: OpenDocument[] = [];
  for (const file of files) {
    const data = new Uint8Array(await file.arrayBuffer());
    documents.push({
      name: file.name || "document.pdf",
      pdf: await getDocument({ data }).promise,
    });
  }
  return documents;
}

async function scanPage(
  pdf: PDFDocumentProxy,
  pageNumber: number,
  dpi: number,
  options: ScanOptions,
  seed: number,
): Promise<ScannedPage> {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale: dpi / 72 });
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(viewport.width));
  canvas.height = Math.max(1, Math.round(viewport.height));
  const context = canvas.getContext("2d");
  if (context === null) throw new Error("Canvas is unavailable");
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: context, viewport }).promise;
  const base = page.getViewport({ scale: 1 });
  page.cleanup();
  return {
    blob: await scanifyPage(canvas, options, seed),
    widthPt: base.width,
    heightPt: base.height,
  };
}

async function assemblePdf(pages: ScannedPage[]): Promise<Blob> {
  const document = await PDFDocument.create();
  for (const item of pages) {
    const image = await document.embedJpg(await item.blob.arrayBuffer());
    const page = document.addPage([item.widthPt, item.heightPt]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: item.widthPt,
      height: item.heightPt,
    });
  }
  const bytes = await document.save();
  return new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
}

function ResultList({ results }: { results: Result[] }) {
  return (
    <ul className="mt-4 space-y-2">
      {results.map((result) => (
        <li
          className="flex items-center justify-between gap-4 border border-[#918c80] bg-[#e8e4da] p-3 text-sm"
          key={`${result.name}-${result.url}`}
        >
          <div>
            <strong className="block font-mono">{result.name}</strong>
            <span className="text-xs text-[#625e54]">
              {result.description} · {formatBytes(result.size)}
            </span>
          </div>
          <a
            className="font-mono text-[#000e5a] underline"
            href={result.url}
            download={result.name}
          >
            Download again
          </a>
        </li>
      ))}
    </ul>
  );
}

export default function ScanifyPage() {
  const [options, setOptions] = useState<ScanOptions>(() => ({
    ...PRESETS.light,
  }));
  const [preset, setPreset] = useState<PresetKey | null>("light");
  const [dpi, setDpi] = useState(150);
  const [seed, setSeed] = useState(1234);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<Progress>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLive, setPreviewLive] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [hasDocuments, setHasDocuments] = useState(false);
  const batchRef = useRef<OpenDocument[]>([]);
  const resultUrlsRef = useRef<string[]>([]);
  const previewUrlRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = "SCANIFY.EXE — Print & Scan Simulator";
  }, []);

  const clearResults = useCallback(() => {
    for (const url of resultUrlsRef.current) URL.revokeObjectURL(url);
    resultUrlsRef.current = [];
    setResults([]);
  }, []);

  useEffect(() => {
    return () => {
      for (const document of batchRef.current) {
        void document.pdf.destroy();
      }
      for (const url of resultUrlsRef.current) URL.revokeObjectURL(url);
      if (previewUrlRef.current !== null) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const publishResult = (name: string, blob: Blob, description: string): string => {
    const url = URL.createObjectURL(blob);
    resultUrlsRef.current.push(url);
    setResults((current) => [...current, { name, url, description, size: blob.size }]);
    return url;
  };

  const run = async (documents: OpenDocument[]) => {
    const totalPages = documents.reduce((sum, document) => sum + document.pdf.numPages, 0);
    const outputs: Output[] = [];
    let completed = 0;

    for (const [fileIndex, document] of documents.entries()) {
      const pages: ScannedPage[] = [];
      for (let pageNumber = 1; pageNumber <= document.pdf.numPages; pageNumber += 1) {
        setProgress({
          fraction: completed / totalPages,
          label: `${document.name} — page ${pageNumber} of ${document.pdf.numPages}`,
        });
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            resolve();
          });
        });
        pages.push(
          await scanPage(
            document.pdf,
            pageNumber,
            dpi,
            options,
            seedFor(seed, fileIndex, pageNumber),
          ),
        );
        completed += 1;
      }
      setProgress({
        fraction: completed / totalPages,
        label: `Assembling ${document.name}…`,
      });
      const blob = await assemblePdf(pages);
      outputs.push({
        name: `${document.name.replace(/\.pdf$/i, "")}-scanned.pdf`,
        blob,
        pageCount: document.pdf.numPages,
      });
    }

    if (outputs.length === 1) {
      const output = outputs[0];
      if (output === undefined) return;
      const url = publishResult(
        output.name,
        output.blob,
        `${output.pageCount} page${output.pageCount === 1 ? "" : "s"}`,
      );
      triggerDownload(url, output.name);
    } else {
      const zip = createZip(
        await Promise.all(
          outputs.map(async (output) => ({
            name: output.name,
            bytes: new Uint8Array(await output.blob.arrayBuffer()),
          })),
        ),
      );
      const zipName = `scanified-${outputs.length}-files.zip`;
      const url = publishResult(zipName, zip, `${outputs.length} files`);
      for (const output of outputs) {
        publishResult(
          output.name,
          output.blob,
          `${output.pageCount} page${output.pageCount === 1 ? "" : "s"}`,
        );
      }
      triggerDownload(url, zipName);
    }
    setProgress({
      fraction: 1,
      label: `Done — ${outputs.length} file${outputs.length === 1 ? "" : "s"}, ${totalPages} page${totalPages === 1 ? "" : "s"}.`,
    });
  };

  const handleFiles = async (incoming: FileList | File[]) => {
    const files = Array.from(incoming).filter(
      (file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"),
    );
    if (files.length === 0) {
      setProgress({
        fraction: 0,
        label: "Those files are not PDFs.",
        error: true,
      });
      return;
    }
    if (busy) return;

    setBusy(true);
    clearResults();
    setPreviewLive(false);
    if (previewUrl !== null) {
      URL.revokeObjectURL(previewUrl);
      previewUrlRef.current = null;
      setPreviewUrl(null);
    }
    for (const document of batchRef.current) {
      void document.pdf.destroy();
    }
    setHasDocuments(false);
    try {
      setProgress({ fraction: 0, label: "Reading PDFs…" });
      const documents = await openDocuments(files);
      batchRef.current = documents;
      setHasDocuments(true);
      await run(documents);
    } catch (error: unknown) {
      setProgress({
        fraction: 0,
        label:
          error instanceof Error
            ? `Something went wrong: ${error.message}`
            : "Something went wrong.",
        error: true,
      });
    } finally {
      setBusy(false);
    }
  };

  const renderPreview = useCallback(async () => {
    const first = batchRef.current[0];
    if (first === undefined || busy) return;
    try {
      const page = await scanPage(first.pdf, 1, dpi, options, seedFor(seed, 0, 1));
      if (previewUrl !== null) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(page.blob);
      previewUrlRef.current = url;
      setPreviewUrl(url);
      setPreviewLive(true);
    } catch (error: unknown) {
      setProgress({
        fraction: 0,
        label: error instanceof Error ? `Preview failed: ${error.message}` : "Preview failed.",
        error: true,
      });
    }
  }, [busy, dpi, options, previewUrl, seed]);

  useEffect(() => {
    if (!previewLive) return;
    const timer = window.setTimeout(() => {
      void renderPreview();
    }, 220);
    return () => {
      window.clearTimeout(timer);
    };
  }, [options, dpi, seed, previewLive, renderPreview]);

  const onDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setDragging(false);
    void handleFiles(event.dataTransfer.files);
  };

  const chooseFiles = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.currentTarget.files !== null) {
      void handleFiles(event.currentTarget.files);
    }
    event.currentTarget.value = "";
  };

  return (
    <main
      className="min-h-screen bg-[radial-gradient(1100px_460px_at_50%_-12%,rgba(255,241,206,0.2),transparent_70%),linear-gradient(180deg,#10404a_0%,#0c2b32_46%,#071619_100%)] px-4 py-7 font-[Tahoma,'MS_Sans_Serif',sans-serif] text-[#1b1915]"
      onDragEnter={(event) => {
        if (event.dataTransfer.types.includes("Files")) setDragging(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
      }}
      onDragLeave={(event) => {
        if (event.currentTarget === event.target) setDragging(false);
      }}
      onDrop={onDrop}
    >
      {dragging && (
        <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center bg-[#000e5a]/80 font-mono text-4xl font-bold text-white">
          DROP TO SCAN
        </div>
      )}

      <div className="mx-auto max-w-190 bg-[#cdc8bb] p-1 shadow-[0_26px_70px_rgba(0,0,0,0.6),inset_1px_1px_0_#fff,inset_-1px_-1px_0_#625e54]">
        <header className="flex items-center gap-2 bg-linear-to-r from-[#000e5a] to-[#1a72b8] px-2 py-1 font-bold text-white">
          <span aria-hidden="true">🖨️</span>
          <span className="flex-1 text-sm">SCANIFY.EXE — Print & Scan Simulator</span>
          <span className="font-mono" aria-hidden="true">
            _ □
          </span>
          <Link
            className="grid size-6 place-items-center font-mono text-white no-underline hover:bg-[#c42b1c]"
            to={Router.Home()}
            aria-label="Close Scanify and return home"
          >
            ✕
          </Link>
        </header>

        <div className="p-4 sm:p-5">
          <section className="grid items-center gap-5 sm:grid-cols-[220px_1fr]">
            <img
              className="mx-auto w-55 max-w-full"
              src="/scanify/scanner.gif"
              width="320"
              height="200"
              alt="A flatbed scanner with its lid open and a green lamp sweeping across a page"
            />
            <div>
              <h1 className="font-mono text-2xl font-bold">
                Make a PDF look like it was printed and scanned.
              </h1>
              <p className="mt-3 text-sm leading-6 text-[#4a463d]">
                PDFs are processed entirely in your browser and saved straight to downloads. Nothing
                is uploaded.
              </p>
            </div>
          </section>

          <button
            className="mt-5 w-full border-2 border-dashed border-[#625e54] bg-[#e8e4da] p-7 text-center font-mono shadow-[inset_1px_1px_0_#625e54,inset_-1px_-1px_0_#fff] hover:bg-[#f2efe6]"
            type="button"
            onClick={() => {
              fileInputRef.current?.click();
            }}
          >
            <strong className="block text-lg">DROP PDFs ANYWHERE</strong>
            <span className="text-xs">or click to browse — multiple files welcome</span>
          </button>
          <input
            ref={fileInputRef}
            id="file"
            className="hidden"
            type="file"
            accept="application/pdf"
            multiple
            onChange={chooseFiles}
          />

          {progress !== null && (
            <section className="mt-4">
              <div className="h-4 border border-[#625e54] bg-[#a9a49a] p-0.5 shadow-inner">
                <div
                  className={progress.error ? "h-full bg-red-700" : "h-full bg-[#000e5a]"}
                  style={{
                    width: `${Math.round(Math.min(1, Math.max(0, progress.fraction)) * 100)}%`,
                  }}
                />
              </div>
              <p
                id="progressLabel"
                className={
                  progress.error ? "mt-1 font-mono text-xs text-red-800" : "mt-1 font-mono text-xs"
                }
              >
                {progress.label}
              </p>
            </section>
          )}

          <ResultList results={results} />

          <fieldset className="mt-5 border-2 border-[#918c80] p-4">
            <legend className="px-2 font-mono font-bold">Before / After</legend>
            <div className="compare grid grid-cols-2 gap-3">
              {[
                ["before", "BEFORE — original PDF"],
                ["after", 'AFTER — "Office scanner"'],
              ].map(([name, caption]) => (
                <figure key={name}>
                  <a
                    href={`/scanify/example-${name}.jpg`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      className="aspect-[1000/1294] w-full border border-[#625e54] object-cover"
                      src={`/scanify/example-${name}.jpg`}
                      alt={caption}
                    />
                  </a>
                  <figcaption className="mt-1 text-center font-mono text-[10px]">
                    {caption}
                  </figcaption>
                </figure>
              ))}
            </div>
          </fieldset>

          <details className="mt-5 border-2 border-[#918c80] bg-[#d8d3c7]">
            <summary className="cursor-pointer p-3 font-mono font-bold">Advanced settings</summary>
            <div className="border-t border-[#918c80] p-4">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(PRESETS) as PresetKey[]).map((key) => (
                  <button
                    className={preset === key ? `${BUTTON} bg-[#000e5a] text-white` : BUTTON}
                    key={key}
                    type="button"
                    onClick={() => {
                      setPreset(key);
                      setOptions({ ...PRESETS[key] });
                    }}
                  >
                    {PRESETS[key].label}
                  </button>
                ))}
              </div>

              <div className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">
                {CONTROLS.map((control) => (
                  <label className="block text-sm" key={control.key}>
                    <span className="mb-1 flex justify-between">
                      {control.label}
                      <output className="font-mono">
                        {formatValue(control.key, options[control.key])}
                      </output>
                    </span>
                    <input
                      className="w-full accent-[#000e5a]"
                      type="range"
                      min={control.min}
                      max={control.max}
                      step={control.step}
                      value={options[control.key]}
                      onChange={(event) => {
                        const value = Number(event.currentTarget.value);
                        setPreset(null);
                        setOptions((current) => ({
                          ...current,
                          [control.key]: value,
                        }));
                      }}
                    />
                  </label>
                ))}
                <label className="block text-sm">
                  <span className="mb-1 block">Resolution</span>
                  <select
                    className="w-full border border-[#625e54] bg-white p-1.5 font-mono"
                    value={dpi}
                    onChange={(event) => {
                      setDpi(Number(event.currentTarget.value));
                    }}
                  >
                    <option value={120}>120 DPI — fast</option>
                    <option value={150}>150 DPI — typical scan</option>
                    <option value={200}>200 DPI — sharp</option>
                    <option value={300}>300 DPI — slow, large files</option>
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="mb-1 flex justify-between">
                    Seed <output className="font-mono">{seed}</output>
                  </span>
                  <input
                    className="w-full accent-[#000e5a]"
                    type="range"
                    min={1}
                    max={9999}
                    step={1}
                    value={seed}
                    onChange={(event) => {
                      setSeed(Number(event.currentTarget.value));
                    }}
                  />
                </label>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className={BUTTON}
                  type="button"
                  onClick={() => {
                    setSeed(1 + Math.floor(Math.random() * 9999));
                  }}
                >
                  Reroll
                </button>
                <button
                  className={BUTTON}
                  type="button"
                  disabled={!hasDocuments || busy}
                  onClick={() => {
                    void renderPreview();
                  }}
                >
                  Preview page 1
                </button>
                <button
                  className={BUTTON}
                  type="button"
                  disabled={!hasDocuments || busy}
                  onClick={() => {
                    clearResults();
                    setBusy(true);
                    void run(batchRef.current).finally(() => {
                      setBusy(false);
                    });
                  }}
                >
                  Re-run last batch
                </button>
              </div>

              <figure
                className="preview-box mt-4 border border-[#625e54] bg-[#a9a49a] p-3"
                hidden={previewUrl === null}
              >
                {previewUrl !== null && (
                  <img
                    className="mx-auto max-h-[70vh] max-w-full"
                    src={previewUrl}
                    alt="Proof of page 1 with the current settings"
                  />
                )}
              </figure>
            </div>
          </details>
        </div>

        <footer className="flex flex-wrap justify-between gap-2 border-t border-[#625e54] bg-[#a9a49a] px-3 py-1 font-mono text-[10px]">
          <span>{busy ? "● Working…" : "● Ready"}</span>
          <span>100% in-browser</span>
          <span>No upload</span>
        </footer>
      </div>

      <p className="mt-5 text-center font-mono text-xs text-white">
        <Link className="underline" to={Router.Home()}>
          &lt;&lt; obermillers.com
        </Link>
      </p>
    </main>
  );
}
