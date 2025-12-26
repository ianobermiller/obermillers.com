/**
 * Cropping module for passport photo processing
 * Handles face detection-based cropping to passport size (2" × 2")
 */

import Human from './human.esm.js';
import {resizeImage} from './resizeImage.js';

const TARGET_SIZE = 600; // 2" at 300 DPI
const MAX_FACE_DETECTION_SIZE = 512;

// Human library instance (lazy initialized)
let human = null;
let modelsLoaded = false;

/**
 * Crop image to passport size with face detection
 * @param {HTMLImageElement} img - Source image to crop
 * @param {boolean} debugMode - If true, draws face box on the final output image
 * @returns {Promise<{image: HTMLImageElement, faceDetected: boolean, imageScaledUp: boolean}>} Object with cropped passport-sized image, faceDetected, and imageScaledUp flags
 */
export async function cropImage(img, debugMode = false) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    let width = img.width;
    let height = img.height;
    let size = Math.min(width, height);
    let x = (width - size) / 2;
    let y = (height - size) / 2;

    // Create resized image for face detection
    const scale = MAX_FACE_DETECTION_SIZE / Math.max(img.width, img.height);
    const detectImg = await resizeImage(img, img.width * scale, img.height * scale);

    // Face detection on resized image
    let faceBox = null;
    let headTopY = null;
    let headBottomY = null;
    let faceDetected = false;
    let imageScaledUp = false;
    try {
        // Load models if not already loaded
        await loadModels();

        // Try detection on resized image first
        let result = await human.detect(detectImg);

        // Debug: log detection results
        console.log('Face detection results (resized):', {
            imageSize: `${detectImg.width}x${detectImg.height}`,
            originalSize: `${img.width}x${img.height}`,
            faceCount: result.face?.length || 0,
            faces: result.face?.map(f => ({
                score: f.score,
                box: f.box,
                hasMesh: !!f.mesh
            })) || []
        });

        const face = result.face?.[0];

        if (face) {
            faceDetected = true;
            // Scale back to original image size
            // Human.js returns coordinates relative to the resized image (detectImg)
            // Dimensions are img.width * scale x img.height * scale
            // So we need to scale coordinates back to original image size
            const scaleBack = 1 / scale;
            const detectWidth = img.width * scale;
            const detectHeight = img.height * scale;
            let headTopY, headBottomY;

            // Use bounding box for head bounds (includes more of the head than mesh)
            // Mesh only covers facial features, not the full head
            if (face.box) {
                const box = face.box;
                let boxX, boxY, boxWidth, boxHeight;
                if (Array.isArray(box)) {
                    // Check if normalized
                    if (box[1] <= 1.0 && box[1] >= 0.0) {
                        boxX = (box[0] * detectWidth) * scaleBack;
                        boxY = (box[1] * detectHeight) * scaleBack;
                        boxWidth = (box[2] * detectWidth) * scaleBack;
                        boxHeight = (box[3] * detectHeight) * scaleBack;
                    } else {
                        boxX = box[0] * scaleBack;
                        boxY = box[1] * scaleBack;
                        boxWidth = box[2] * scaleBack;
                        boxHeight = box[3] * scaleBack;
                    }
                } else {
                    if (box.y <= 1.0 && box.y >= 0.0) {
                        boxX = (box.x * detectWidth) * scaleBack;
                        boxY = (box.y * detectHeight) * scaleBack;
                        boxWidth = (box.width * detectWidth) * scaleBack;
                        boxHeight = (box.height * detectHeight) * scaleBack;
                    } else {
                        boxX = box.x * scaleBack;
                        boxY = box.y * scaleBack;
                        boxWidth = box.width * scaleBack;
                        boxHeight = box.height * scaleBack;
                    }
                }

                // Store face box for debug rendering
                faceBox = { x: boxX, y: boxY, width: boxWidth, height: boxHeight };

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

            // Desired head center position in final 600x600 image (positioned higher, ~42% from top)
            const newHeadCenterY = TARGET_SIZE * 0.42;

            // Calculate source crop size
            // When we scale a region of size 'size' to targetSize, the scale is targetSize/size
            // So headHeight becomes headHeight * (targetSize/size) in final image
            // We want: headHeight * (targetSize/size) = targetHeadHeight
            // Therefore: size = headHeight * targetSize / targetHeadHeight
            size = (headHeight * TARGET_SIZE) / targetHeadHeight;

            // Check if image is too small and needs to be scaled up
            const maxSize = Math.min(width, height);
            let scaleUpFactor = 1;
            if (size > maxSize) {
                // Image is too small - calculate scale factor needed
                // We need at least 'size' pixels, so scale up by size/maxSize
                scaleUpFactor = size / maxSize;
                imageScaledUp = true;

                // Scale up the image
                const scaledWidth = width * scaleUpFactor;
                const scaledHeight = height * scaleUpFactor;

                // Create scaled image
                const scaledCanvas = document.createElement('canvas');
                scaledCanvas.width = scaledWidth;
                scaledCanvas.height = scaledHeight;
                const scaledCtx = scaledCanvas.getContext('2d');
                scaledCtx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

                // Create new image from scaled canvas
                const scaledImg = new Image();
                await new Promise((resolve) => {
                    scaledImg.onload = resolve;
                    scaledImg.src = scaledCanvas.toDataURL('image/jpeg', 0.95);
                });

                // Update image and dimensions
                img = scaledImg;
                width = scaledWidth;
                height = scaledHeight;

                // Scale up face detection coordinates
                headTopY *= scaleUpFactor;
                headBottomY *= scaleUpFactor;
                if (faceBox) {
                    faceBox.x *= scaleUpFactor;
                    faceBox.y *= scaleUpFactor;
                    faceBox.width *= scaleUpFactor;
                    faceBox.height *= scaleUpFactor;
                }
            }

            // Calculate head center in (possibly scaled) image
            const headCenterX = width / 2; // Center horizontally
            const headCenterY = (headTopY + headBottomY) / 2;

            // Calculate crop position
            // Head center relative to crop: (headCenterY - y)
            // After scaling: (headCenterY - y) * (targetSize/size) = newHeadCenterY
            // So: y = headCenterY - (newHeadCenterY * size / targetSize)
            x = headCenterX - (size / 2);
            y = headCenterY - (newHeadCenterY * size / TARGET_SIZE);

            // Clamp to image bounds
            x = Math.max(0, Math.min(x, width - size));
            y = Math.max(0, Math.min(y, height - size));
        } else {
            // No face detected
            faceDetected = false;
        }
    } catch (err) {
        console.warn('Face detection failed, using center crop:', err);
        faceDetected = false;
    }

    // Crop and scale to passport size
    canvas.width = TARGET_SIZE;
    canvas.height = TARGET_SIZE;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, TARGET_SIZE, TARGET_SIZE);
    // Draw the cropped region scaled to fill the 600x600 canvas
    ctx.drawImage(img, x, y, size, size, 0, 0, TARGET_SIZE, TARGET_SIZE);

    // Draw face box on final output image if debug mode is enabled
    if (debugMode && faceBox) {
        // Transform face box coordinates from original image to cropped/scaled output
        const scale = TARGET_SIZE / size;
        const faceBoxX = (faceBox.x - x) * scale;
        const faceBoxY = (faceBox.y - y) * scale;
        const faceBoxWidth = faceBox.width * scale;
        const faceBoxHeight = faceBox.height * scale;

        // Draw face detection box on the final output
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;
        ctx.strokeRect(faceBoxX, faceBoxY, faceBoxWidth, faceBoxHeight);

        // Add label for face box
        ctx.fillStyle = '#ff0000';
        ctx.font = '16px Arial';
        ctx.fillText('Face Box', faceBoxX, Math.max(faceBoxY - 5, 15));
    }

    return new Promise((resolve) => {
        const croppedImg = new Image();
        croppedImg.onload = () => {
            // Always return object with image, faceDetected, and imageScaledUp flags
            resolve({ image: croppedImg, faceDetected, imageScaledUp });
        };
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
                detector: {
                    rotation: false,
                    return: true,
                    minConfidence: 0.1, // Lower threshold for better detection
                    maxDetections: 1
                },
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