---
# obermillers-nq6u
title: Speed up rsync publish
status: completed
type: task
priority: normal
created_at: 2026-09-09T05:01:25Z
updated_at: 2026-09-09T05:06:09Z
---

Rsync publish is slow because dist/ is ~338MB of mostly incompressible binaries over SSH to DreamHost.

- [x] Drop or skip rsync --compress for already-packed types
- [x] Stop publishing passports/test
- [x] Stop bundling a second ORT wasm into dist/assets
- [x] Do not ship the 84MB ONNX model in the rsync payload (CDN or on-demand)
- [x] Verify publish scripts/CI still deploy the site correctly

## Summary of Changes

`dist/` went from ~338MB to ~163MB. Dropped rsync `--compress` in publish.sh and CI. Stopped copying `passports/test` into dist. Deleted vendored IMG.LY models from the repo; Passports now uses the library CDN default. Vite no longer emits a hashed ORT wasm into `assets/`. Remaining bulk is mostly `resurrection-challenge/game` (~137MB), which still rsyncs but should skip after the first upload when mtimes match.
