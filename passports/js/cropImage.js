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

        if (face) {
            // Scale back to original image size
            // Human.js returns coordinates relative to the input image (detectImg)
            // detectImg dimensions: img.width * scale x img.height * scale
            // So we need to scale coordinates back to original image size
            const scaleBack = 1 / scale;
            const detectWidth = img.width * scale;
            const detectHeight = img.height * scale;
            let headTopY, headBottomY;

            // Use bounding box for head bounds (includes more of the head than mesh)
            // Mesh only covers facial features, not the full head
            if (face.box) {
                const box = face.box;
                let boxY, boxHeight;
                if (Array.isArray(box)) {
                    // Check if normalized
                    if (box[1] <= 1.0 && box[1] >= 0.0) {
                        boxY = (box[1] * detectHeight) * scaleBack;
                        boxHeight = (box[3] * detectHeight) * scaleBack;
                    } else {
                        boxY = box[1] * scaleBack;
                        boxHeight = box[3] * scaleBack;
                    }
                } else {
                    if (box.y <= 1.0 && box.y >= 0.0) {
                        boxY = (box.y * detectHeight) * scaleBack;
                        boxHeight = (box.height * detectHeight) * scaleBack;
                    } else {
                        boxY = box.y * scaleBack;
                        boxHeight = box.height * scaleBack;
                    }
                }

                // Extend the bounding box to include more head space above and below
                // Add significant space above (for top of head/hair) and below (for neck/shoulders)
                // Face detection box typically goes from forehead to chin, so we need ~60% above for full head
                const headExtensionTop = boxHeight * 0.6;
                const headExtensionBottom = boxHeight * 0.3;

                headTopY = boxY - headExtensionTop;
                headBottomY = boxY + boxHeight + headExtensionBottom;
            } else if (face.mesh && Array.isArray(face.mesh) && face.mesh.length > 0) {
                // Fallback to mesh if box isn't available, but extend it significantly
                headTopY = Infinity;
                headBottomY = -Infinity;

                for (const landmark of face.mesh) {
                    let yCoord;
                    if (Array.isArray(landmark)) {
                        yCoord = landmark[1];
                    } else if (landmark.y !== undefined) {
                        yCoord = landmark.y;
                    } else {
                        continue;
                    }

                    let y;
                    if (yCoord <= 1.0 && yCoord >= 0.0) {
                        y = (yCoord * detectHeight) * scaleBack;
                    } else {
                        y = yCoord * scaleBack;
                    }

                    if (y < headTopY) headTopY = y;
                    if (y > headBottomY) headBottomY = y;
                }

                // Extend mesh bounds significantly to include full head
                const meshHeight = headBottomY - headTopY;
                headTopY = headTopY - (meshHeight * 0.5); // Add 50% above for top of head
                headBottomY = headBottomY + (meshHeight * 0.3); // Add 30% below for neck
            } else {
                // No usable face data, skip face-based cropping
                throw new Error('No mesh or box data available');
            }

            // Calculate head height and determine crop size so head is exactly 1" (150px at 300 DPI)
            const headHeight = headBottomY - headTopY;
            const targetHeadHeight = 150; // 1" at 300 DPI

            // Calculate head center in original image
            const headCenterX = width / 2; // Center horizontally
            const headCenterY = (headTopY + headBottomY) / 2;

            // Desired head center position in final 600x600 image (positioned higher, ~42% from top)
            const newHeadCenterY = targetSize * 0.42;

            // Calculate source crop size
            // When we scale a region of size 'size' to targetSize, the scale is targetSize/size
            // So headHeight becomes headHeight * (targetSize/size) in final image
            // We want: headHeight * (targetSize/size) = targetHeadHeight
            // Therefore: size = headHeight * targetSize / targetHeadHeight
            size = (headHeight * targetSize) / targetHeadHeight;

            // Calculate crop position
            // Head center relative to crop: (headCenterY - y)
            // After scaling: (headCenterY - y) * (targetSize/size) = newHeadCenterY
            // So: y = headCenterY - (newHeadCenterY * size / targetSize)
            x = headCenterX - (size / 2);
            y = headCenterY - (newHeadCenterY * size / targetSize);

            // Ensure crop stays within bounds
            // If size exceeds image, clamp it and adjust positioning
            const maxSize = Math.min(width, height);
            if (size > maxSize) {
                // Head is too small relative to image - we'll need to scale up
                // Keep the crop size at maxSize, head will be slightly larger than target
                size = maxSize;
                x = headCenterX - (size / 2);
                y = headCenterY - (newHeadCenterY * size / targetSize);
            }

            // Clamp to image bounds
            x = Math.max(0, Math.min(x, width - size));
            y = Math.max(0, Math.min(y, height - size));
        }
    } catch (err) {
        console.warn('Face detection failed, using center crop');
    }

    // Crop and scale to passport size
    canvas.width = targetSize;
    canvas.height = targetSize;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetSize, targetSize);
    // Draw the cropped region scaled to fill the 600x600 canvas
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