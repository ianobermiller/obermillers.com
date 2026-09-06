/**
 * Cropping module for passport photo processing
 * Handles face and eye detection-based cropping to passport size (2" × 2")
 *
 * Detection uses code adapted from the U.S. State Department's passport photo tool:
 * - Face detection: Haar Cascade (objectdetect.js library)
 * - Eye detection: tracking.js library
 *
 * @module cropImage
 */

import type { CropImageResult, CropRect, DetectionRect, FaceBox } from "./types";

export type { CropRect } from "./types";

/** 2" at 300 DPI */
const TARGET_SIZE = 600;
const MAX_DETECT_DIM = 701; // Match State Dept canvas size for consistent face detection
const MIN_EYE_DISTANCE = 20; // Minimum distance between eyes (from State Dept code)

interface EyePoint {
  x: number;
  y: number;
}

interface DetectedEyes {
  leftEye: EyePoint | null;
  rightEye: EyePoint | null;
}

/**
 * Detect eyes using tracking.js within the face region
 * @param img - Source image
 * @param faceBox - Face bounding box {x, y, width, height}
 * @param detectScale - Scale factor used for detection
 */
async function detectEyes(
  img: HTMLImageElement,
  faceBox: FaceBox,
  detectScale: number,
): Promise<DetectedEyes> {
  const tracking = window.tracking;
  if (!tracking) {
    console.warn("tracking.js not loaded, will estimate eye positions from face box");
    return { leftEye: null, rightEye: null };
  }

  return new Promise<DetectedEyes>((resolve) => {
    // Create canvas for the face region
    const faceCanvas = document.createElement("canvas");

    // Scale face box for detection
    const scaledFaceX = faceBox.x * detectScale;
    const scaledFaceY = faceBox.y * detectScale;
    const scaledFaceWidth = faceBox.width * detectScale;
    const scaledFaceHeight = faceBox.height * detectScale;

    faceCanvas.width = scaledFaceWidth;
    faceCanvas.height = scaledFaceHeight;

    const faceCtx = faceCanvas.getContext("2d");
    if (!faceCtx) {
      resolve({ leftEye: null, rightEye: null });
      return;
    }

    // Draw just the face region
    faceCtx.drawImage(
      img,
      scaledFaceX,
      scaledFaceY,
      scaledFaceWidth,
      scaledFaceHeight,
      0,
      0,
      scaledFaceWidth,
      scaledFaceHeight,
    );

    const tracker = new tracking.ObjectTracker(["eye"]);
    tracker.setStepSize(1);

    const detectedEyes: Array<{ x: number; y: number; width: number; height: number }> = [];
    let trackingComplete = false;

    tracker.on("track", (event) => {
      if (trackingComplete) return;

      if (event.data && event.data.length > 0) {
        // Collect all detected eyes
        event.data.forEach((eye) => {
          detectedEyes.push({
            x: eye.x + eye.width / 2,
            y: eye.y + eye.height / 2,
            width: eye.width,
            height: eye.height,
          });
        });
      }

      trackingComplete = true;

      // Process detected eyes
      if (detectedEyes.length >= 2) {
        // Sort by x position (left to right)
        detectedEyes.sort((a, b) => a.x - b.x);

        // Take the two most separated eyes
        const leftEye = detectedEyes[0];
        const rightEye = detectedEyes[detectedEyes.length - 1];

        // Convert back to original image coordinates
        const scaleBack = 1 / detectScale;
        if (leftEye && rightEye) {
          resolve({
            leftEye: {
              x: (scaledFaceX + leftEye.x) * scaleBack,
              y: (scaledFaceY + leftEye.y) * scaleBack,
            },
            rightEye: {
              x: (scaledFaceX + rightEye.x) * scaleBack,
              y: (scaledFaceY + rightEye.y) * scaleBack,
            },
          });
        } else {
          resolve({ leftEye: null, rightEye: null });
        }
      } else {
        // Not enough eyes detected
        resolve({ leftEye: null, rightEye: null });
      }
    });

    // Run tracking
    tracking.track(faceCanvas, tracker);

    // Timeout fallback
    setTimeout(() => {
      if (!trackingComplete) {
        trackingComplete = true;
        resolve({ leftEye: null, rightEye: null });
      }
    }, 2000);
  });
}

/**
 * Detect face using Haar Cascade face detection
 * @param img - Source image
 * @param width - Original image width
 * @param height - Original image height
 * @param detectWidth - Detection canvas width
 * @param detectHeight - Detection canvas height
 * @param detectScale - Scale factor for detection
 */
