# Passport Photo Tiler

The Passport Photo Tiler is the React route at `/passports`. It processes up to
six photos entirely in the browser, crops them to 2" × 2", optionally removes
their backgrounds, and produces a 4" × 6" JPEG sheet.

## Source

The authored application code is TypeScript:

- `src/passports/index.tsx` — React UI, processing pipeline, crop controls,
  tiling, and download
- `src/passports/cropImage.ts` — face/eye detection and passport crop math
- `src/passports/resizeImage.ts` — non-cropping resize path
- `src/passports/removeBackgroundImage.ts` — IMG.LY background-removal wrapper
- `src/passports/types.ts` — application and browser-global types

## Local runtime assets

This folder is copied into the production build so the application does not
depend on a CDN:

- `js/face-detection/` — vendored Haar face detection and eye tracking scripts
  adapted from the U.S. State Department passport tool
- `background-removal-assets/models/` — the `isnet_fp16` ONNX model, ONNX
  Runtime Web files, and `resources.json`
- `test/` — standalone face-detection test page

The background-removal implementation comes from the installed
`@imgly/background-removal` package. Its model path is configured as
`/passports/background-removal-assets/models/`.

## Development

From the repository root:

```bash
npm install
npm run dev
```

Then open `http://localhost:5173/passports`.

## Licenses

- `@imgly/background-removal`: AGPL-3.0
- ONNX Runtime Web: MIT
- Vendored face-detection scripts retain their upstream notices
