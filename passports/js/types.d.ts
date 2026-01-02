/**
 * Type definitions for passport photo processing
 * Uses official Human.js types from @vladmandic/human
 */

// Re-export official Human.js types
export type {
    Human,
    Config as HumanConfig,
    Result as HumanResult,
    FaceResult,
    Box,
    Point,
} from '@vladmandic/human';

// Application-specific types
export interface FaceBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface CropImageResult {
    image: HTMLImageElement;
    faceDetected: boolean;
    imageScaledUp: boolean;
}

export interface RemoveBackgroundOptions {
    publicPath: string;
    model: string;
    device: 'gpu' | 'cpu';
    proxyToWorker: boolean;
    output: {
        format: string;
        type: string;
    };
    progress?: ProgressCallback;
}

export type ProgressCallback = (step: string, current: number, total: number) => void;

export interface ProcessImageResult {
    image: HTMLImageElement;
    faceDetected: boolean;
    imageScaledUp: boolean;
}

export type StatusType = 'info' | 'error' | 'success';