function detectFace(
  img: HTMLImageElement,
  width: number,
  height: number,
  detectWidth: number,
  detectHeight: number,
  detectScale: number,
): { faceBox: FaceBox | null; faceDetected: boolean } {
  const objectdetect = window.objectdetect;
  const frontalface = objectdetect?.frontalface;
  if (!objectdetect || !frontalface) {
    throw new Error(
      "objectdetect library not loaded. Please include objectdetect.js and objectdetect.frontalface.js",
    );
  }

  // Create detection canvas (scaled down for performance if needed)
  const detectCanvas = document.createElement("canvas");
  detectCanvas.width = detectWidth;
  detectCanvas.height = detectHeight;
  const detectCtx = detectCanvas.getContext("2d");
  if (!detectCtx) {
    throw new Error("Failed to get 2d context from detection canvas");
  }

  // Draw the scaled image
  detectCtx.drawImage(img, 0, 0, detectWidth, detectHeight);

  // Initialize detector with detection canvas dimensions
  const faceDetector = new objectdetect.detector(
    detectWidth,
    detectHeight,
    1.5, // Scale factor for multi-scale detection
    frontalface,
  );

  // Detect faces
  const detections = faceDetector.detect(detectCanvas);

  // Round detection values
  detections.forEach((det) => {
    det[0] = ~~det[0];
    det[1] = ~~det[1];
    det[2] = ~~det[2];
    det[3] = ~~det[3];
  });

  // Group overlapping detections
  const groupedDetections = objectdetect.groupRectangles(detections, 1, 0.25);

  // Debug: log detection results
  console.log("Face detection results:", {
    originalSize: `${width}x${height}`,
    detectSize: `${detectWidth}x${detectHeight}`,
    detectScale: detectScale.toFixed(3),
    rawDetections: detections.length,
    groupedDetections: groupedDetections.length,
    faces: groupedDetections.map((d) => ({
      x: d[0],
      y: d[1],
      width: d[2],
      height: d[3],
      confidence: d[4],
    })),
  });

  // Select face using State Dept approach:
  // Prefer faces closer to center of image (weighted by size)
  // This matches their behavior of selecting center-right face over larger left-side face
  const imageCenterX = detectWidth / 2;
  const firstDetection = groupedDetections[0];
  const face: DetectionRect | null = firstDetection
    ? groupedDetections.reduce((best, current) => {
        // Calculate face centers
        const bestCenterX = best[0] + best[2] / 2;
        const currentCenterX = current[0] + current[2] / 2;

        // Distance from image center (normalized)
        const bestDist = Math.abs(bestCenterX - imageCenterX) / detectWidth;
        const currentDist = Math.abs(currentCenterX - imageCenterX) / detectWidth;

        // Size score (area)
        const bestSize = best[2] * best[3];
        const currentSize = current[2] * current[3];

        // Combined score: strongly prefer faces near center
        // Formula: size * (1 - distance_penalty)²
        // Squaring the distance makes center-proximity much more important
        const distancePenalty = 0.8; // 80% penalty for faces at edge
        const bestScore = bestSize * Math.pow(1 - bestDist * distancePenalty, 2);
        const currentScore = currentSize * Math.pow(1 - currentDist * distancePenalty, 2);

        return currentScore > bestScore ? current : best;
      }, firstDetection)
    : null;

  if (face) {
    console.log(
      `Selected face: ${face[2].toFixed(0)}x${face[3].toFixed(0)}px at x=${face[0].toFixed(0)} with confidence ${face[4].toFixed(1)}`,
    );
  }

  if (!face) {
    return { faceBox: null, faceDetected: false };
  }

  // Scale face coordinates back to original image space
  const scaleBack = 1 / detectScale;
  const faceX = face[0] * scaleBack;
  const faceY = face[1] * scaleBack;
  const faceWidth = face[2] * scaleBack;
  const faceHeight = face[3] * scaleBack;

  const faceBox: FaceBox = {
    x: faceX,
    y: faceY,
    width: faceWidth,
    height: faceHeight,
    eyeY: faceY + faceHeight * 0.4, // Estimate eye position at ~40% from top
  };

  console.log("Face box (scaled to original):", faceBox);
  return { faceBox, faceDetected: true };
}

export interface ApplySquareCropOptions {
  debugMode?: boolean;
  faceBox?: FaceBox | null;
}

/**
 * Draw a square region from the source image scaled to TARGET_SIZE × TARGET_SIZE.
 * @param img - Source image
 * @param cropRect - Square { x, y, size } in source pixels
 */
