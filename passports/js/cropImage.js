/**
 * Cropping module for passport photo processing
 * Handles face detection-based cropping to passport size (2" × 2")
 */

import Human from './human.esm.js';
import { resizeImage } from './resizeImage.js';

// Human library instance (lazy initialized)
let human = null;
let modelsLoaded = false;

/**
 * Crop image to passport size with face detection
 * @param {HTMLImageElement} img - Source image to crop
 * @returns {Promise<HTMLImageElement>} Cropped passport-sized image
 */
export async function cropImage(img) {
    const targetSize = 600; // 2" at 300 DPI
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    let width = img.width;
    let height = img.height;
    let size = Math.min(width, height);
    let x = (width - size) / 2;
    let y = (height - size) / 2;

    // Create resized image for face detection
    const maxDetectSize = 512;
    const scale = maxDetectSize / Math.max(img.width, img.height);
    const detectImg = await resizeImage(img, img.width * scale, img.height * scale);

    // Face detection on resized image
    try {
        // Load models if not already loaded
        await loadModels();
        const result = await human.detect(detectImg);
        const face = result.face[0];
        if (face && face.landmarks) {
            const landmarks = face.landmarks;
            const eyes = landmarks.filter(l => l[0] >= 36 && l[0] <= 47); // Eye landmarks
            const topOfHead = landmarks[27]; // Approximate top of head
            const bottomOfChin = landmarks[8]; // Approximate bottom of chin

            // Scale landmarks back to original image size
            const scaleBack = 1 / scale;
            const headHeight = (bottomOfChin[1] - topOfHead[1]) * scaleBack;
            // Target head height: 1" to 1 3/8" (150-210px at 300 DPI), use 180px (60% of 300px)
            const targetHeadHeight = 180;
            const targetImageSize = (headHeight / targetHeadHeight) * targetSize;
            // Eye level: 1 1/8 to 1 3/8 inches from bottom, use midpoint (1.25 inches)
            // At 2-inch photo, eye level should be 1.25/2 = 62.5% from bottom
            const targetEyeLevelPercentage = 0.625;

            // Calculate eye center
            const eyeCenterY = (eyes.reduce((sum, e) => sum + e[1], 0) / eyes.length) * scaleBack;
            // Desired eye position in new image
            const newEyeY = targetSize * targetEyeLevelPercentage;
            // Calculate crop Y offset
            y = eyeCenterY - newEyeY;
            // Ensure crop stays within bounds
            y = Math.max(0, Math.min(y, height - targetSize));
            size = targetSize;
            // Center horizontally
            x = (width - size) / 2;
        }
    } catch (err) {
        console.warn('Face detection failed, using center crop');
    }

    // Crop to passport size
    canvas.width = targetSize;
    canvas.height = targetSize;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetSize, targetSize);
    ctx.drawImage(img, x, y, size, size, 0, 0, targetSize, targetSize);
    return new Promise((resolve) => {
        const croppedImg = new Image();
        croppedImg.onload = () => resolve(croppedImg);
        croppedImg.src = canvas.toDataURL('image/jpeg', 0.9);
    });
}


/**
 * Initialize and load Human models for face detection
 * @returns {Promise<void>}
 */
async function loadModels() {
    if (modelsLoaded) return;

    if (!human) {
        human = new Human({
            backend: 'webgl',
            modelBasePath: './models/',
            face: {
                enabled: true,
                detector: { rotation: false },
                mesh: { enabled: true },
                iris: { enabled: false },
                emotion: { enabled: false },
                description: { enabled: false }
            },
            body: { enabled: false },
            hand: { enabled: false },
            object: { enabled: false }
        });
    }

    try {
        await human.load();
        modelsLoaded = true;
        console.log('Human models loaded');
    } catch (err) {
        console.error('Model loading error:', err);
        throw err;
    }
}