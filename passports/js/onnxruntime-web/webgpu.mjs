// Re-export WebGPU functionality from the main ONNX Runtime bundle
// The main bundle contains all execution providers including WebGPU
export * from './ort.min.mjs';
export { default } from './ort.min.mjs';

