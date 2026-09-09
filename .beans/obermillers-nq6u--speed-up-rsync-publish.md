---
# obermillers-nq6u
title: Speed up rsync publish
status: in-progress
type: task
created_at: 2026-09-09T05:01:25Z
updated_at: 2026-09-09T05:01:25Z
---

Rsync publish is slow because dist/ is ~338MB of mostly incompressible binaries over SSH to DreamHost.

- [ ] Drop or skip rsync --compress for already-packed types
- [ ] Stop publishing passports/test
- [ ] Stop bundling a second ORT wasm into dist/assets
- [ ] Do not ship the 84MB ONNX model in the rsync payload (CDN or on-demand)
- [ ] Verify publish scripts/CI still deploy the site correctly

## Summary of Changes
