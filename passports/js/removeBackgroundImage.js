/**
 * Background removal handler module
 * Wraps the background removal library with image processing utilities
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
 * @param {Function} progressCallback - Optional progress callback (step, current, total)
 * @returns {Promise<HTMLImageElement>} Image with background removed (white background)
 */
export async function removeBackgroundImage(img, progressCallback) {
    try {
        // Convert image to blob/data URL for background removal
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        // Convert canvas to blob
        const blob = await new Promise((resolve) => {
            canvas.toBlob(resolve, 'image/jpeg', 0.9);
        });

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
        const resultBlob = await removeBackground(blob, {
            publicPath: publicPath,
            model: 'isnet_fp16', // Use medium model for better quality (~84MB)
            device: hasWebGPU ? 'gpu' : 'cpu', // Use WebGPU if available, fallback to CPU
            proxyToWorker: hasWebGPU, // Use worker thread when WebGPU is available (prevents UI blocking)
            output: {
                format: 'image/png',
                type: 'foreground'
            },
            progress: progressCallback || undefined
        });

        // Create canvas with white background and composite the result
        const resultCanvas = document.createElement('canvas');
        resultCanvas.width = img.width;
        resultCanvas.height = img.height;
        const resultCtx = resultCanvas.getContext('2d');

        // Fill with white background
        resultCtx.fillStyle = '#ffffff';
        resultCtx.fillRect(0, 0, resultCanvas.width, resultCanvas.height);

        // Draw the background-removed image on top
        const resultImg = new Image();
        resultImg.src = URL.createObjectURL(resultBlob);
        await new Promise((resolve) => { resultImg.onload = resolve; });
        resultCtx.drawImage(resultImg, 0, 0);
        URL.revokeObjectURL(resultImg.src);

        // Convert back to image
        const processedImg = new Image();
        processedImg.src = resultCanvas.toDataURL('image/jpeg', 0.9);
        await new Promise((resolve) => { processedImg.onload = resolve; });
        console.log('Background removal successful');
        return processedImg;
    } catch (err) {
        console.warn('Background removal failed, using original image:', err);
        return img;
    }
}

