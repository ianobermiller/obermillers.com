---
# obermillers-lwcq
title: Stop bundling ONNX Runtime via Vite
status: completed
type: task
priority: normal
created_at: 2026-09-09T05:07:45Z
updated_at: 2026-09-09T05:10:28Z
---

The publish strip-plugin exists because we still import `@imgly/background-removal` (and thus onnxruntime-web) through Vite, which emits unused hashed wasm. Load IMG.LY at runtime from the CDN instead so Vite never sees ORT.

- [x] Runtime-import IMG.LY; keep only type imports from the npm package
- [x] Remove dropBundledOnnxRuntimeWasm and onnxruntime optimizeDeps
- [x] Confirm the production build has no ort-wasm and no bundled ort.bundle chunks
- [x] Confirm /passports still loads

## Summary of Changes

## Summary of Changes

Passports no longer imports `@imgly/background-removal` through Vite. The JS loads from jsDelivr at runtime (version taken from the installed package); models and ORT wasm stay on IMG.LY's CDN. The wasm strip-plugin is gone. Production `removeBackgroundImage` chunk is ~1.6KB with no `ort.bundle` or `.wasm` assets.
