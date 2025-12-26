/**
 * Background removal handler module
 * Wraps the background removal library with image processing utilities
 * @module removeBackgroundImage
 * @imports {RemoveBackgroundOptions, ProgressCallback} from './types.d.ts'
 */

import { removeBackground } from './background-removal.js';

/**
 * Check if WebGPU is available
 * @returns {Promise<boolean>}
 */
async function checkWebGPUSupport() {
    if (typeof navigator === 'undefined' || !navigator.gpu) {
        return false;
    }
    try {
        const adapter = await navigator.gpu.requestAdapter();
        return adapter !== null;
    } catch (e) {
        return false;
    }
}

/**
 * Remove background from an image
 * @param {HTMLImageElement} img - Source image
 * @param {import('./types.d.ts').ProgressCallback} [progressCallback] - Optional progress callback (step, current, total)
 * @returns {Promise<HTMLImageElement>} Image with background removed (white background)
 */
export async function removeBackgroundImage(img, progressCallback) {
    try {
        // Convert image to blob/data URL for background removal
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Failed to get 2d context from canvas');
        }
        ctx.drawImage(img, 0, 0);

        // Convert canvas to blob
        /** @type {Promise<Blob | null>} */
        const blobPromise = new Promise((resolve) => {
            canvas.toBlob(resolve, 'image/jpeg', 0.9);
        });
        const blob = await blobPromise;
        if (!blob) {
            throw new Error('Failed to convert canvas to blob');
        }

        // Check for WebGPU support
        const hasWebGPU = await checkWebGPUSupport();
        if (hasWebGPU) {
            console.log('Using WebGPU for background removal (runs in worker thread, won\'t block UI)');
        } else {
            console.log('WebGPU not available, using CPU (may block UI during processing)');
        }

        // Remove background - returns a PNG blob with transparent background
        // Construct absolute URL for publicPath
        const publicPath = new URL('./background-removal-assets/models/', window.location.href).toString();
        /** @type {import('./types.d.ts').RemoveBackgroundOptions} */
        const options = {
            publicPath: publicPath,
            model: 'isnet_fp16', // Use medium model for better quality (~84MB)
            device: hasWebGPU ? 'gpu' : 'cpu', // Use WebGPU if available, fallback to CPU
            proxyToWorker: hasWebGPU, // Use worker thread when WebGPU is available (prevents UI blocking)
            output: {
                format: 'image/png',
                type: 'foreground'
            },
            progress: progressCallback || undefined
        };
        const resultBlob = await removeBackground(blob, options);

        // Create canvas with white background and composite the result
        const resultCanvas = document.createElement('canvas');
        resultCanvas.width = img.width;
        resultCanvas.height = img.height;
        const resultCtx = resultCanvas.getContext('2d');
        if (!resultCtx) {
            throw new Error('Failed to get 2d context from result canvas');
        }

        // Fill with white background
        resultCtx.fillStyle = '#ffffff';
        resultCtx.fillRect(0, 0, resultCanvas.width, resultCanvas.height);

        // Draw the background-removed image on top
        const resultImg = new Image();
        resultImg.src = URL.createObjectURL(resultBlob);
        /** @type {Promise<void>} */
        const loadPromise1 = new Promise((resolve) => {
            resultImg.onload = () => resolve();
        });
        await loadPromise1;
        resultCtx.drawImage(resultImg, 0, 0);
        URL.revokeObjectURL(resultImg.src);

        // Convert back to image
        const processedImg = new Image();
        processedImg.src = resultCanvas.toDataURL('image/jpeg', 0.9);
        /** @type {Promise<void>} */
        const loadPromise2 = new Promise((resolve) => {
            processedImg.onload = () => resolve();
        });
        await loadPromise2;
        console.log('Background removal successful');
        return processedImg;
    } catch (err) {
        console.warn('Background removal failed, using original image:', err);
        return img;
    }
}

