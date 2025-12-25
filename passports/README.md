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

The Human library is a comprehensive AI/ML library for face, body, hand, and object detection and analysis. It provides the face detection and segmentation capabilities used in this application.

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

### Selfie Segmentation

**Files:** `models/selfie.json`, `models/selfie.bin`  
**Original Source:** PINTO0309/PINTO_model_zoo (https://github.com/PINTO0309/PINTO_model_zoo/tree/main/109_Selfie_Segmentation)  
**Converted By:** vladmandic (https://github.com/vladmandic)  
**Purpose:** Person segmentation - creates a mask separating person from background  
**Used For:** Background removal - replacing backgrounds with white for passport photos  
**License:** Apache 2.0  
**Source Repository:** https://github.com/PINTO0309/PINTO_model_zoo

## Model Usage

All three models are actively used:

- **BlazeFace**: Required for face detection (enabled in Human config)
- **Face Mesh**: Required for face landmarks (mesh enabled in Human config)
- **Selfie Segmentation**: Required for background removal (segmentation enabled in Human config)

## License Compliance

This application uses open-source models and libraries:
- Human library: MIT License
- MediaPipe models: Apache 2.0 License
- PINTO model zoo model: Apache 2.0 License

All licenses are compatible with use in this application.

## Download Sources

Models were downloaded from:
- **GitHub Raw Content:** https://raw.githubusercontent.com/vladmandic/human-models/main/models/
- **Human Library:** https://cdn.jsdelivr.net/npm/@vladmandic/human@3.3.5/dist/human.esm.js

## File Sizes

- `js/human.esm.js`: ~2.0 MB
- `models/blazeface.json`: ~77 KB
- `models/blazeface.bin`: ~526 KB
- `models/facemesh.json`: ~94 KB
- `models/facemesh.bin`: ~1.4 MB
- `models/selfie.json`: ~82 KB
- `models/selfie.bin`: ~208 KB

**Total:** ~4.4 MB