export function applySquareCrop(
  img: HTMLImageElement,
  cropRect: CropRect,
  options: ApplySquareCropOptions = {},
): Promise<HTMLImageElement> {
  const { x, y, size } = cropRect;
  const { debugMode = false, faceBox = null } = options;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return Promise.reject(new Error("Failed to get 2d context from canvas"));
  }

  canvas.width = TARGET_SIZE;
  canvas.height = TARGET_SIZE;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, TARGET_SIZE, TARGET_SIZE);
  ctx.drawImage(img, x, y, size, size, 0, 0, TARGET_SIZE, TARGET_SIZE);

  if (debugMode && faceBox) {
    const scale = TARGET_SIZE / size;
    const faceBoxX = (faceBox.x - x) * scale;
    const faceBoxY = (faceBox.y - y) * scale;
    const faceBoxWidth = faceBox.width * scale;
    const faceBoxHeight = faceBox.height * scale;

    ctx.strokeStyle = "#ff0000";
    ctx.lineWidth = 3;
    ctx.strokeRect(faceBoxX, faceBoxY, faceBoxWidth, faceBoxHeight);
  }

  return new Promise<HTMLImageElement>((resolve) => {
    const out = new Image();
    out.onload = () => resolve(out);
    out.src = canvas.toDataURL("image/jpeg", 0.9);
  });
}

/**
 * Crop image to passport size with face detection
 * @param img - Source image to crop
 * @param debugMode - If true, draws face box on the final output image
 * @returns Cropped image, flags, and source/cropRect for manual adjustment
 */
