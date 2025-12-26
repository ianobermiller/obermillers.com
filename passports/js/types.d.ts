/**
 * Type definitions for passport photo processing
 */

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

export interface HumanFaceBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

export type FaceBoxInput = [number, number, number, number] | HumanFaceBox;

export type MeshLandmark = [number, number] | { x: number; y: number };

export interface HumanFace {
    score: number;
    box?: FaceBoxInput;
    mesh?: MeshLandmark[];
}

export interface HumanDetectionResult {
    face?: HumanFace[];
}

export interface HumanConfig {
    backend: string;
    modelBasePath: string;
    face: {
        enabled: boolean;
        detector: {
            rotation: boolean;
            return: boolean;
            minConfidence: number;
            maxDetections: number;
        };
        mesh: { enabled: boolean };
        iris: { enabled: boolean };
        emotion: { enabled: boolean };
        description: { enabled: boolean };
    };
    body: { enabled: boolean };
    hand: { enabled: boolean };
    object: { enabled: boolean };
}

export interface HumanInstance {
    detect(img: HTMLImageElement, userConfig?: unknown): Promise<HumanDetectionResult>;
    load(userConfig?: unknown): Promise<void>;
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

