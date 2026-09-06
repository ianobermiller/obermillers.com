/**
 * Type definitions for passport photo processing.
 *
 * Also declares the shapes of the vendored detection libraries that are loaded
 * as browser globals via script tags from /passports/js/face-detection/.
 */

export interface FaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
  eyeY?: number;
}

/** Square crop region in source image pixel coordinates */
export interface CropRect {
  x: number;
  y: number;
  size: number;
}

export interface CropImageResult {
  image: HTMLImageElement;
  faceDetected: boolean;
  imageScaledUp: boolean;
  /** Present when cropping ran; same element used as drawImage source */
  sourceImage?: HTMLImageElement | undefined;
  cropRect?: CropRect | undefined;
}

export type ProgressCallback = (step: string, current: number, total: number) => void;

/** Detection rectangle from objectdetect: [x, y, width, height, confidence] */
export type DetectionRect = [number, number, number, number, number];

/**
 * Compiled Haar cascade, e.g. `window.objectdetect.frontalface`. Treated as an
 * opaque value that is only ever handed back to the detector constructor.
 */
export interface ObjectDetectClassifier {
  readonly tilted?: number;
}

export interface ObjectDetectDetector {
  detect(image: CanvasImageSource, group?: number, stepSize?: number): DetectionRect[];
}

export interface ObjectDetectDetectorConstructor {
  new (
    width: number,
    height: number,
    scaleFactor: number,
    classifier: ObjectDetectClassifier,
  ): ObjectDetectDetector;
}

export interface ObjectDetect {
  readonly detector: ObjectDetectDetectorConstructor;
  /** Provided by objectdetect.frontalface.js, loaded separately */
  readonly frontalface?: ObjectDetectClassifier;
  groupRectangles(
    rects: DetectionRect[],
    minNeighbors: number,
    confluence?: number,
  ): DetectionRect[];
}

/** A merged detection from tracking.js, in the coordinate space of the tracked element */
export interface TrackingRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly total: number;
}

export interface TrackingEvent {
  readonly data?: readonly TrackingRect[];
}

export interface TrackingObjectTracker {
  setStepSize(stepSize: number): void;
  on(event: "track", listener: (event: TrackingEvent) => void): TrackingObjectTracker;
}

export interface TrackingObjectTrackerConstructor {
  new (classifiers: readonly string[]): TrackingObjectTracker;
}

export interface Tracking {
  readonly ObjectTracker: TrackingObjectTrackerConstructor;
  track(element: HTMLElement | string, tracker: TrackingObjectTracker): void;
}

declare global {
  interface Window {
    objectdetect?: ObjectDetect;
    tracking?: Tracking;
  }
}
