# Passport Photo Tiler

A web application for creating tiled passport photos ready for 4"×6" printing. Processes 1-6 images by removing backgrounds, detecting faces, cropping to US passport photo standards (2"×2" at 300 DPI), and arranging them in a 2×3 grid layout.

## Dependencies

### Human Library

**File:** `js/human.esm.js`
**Version:** 3.3.5
**Source:** https://github.com/vladmandic/human
**License:** MIT
**CDN:** https://cdn.jsdelivr.net/npm/@vladmandic/human@3.3.5/dist/human.esm.js
**Downloaded:** December 2024

The Human library is a comprehensive AI/ML library for face, body, hand, and object detection and analysis. It provides the face detection capabilities used in this application.

### Background Removal Library

**Package:** `@imgly/background-removal`
**Version:** 1.7.0
**Source:** https://github.com/imgly/background-removal-js
**License:** AGPL
**File:** `js/background-removal.js`
**Downloaded:** December 2024

The `@imgly/background-removal` library provides in-browser background removal capabilities. It uses ONNX models to remove backgrounds from images directly in the browser, ensuring data privacy and eliminating server costs.

**Model Files:** `background-removal-assets/models/`
- ONNX model files and WASM files are stored locally
- Downloaded from: https://staticimgly.com/@imgly/background-removal-data/1.7.0/package.tgz

### ONNX Runtime Web

**Package:** `onnxruntime-web`
**Version:** 1.21.0-dev.20250206-d981b153d3
**Files:** `js/onnxruntime-web/` and `onnxruntime-web/`
**Purpose:** Provides WebAssembly runtime for running ONNX models in the browser

## Models

All models are from the `@vladmandic/human-models` package (version 3.0.4) and are hosted locally to avoid CDN dependencies.

### BlazeFace (Face Detection)

**Files:** `models/blazeface.json`, `models/blazeface.bin`
**Original Source:** Google MediaPipe
**Converted By:** vladmandic (https://github.com/vladmandic)
**Purpose:** Face detection - identifies faces in images
**Used For:** Detecting faces for passport photo cropping
**License:** Apache 2.0 (MediaPipe)
**Source Repository:** https://github.com/google/mediapipe

### Face Mesh (Face Landmarks)

**Files:** `models/facemesh.json`, `models/facemesh.bin`
**Original Source:** Google MediaPipe
**Converted By:** vladmandic (https://github.com/vladmandic)
**Purpose:** Face mesh/landmarks detection - provides 468 3D face landmarks
**Used For:** Determining face position, eye level, and head size for passport photo standards
**License:** Apache 2.0 (MediaPipe)
**Source Repository:** https://github.com/google/mediapipe

## Model Usage

The following models are actively used:

- **BlazeFace**: Required for face detection (enabled in Human config)
- **Face Mesh**: Required for face landmarks (mesh enabled in Human config)

**Note:** Background removal is now handled by `@imgly/background-removal`, which uses its own ONNX models hosted by IMG.LY or can be configured to use custom-hosted models.

## License Compliance

This application uses open-source models and libraries:
- Human library: MIT License
- MediaPipe models: Apache 2.0 License
- @imgly/background-removal: AGPL License

All licenses are compatible with use in this application.

## Setup Instructions

All required files are included in the repository. The application is ready to use after cloning.

**Note:** The large binary files (~117 MB) are committed to git because they are required for the application to function when deployed. These files have been optimized from 87+ chunked files down to 6 combined files for easier management.

## Download Sources

Models and libraries were downloaded from:
- **Human Library:** https://cdn.jsdelivr.net/npm/@vladmandic/human@3.3.5/dist/human.esm.js
- **Human Models:** https://raw.githubusercontent.com/vladmandic/human-models/main/models/
- **Background Removal Library:** Copied from `node_modules/@imgly/background-removal/dist/index.mjs`
- **Background Removal Models:** https://staticimgly.com/@imgly/background-removal-data/1.7.0/package.tgz
- **ONNX Runtime Web:** Copied from `node_modules/onnxruntime-web/dist/`

## File Sizes

- `js/human.esm.js`: ~2.0 MB
- `models/blazeface.json`: ~77 KB
- `models/blazeface.bin`: ~526 KB
- `models/facemesh.json`: ~94 KB
- `models/facemesh.bin`: ~1.4 MB
- `js/background-removal.js`: ~167 KB
- `js/onnxruntime-web/`: ~34 MB (WASM files and runtime)
- `background-removal-assets/models/`: ~117 MB (combined ONNX model and assets)
  - `isnet_fp16.onnx`: ~84 MB (medium precision model for best quality)
  - `ort-wasm-simd-threaded.wasm`: ~11 MB
  - `ort-wasm-simd-threaded.jsep.wasm`: ~22 MB
  - `ort-wasm-simd-threaded.mjs`: ~25 KB
  - `ort-wasm-simd-threaded.jsep.mjs`: ~48 KB
  - `resources.json`: ~1.4 KB

**Total:** ~151 MB

**Note:** All files are hosted locally for longevity and offline use. The ONNX model files have been combined from chunked format into single files to reduce the number of files from 87+ chunks down to just 6 files. We use the `isnet_fp16` model (medium precision) for optimal balance between quality and file size.

