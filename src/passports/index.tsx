import { Link } from "@zoontek/chicane";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type PointerEvent,
} from "react";
import {
  applySquareCrop,
  cropImage,
  type CropRect,
} from "./cropImage";
import { removeBackgroundImage } from "./removeBackgroundImage";
import { resizeImage } from "./resizeImage";
import { Router } from "../router";

const MAX_IMAGES = 6;
const PREVIEW_SIZE = 240;
// Long enough to absorb rapid zoom clicks, short enough to feel immediate
// against a background-removal pass that takes seconds.
const COMMIT_DELAY_MS = 150;
const OUTPUT_SIZE = 600;
const FACE_SCRIPTS = [
  "/passports/js/face-detection/objectdetect.js",
  "/passports/js/face-detection/objectdetect.frontalface.js",
  "/passports/js/face-detection/tracking-min.js",
  "/passports/js/face-detection/eye-min.js",
] as const;

type Settings = {
  cropping: boolean;
  backgroundRemoval: boolean;
  debug: boolean;
};

// The live crop rect is deliberately not stored here. Dragging must update the
// preview every frame, while regenerating `image` costs a background-removal
// pass, so the two are tracked separately and only reconciled on commit.
type ProcessedPhoto = {
  image: HTMLImageElement;
  sourceImage?: HTMLImageElement;
  initialCropRect?: CropRect;
  faceDetected: boolean;
  imageScaledUp: boolean;
};

type Status = {
  kind: "info" | "success" | "error";
  message: string;
} | null;

let faceScriptsPromise: Promise<void> | undefined;

function loadFaceScripts(): Promise<void> {
  faceScriptsPromise ??= Promise.all(
    FACE_SCRIPTS.map(
      (source) =>
        new Promise<void>((resolve, reject) => {
          const existing = document.querySelector<HTMLScriptElement>(
            `script[data-passport-source="${source}"]`,
          );
          if (existing?.dataset.loaded === "true") {
            resolve();
            return;
          }

          const script = existing ?? document.createElement("script");
          script.src = source;
          script.dataset.passportSource = source;
          script.addEventListener(
            "load",
            () => {
              script.dataset.loaded = "true";
              resolve();
            },
            { once: true },
          );
          script.addEventListener(
            "error",
            () => {
              reject(new Error(`Failed to load ${source}`));
            },
            { once: true },
          );
          if (existing === null) document.head.appendChild(script);
        }),
    ),
  ).then(() => undefined);
  return faceScriptsPromise;
}

function loadSettings(): Settings {
  const read = (key: string, fallback: boolean) => {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value === "true";
  };
  return {
    cropping: read("passportPhoto_enableCropping", true),
    backgroundRemoval: read("passportPhoto_enableBackgroundRemoval", true),
    debug: read("passportPhoto_enableDebugMode", false),
  };
}

