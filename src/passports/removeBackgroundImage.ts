/**
 * Background removal handler module
 * Wraps @imgly/background-removal with image processing utilities
 * @module removeBackgroundImage
 */

import { removeBackground, type Config } from "@imgly/background-removal";

import type { ProgressCallback } from "./types";

/**
 * Check if WebGPU is available
 */
async function checkWebGPUSupport(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.gpu) {
    return false;
  }
  try {
    const adapter = await navigator.gpu.requestAdapter();
    return adapter !== null;
  } catch {
    return false;
  }
}

/**
 * Remove background from an image
 * @param img - Source image
 * @param progressCallback - Optional progress callback (step, current, total)
 * @returns Image with background removed (white background)
 */
export async function removeBackgroundImage(
  img: HTMLImageElement,
  progressCallback?: ProgressCallback,
): Promise<HTMLImageElement> {
  try {
    // Convert image to blob/data URL for background removal
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get 2d context from canvas");
    }
    ctx.drawImage(img, 0, 0);

    // Convert canvas to blob
    const blobPromise = new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.9);
    });
    const blob = await blobPromise;
    if (!blob) {
      throw new Error("Failed to convert canvas to blob");
    }

    // Check for WebGPU support
    const hasWebGPU = await checkWebGPUSupport();
    if (hasWebGPU) {
      console.log("Using WebGPU for background removal (runs in worker thread, won't block UI)");
    } else {
      console.log("WebGPU not available, using CPU (may block UI during processing)");
    }

    // Remove background - returns a PNG blob with transparent background
    // Construct absolute URL for publicPath
    const publicPath = new URL(
      "/passports/background-removal-assets/models/",
      window.location.origin,
    ).toString();
    const options: Config = {
      publicPath: publicPath,
      model: "isnet_fp16", // Use medium model for better quality (~84MB)
      device: hasWebGPU ? "gpu" : "cpu", // Use WebGPU if available, fallback to CPU
      proxyToWorker: hasWebGPU, // Use worker thread when WebGPU is available (prevents UI blocking)
      output: {
        format: "image/png",
      },
      ...(progressCallback === undefined ? {} : { progress: progressCallback }),
    };
    const resultBlob = await removeBackground(blob, options);

    // Create canvas with white background and composite the result
    const resultCanvas = document.createElement("canvas");
    resultCanvas.width = img.width;
    resultCanvas.height = img.height;
    const resultCtx = resultCanvas.getContext("2d");
    if (!resultCtx) {
      throw new Error("Failed to get 2d context from result canvas");
    }

    // Fill with white background
    resultCtx.fillStyle = "#ffffff";
    resultCtx.fillRect(0, 0, resultCanvas.width, resultCanvas.height);

    // Draw the background-removed image on top
    const resultImg = new Image();
    resultImg.src = URL.createObjectURL(resultBlob);
    const loadPromise1 = new Promise<void>((resolve) => {
      resultImg.onload = () => resolve();
    });
    await loadPromise1;
    resultCtx.drawImage(resultImg, 0, 0);
    URL.revokeObjectURL(resultImg.src);

    // Convert back to image
    const processedImg = new Image();
    processedImg.src = resultCanvas.toDataURL("image/jpeg", 0.9);
    const loadPromise2 = new Promise<void>((resolve) => {
      processedImg.onload = () => resolve();
    });
    await loadPromise2;
    console.log("Background removal successful");
    return processedImg;
  } catch (err) {
    console.warn("Background removal failed, using original image:", err);
    return img;
  }
}