export async function cropImage(
  img: HTMLImageElement,
  debugMode = false,
): Promise<CropImageResult> {
  let source = img;
  let width = source.width;
  let height = source.height;
  let size = Math.min(width, height);
  let x = (width - size) / 2;
  let y = (height - size) / 2;

  let faceBox: FaceBox | null = null;
  let faceDetected = false;
  let imageScaledUp = false;

  try {
    // Scale down large images for performance
    const maxDim = Math.max(width, height);
    const detectScale = maxDim > MAX_DETECT_DIM ? MAX_DETECT_DIM / maxDim : 1;
    const detectWidth = Math.floor(width * detectScale);
    const detectHeight = Math.floor(height * detectScale);

    const result = detectFace(source, width, height, detectWidth, detectHeight, detectScale);
    faceBox = result.faceBox;
    faceDetected = result.faceDetected;

    if (faceBox) {
      faceDetected = true;

      // Try to detect eyes within the face region
      const eyes = await detectEyes(source, faceBox, detectScale);

      let eyeCenterX: number;
      let eyeCenterY: number;
      let eyeDistance: number;

      if (eyes.leftEye && eyes.rightEye) {
        // Calculate distance between eyes
        eyeDistance = Math.sqrt(
          Math.pow(eyes.rightEye.x - eyes.leftEye.x, 2) +
            Math.pow(eyes.rightEye.y - eyes.leftEye.y, 2),
        );

        // Only use eye detection if distance is reasonable
        if (eyeDistance >= MIN_EYE_DISTANCE) {
          // Use actual detected eye positions
          eyeCenterX = (eyes.leftEye.x + eyes.rightEye.x) / 2;
          eyeCenterY = (eyes.leftEye.y + eyes.rightEye.y) / 2;

          console.log("Eyes detected:", {
            leftEye: eyes.leftEye,
            rightEye: eyes.rightEye,
            distance: eyeDistance.toFixed(1),
            center: { x: eyeCenterX.toFixed(1), y: eyeCenterY.toFixed(1) },
          });
        } else {
          // Eye distance too small, fall back to estimate using official formula
          const leftEyeX = 0.268477498010644 * faceBox.width + faceBox.x;
          const rightEyeX = 0.67579624247238 * faceBox.width + faceBox.x;
          const eyesY = 0.368889180677045 * faceBox.height + faceBox.y;

          eyeCenterX = (leftEyeX + rightEyeX) / 2;
          eyeCenterY = eyesY;
          eyeDistance = rightEyeX - leftEyeX;

          console.log("Eye distance too small, using official estimation formula");
        }
      } else {
        // No eyes detected, estimate from face box using official formula
        // From estimateEyePositions() in phototool-all-1.0.0.min.js:
        // leftEye.x = 0.268477498010644 * faceWidth + faceX
        // rightEye.x = 0.67579624247238 * faceWidth + faceX
        // eyes.y = 0.368889180677045 * faceHeight + faceY

        const leftEyeX = 0.268477498010644 * faceBox.width + faceBox.x;
        const rightEyeX = 0.67579624247238 * faceBox.width + faceBox.x;
        const eyesY = 0.368889180677045 * faceBox.height + faceBox.y;

        eyeCenterX = (leftEyeX + rightEyeX) / 2;
        eyeCenterY = eyesY;
        eyeDistance = rightEyeX - leftEyeX; // Distance between estimated eye positions

        console.log("Eyes not detected, using official estimation formula from face box:", {
          leftEye: { x: leftEyeX.toFixed(1), y: eyesY.toFixed(1) },
          rightEye: { x: rightEyeX.toFixed(1), y: eyesY.toFixed(1) },
          eyeDistance: eyeDistance.toFixed(1),
        });
      }

      // OFFICIAL STATE DEPARTMENT ALGORITHM:
      // From phototool-all-1.0.0.min.js calculateCropArea function:
      // 1. Calculate crop size based on eye distance
      //    var E = Math.min(5.04, Math.min(n, l)) * d;
      //    where d = eye distance, n = width ratio, l = height ratio
      // 2. Position eyes at 41% from top of crop box
      //    r.top = g - p * i; where i = 0.41, g = eyeCenterY, p = cropHeight

      // Calculate ratios (how many "eye distances" fit in the image)
      const widthRatio = width / eyeDistance;
      const heightRatio = height / eyeDistance;

      console.log("Official algorithm ratios:", {
        eyeDistance: eyeDistance.toFixed(1),
        widthRatio: widthRatio.toFixed(2),
        heightRatio: heightRatio.toFixed(2),
      });

      // Official constraint: if widthRatio < 3.5, reject the crop
      // This means the face is too large relative to the image
      if (widthRatio < 3.5) {
        console.log("⚠️ Face too large for image (widthRatio < 3.5), falling back to center crop");
        faceDetected = false;
        // Fall through to center crop
      } else {
        // Crop size = min(5.04, min(widthRatio, heightRatio)) * eyeDistance
        // This ensures head is properly sized (eye distance should be ~16-20% of crop height)
        const cropSizeMultiplier = Math.min(5.04, Math.min(widthRatio, heightRatio));
        const cropSize = cropSizeMultiplier * eyeDistance;

        console.log("Official algorithm crop calculation:", {
          cropSizeMultiplier: cropSizeMultiplier.toFixed(2),
          cropSize: cropSize.toFixed(1),
        });

        // Position crop box so eyes are at 41% from top (Official State Dept value)
        x = eyeCenterX - cropSize / 2;
        y = eyeCenterY - cropSize * 0.41;
        size = cropSize;

        // Clamp to image bounds before any scaling
        x = Math.max(0, Math.min(x, width - size));
        y = Math.max(0, Math.min(y, height - size));

        console.log("Crop parameters (before scale up check):", {
          size: size.toFixed(1),
          x: x.toFixed(1),
          y: y.toFixed(1),
          eyeCenterX: eyeCenterX.toFixed(1),
          eyeCenterY: eyeCenterY.toFixed(1),
          eyesFromTop: (((eyeCenterY - y) / size) * 100).toFixed(1) + "%",
          imageDimensions: `${width}x${height}`,
        });
      }
    } else {
      // No face detected
      faceDetected = false;
    }
  } catch (err) {
    console.warn("Face detection failed, using center crop:", err);
    faceDetected = false;
  }

  // Only proceed with scale-up check if face was detected and validated
  if (faceDetected && size > Math.min(width, height)) {
    // Image is too small - calculate scale factor needed
    const maxSize = Math.min(width, height);
    const scaleUpFactor = size / maxSize;
    imageScaledUp = true;

    // Scale up the image
    const scaledWidth = width * scaleUpFactor;
    const scaledHeight = height * scaleUpFactor;

    // Create scaled image
    const scaledCanvas = document.createElement("canvas");
    scaledCanvas.width = scaledWidth;
    scaledCanvas.height = scaledHeight;
    const scaledCtx = scaledCanvas.getContext("2d");
    if (!scaledCtx) {
      throw new Error("Failed to get 2d context from scaled canvas");
    }
    scaledCtx.drawImage(source, 0, 0, scaledWidth, scaledHeight);

    // Create new image from scaled canvas
    const scaledImg = new Image();
    const loadPromise = new Promise<void>((resolve) => {
      scaledImg.onload = () => resolve();
      scaledImg.src = scaledCanvas.toDataURL("image/jpeg", 0.95);
    });
    await loadPromise;

    // Update image and dimensions
    source = scaledImg;
    width = scaledWidth;
    height = scaledHeight;

    // Scale up face detection coordinates and crop position
    if (faceBox) {
      faceBox.x *= scaleUpFactor;
      faceBox.y *= scaleUpFactor;
      faceBox.width *= scaleUpFactor;
      faceBox.height *= scaleUpFactor;
      if (faceBox.eyeY) {
        faceBox.eyeY *= scaleUpFactor;
      }
    }

    // Scale crop position and size
    x *= scaleUpFactor;
    y *= scaleUpFactor;
    size *= scaleUpFactor;

    console.log("Scaled up image and crop:", {
      scaleUpFactor,
      newImageDimensions: `${width}x${height}`,
      newSize: size,
      newX: x,
      newY: y,
    });
  }

  const cropRect: CropRect = { x, y, size };
  const croppedImg = await applySquareCrop(source, cropRect, { debugMode, faceBox });

  return {
    image: croppedImg,
    faceDetected,
    imageScaledUp,
    sourceImage: source,
    cropRect,
  };
}