function saveSettings(settings: Settings): void {
  localStorage.setItem(
    "passportPhoto_enableCropping",
    String(settings.cropping),
  );
  localStorage.setItem(
    "passportPhoto_enableBackgroundRemoval",
    String(settings.backgroundRemoval),
  );
  localStorage.setItem("passportPhoto_enableDebugMode", String(settings.debug));
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Could not read ${file.name}`));
    };
    image.src = url;
  });
}

async function processPhoto(
  file: File,
  settings: Settings,
  onProgress: (message: string) => void,
): Promise<ProcessedPhoto> {
  const original = await loadImage(file);
  let image: HTMLImageElement;
  let result: ProcessedPhoto;

  if (settings.cropping) {
    const cropped = await cropImage(original, settings.debug);
    image = cropped.image;
    result = {
      image,
      sourceImage: cropped.sourceImage,
      initialCropRect:
        cropped.cropRect === undefined ? undefined : { ...cropped.cropRect },
      faceDetected: cropped.faceDetected,
      imageScaledUp: cropped.imageScaledUp,
    };
  } else {
    image = await resizeImage(original, OUTPUT_SIZE, OUTPUT_SIZE);
    result = {
      image,
      faceDetected: true,
      imageScaledUp: false,
    };
  }

  if (settings.backgroundRemoval) {
    result.image = await removeBackgroundImage(
      result.image,
      (step, current, total) => {
        onProgress(`${step} (${current}/${total})`);
      },
    );
  }
  return result;
}

function drawSheet(
  canvas: HTMLCanvasElement,
  photos: ProcessedPhoto[],
): void {
  canvas.width = 1200;
  canvas.height = 1800;
  const context = canvas.getContext("2d");
  if (context === null) return;

  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  if (photos.length === 0) return;

  for (let index = 0; index < 6; index += 1) {
    const photo = photos[index % photos.length];
    if (photo === undefined) continue;
    const x = (index % 2) * OUTPUT_SIZE;
    const y = Math.floor(index / 2) * OUTPUT_SIZE;
    context.drawImage(photo.image, x, y, OUTPUT_SIZE, OUTPUT_SIZE);
  }

  context.strokeStyle = "#ccc";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(OUTPUT_SIZE, 0);
  context.lineTo(OUTPUT_SIZE, canvas.height);
  context.stroke();
  for (const y of [OUTPUT_SIZE, OUTPUT_SIZE * 2]) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(canvas.width, y);
    context.stroke();
  }
}

function clampCrop(source: HTMLImageElement, crop: CropRect): CropRect {
  const maxSize = Math.min(source.width, source.height);
  const minSize = Math.max(32, maxSize * 0.04);
  const size = Math.max(minSize, Math.min(crop.size, maxSize));
  return {
    size,
    x: Math.max(0, Math.min(crop.x, source.width - size)),
    y: Math.max(0, Math.min(crop.y, source.height - size)),
  };
}

function CropEditor({
  index,
  photo,
  crop,
  onCropChange,
  onCommit,
}: {
  index: number;
  photo: ProcessedPhoto;
  crop: CropRect | undefined;
  onCropChange: (crop: CropRect) => void;
  onCommit: (crop: CropRect) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const source = photo.sourceImage;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null || source === undefined || crop === undefined) return;
    const context = canvas.getContext("2d");
    if (context === null) return;
    context.fillStyle = "#fff";
    context.fillRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
    context.drawImage(
      source,
      crop.x,
      crop.y,
      crop.size,
      crop.size,
      0,
      0,
      PREVIEW_SIZE,
      PREVIEW_SIZE,
    );
  }, [crop, source]);

  if (source === undefined || crop === undefined) return null;

  const zoom = (factor: number) => {
    const centerX = crop.x + crop.size / 2;
    const centerY = crop.y + crop.size / 2;
    const size = crop.size * factor;
    const next = clampCrop(source, {
      x: centerX - size / 2,
      y: centerY - size / 2,
      size,
    });
    onCropChange(next);
    onCommit(next);
  };

  const move = (event: PointerEvent<HTMLCanvasElement>) => {
    const previous = dragRef.current;
    if (previous === null) return;
    const scale = crop.size / PREVIEW_SIZE;
    dragRef.current = { x: event.clientX, y: event.clientY };
    onCropChange(
      clampCrop(source, {
        ...crop,
        x: crop.x - (event.clientX - previous.x) * scale,
        y: crop.y - (event.clientY - previous.y) * scale,
      }),
    );
  };

  const endDrag = () => {
    if (dragRef.current === null) return;
    dragRef.current = null;
    onCommit(crop);
  };

  return (
    <article className="rounded-lg border border-violet-200 bg-violet-50 p-4">
      <h3 className="mb-3 font-semibold text-slate-800">
        Photo {index + 1} — adjust crop
      </h3>
      <canvas
        ref={canvasRef}
        width={PREVIEW_SIZE}
        height={PREVIEW_SIZE}
        className="mx-auto aspect-square w-full max-w-60 cursor-move touch-none rounded-md border border-slate-300 bg-white"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          dragRef.current = { x: event.clientX, y: event.clientY };
        }}
        onPointerMove={move}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      />
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <button className="rounded-md border border-violet-300 bg-white px-3 py-1.5 text-sm text-violet-800 hover:bg-violet-100" type="button" onClick={() => { zoom(1 / 1.04); }}>
          Zoom in
        </button>
        <button className="rounded-md border border-violet-300 bg-white px-3 py-1.5 text-sm text-violet-800 hover:bg-violet-100" type="button" onClick={() => { zoom(1.04); }}>
          Zoom out
        </button>
        <button
          className="rounded-md border border-violet-300 bg-white px-3 py-1.5 text-sm text-violet-800 hover:bg-violet-100"
          type="button"
          onClick={() => {
            if (photo.initialCropRect === undefined) return;
            const next = clampCrop(source, { ...photo.initialCropRect });
            onCropChange(next);
            onCommit(next);
          }}
        >
          Reset
        </button>
      </div>
      <p className="mt-2 text-center text-xs text-slate-500">
        Drag the photo to reposition
      </p>
    </article>
  );
}

export default function PassportPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [photos, setPhotos] = useState<ProcessedPhoto[]>([]);
  const [cropRects, setCropRects] = useState<(CropRect | undefined)[]>([]);
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [status, setStatus] = useState<Status>(null);
  const [processing, setProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const commitTimers = useRef(new Map<number, number>());
  const commitTokens = useRef(new Map<number, number>());

  useEffect(() => {
    document.title = "Passport Photo Tiler";
  }, []);

  useEffect(() => {
    const timers = commitTimers.current;
    return () => {
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
    };
  }, []);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    let cancelled = false;
    if (files.length === 0) {
      return;
    }

    void loadFaceScripts()
      .then(async () => {
        if (cancelled) return;
        setProcessing(true);
        setStatus({ kind: "info", message: "Loading photo tools…" });
        const next: ProcessedPhoto[] = [];
        for (const [index, file] of files.entries()) {
          if (cancelled) return;
          setStatus({
            kind: "info",
            message: `Processing image ${index + 1} of ${files.length}…`,
          });
          next.push(
            await processPhoto(file, settings, (message) => {
              if (!cancelled) {
                setStatus({
                  kind: "info",
                  message: `Image ${index + 1}: ${message}`,
                });
              }
            }),
          );
        }
        if (cancelled) return;
        setPhotos(next);
        setCropRects(
          next.map((photo) =>
            photo.initialCropRect === undefined
              ? undefined
              : { ...photo.initialCropRect },
          ),
        );
        setStatus({
          kind: next.some((photo) => !photo.faceDetected) ? "info" : "success",
          message: next.some((photo) => !photo.faceDetected)
            ? "Ready. A center crop was used where no face was detected."
            : "Ready to download.",
        });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setStatus({
          kind: "error",
          message: error instanceof Error ? error.message : "Processing failed",
        });
      })
      .finally(() => {
        if (!cancelled) setProcessing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [files, settings]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas !== null) drawSheet(canvas, photos);
  }, [photos]);

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const images = Array.from(incoming).filter((file) =>
      file.type.startsWith("image/"),
    );
    if (images.length === 0) {
      setStatus({ kind: "error", message: "Choose one or more image files." });
      return;
    }
    setPhotos([]);
    setCropRects([]);
    setFiles((current) => [...current, ...images].slice(0, MAX_IMAGES));
  }, []);

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.currentTarget.files !== null) addFiles(event.currentTarget.files);
    event.currentTarget.value = "";
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    addFiles(event.dataTransfer.files);
  };

  // Cheap: repaints the crop preview on the next render, every drag frame.
  const changeCrop = (index: number, crop: CropRect) => {
    setCropRects((current) =>
      current.map((entry, entryIndex) => (entryIndex === index ? crop : entry)),
    );
  };

  // Expensive: re-crops and re-runs background removal, then refreshes the
  // sheet. Only ever reached once an interaction has settled.
  const commitCrop = async (index: number, crop: CropRect) => {
    const source = photos[index]?.sourceImage;
    if (source === undefined) return;

    const token = (commitTokens.current.get(index) ?? 0) + 1;
    commitTokens.current.set(index, token);
    const isCurrent = () => commitTokens.current.get(index) === token;

    setStatus({ kind: "info", message: `Updating photo ${index + 1}…` });
    try {
      const cropped = await applySquareCrop(source, crop, {
        debugMode: settings.debug,
      });
      const image = settings.backgroundRemoval
        ? await removeBackgroundImage(cropped)
        : cropped;
      // A newer crop was committed while we were working; discard this result.
      if (!isCurrent()) return;
      setPhotos((current) =>
        current.map((entry, entryIndex) =>
          entryIndex === index ? { ...entry, image } : entry,
        ),
      );
      setStatus({ kind: "success", message: "Crop updated — sheet refreshed." });
    } catch (error: unknown) {
      if (!isCurrent()) return;
      setStatus({
        kind: "error",
        message:
          error instanceof Error ? error.message : "Failed to update crop",
      });
    }
  };

  // Coalesces a burst of zoom clicks, and the drag-end commit, into one pass.
  const scheduleCommit = (index: number, crop: CropRect) => {
    const pending = commitTimers.current.get(index);
    if (pending !== undefined) clearTimeout(pending);
    commitTimers.current.set(
      index,
      window.setTimeout(() => {
        commitTimers.current.delete(index);
        void commitCrop(index, crop);
      }, COMMIT_DELAY_MS),
    );
  };

  const download = () => {
    canvasRef.current?.toBlob(
      (blob) => {
        if (blob === null) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "passport-photos-4x6.jpg";
        link.click();
        URL.revokeObjectURL(url);
      },
      "image/jpeg",
      0.9,
    );
  };

  const setting = (key: keyof Settings, label: string) => (
    <label className="flex items-start gap-2 text-sm text-slate-700">
      <input
        className="mt-0.5 size-4 accent-violet-600"
        type="checkbox"
        checked={settings[key]}
        onChange={(event) => {
          setSettings((current) => ({
            ...current,
            [key]: event.currentTarget.checked,
          }));
        }}
      />
      {label}
    </label>
  );

  return (
    <main className="min-h-screen bg-linear-to-br from-[#667eea] to-[#764ba2] p-5 font-sans">
      <div className="mx-auto max-w-225 rounded-xl bg-white/95 p-6 shadow-2xl sm:p-8">
        <Link
          className="text-sm font-medium text-violet-700 hover:underline"
          to={Router.Home()}
        >
          ← Back to Home
        </Link>
        <h1 className="mt-4 text-center text-3xl font-bold text-slate-800">
          Passport Photo Tiler
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-center text-slate-600">
          Add up to six photos. Each change updates a print-ready 4″ × 6″ sheet
          of 2″ × 2″ passport photos.
        </p>

        <section className="mt-7 rounded-xl border border-violet-200 bg-violet-50/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold text-slate-800">
              Photos{" "}
              <span className="font-normal text-slate-500">
                {files.length} / {MAX_IMAGES}
              </span>
            </h2>
            <button
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 enabled:hover:bg-slate-50 disabled:opacity-40"
              type="button"
              disabled={files.length === 0 || processing}
              onClick={() => {
                setFiles([]);
                setPhotos([]);
                setCropRects([]);
                setStatus(null);
              }}
            >
              Clear all
            </button>
          </div>

          {files.length > 0 && (
            <ul className="mt-3 space-y-2">
              {files.map((file, index) => (
                <li
                  className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2 text-sm text-slate-700"
                  key={`${file.name}-${file.size}-${file.lastModified}`}
                >
                  <span className="truncate">
                    {index + 1}. {file.name}
                  </span>
                  <button
                    className="text-violet-700 hover:underline disabled:opacity-40"
                    type="button"
                    disabled={processing}
                    onClick={() => {
                      const next = files.filter(
                        (_, fileIndex) => fileIndex !== index,
                      );
                      setFiles(next);
                      if (next.length === 0) {
                        setPhotos([]);
                        setCropRects([]);
                        setStatus(null);
                      }
                    }}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div
            className="mt-4 cursor-pointer rounded-lg border-2 border-dashed border-violet-300 bg-white p-6 text-center text-slate-600 transition hover:border-violet-500 hover:bg-violet-50"
            role="button"
            tabIndex={0}
            onClick={() => {
              fileInputRef.current?.click();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDragOver={(event) => {
              event.preventDefault();
            }}
            onDrop={onDrop}
          >
            <strong className="block text-slate-800">
              {files.length === 0 ? "Add a photo" : "Add another photo"}
            </strong>
            <span className="text-sm">Drop images here, or click to browse</span>
          </div>
          <input
            ref={fileInputRef}
            className="hidden"
            type="file"
            accept="image/*"
            multiple
            onChange={onFileChange}
          />
        </section>

        <details className="mt-4 rounded-lg border border-slate-200 p-4">
          <summary className="cursor-pointer font-medium text-slate-800">
            Processing options
          </summary>
          <div className="mt-4 space-y-3">
            {setting("cropping", 'Crop to passport size (2" × 2")')}
            {setting("backgroundRemoval", "Remove background")}
            {setting("debug", "Debug mode (show face detection box)")}
            <p className="text-xs text-slate-500">
              If background removal struggles, remove the background first with
              your device’s built-in photo tools.
            </p>
          </div>
        </details>

        {status !== null && (
          <p
            aria-live="polite"
            className={
              status.kind === "error"
                ? "mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
                : status.kind === "success"
                  ? "mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700"
                  : "mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700"
            }
          >
            {status.message}
          </p>
        )}

        {photos.some(
          (photo, index) =>
            photo.sourceImage !== undefined && cropRects[index] !== undefined,
        ) && (
          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo, index) => (
              <CropEditor
                index={index}
                photo={photo}
                crop={cropRects[index]}
                key={files[index]?.name ?? index}
                onCropChange={(crop) => {
                  changeCrop(index, crop);
                }}
                onCommit={(crop) => {
                  scheduleCommit(index, crop);
                }}
              />
            ))}
          </section>
        )}

        <section className={photos.length === 0 ? "hidden" : "mt-7 text-center"}>
          <canvas
            ref={canvasRef}
            className="mx-auto max-h-[70vh] max-w-full rounded-lg border border-slate-200 shadow-lg"
          />
          <button
            className="mt-5 rounded-lg bg-violet-600 px-5 py-3 font-semibold text-white shadow hover:bg-violet-700"
            type="button"
            onClick={download}
          >
            Download Passport Photos
          </button>
        </section>
      </div>
      <footer className="mx-auto mt-5 max-w-225 text-center text-xs text-white/80">
        Face and eye detection uses code adapted from the U.S. State Department
        passport photo tool.
      </footer>
    </main>
  );
}
