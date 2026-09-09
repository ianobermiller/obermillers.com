---
# obermillers-69nh
title: Remove unused hub thumbnail pipeline
status: completed
type: task
priority: normal
created_at: 2026-09-09T05:30:10Z
updated_at: 2026-09-09T05:30:34Z
---

Hub home no longer shows page screenshots. Delete README-thumbnails.md, scripts/generate-thumbnails.ts, the thumbnails/ assets, the generate npm script, and the Vite static copy. Uninstall sharp if nothing else needs it.

- [x] Delete README-thumbnails.md, generate-thumbnails.ts, and thumbnails/
- [x] Drop `npm run generate` and Vite static copy of `thumbnails/`
- [x] Uninstall `sharp` (only the screenshot script used it; Puppeteer stays for Scanify)

## Summary of Changes

Removed the unused hub screenshot pipeline. The home page is icon links, so README-thumbnails.md, `scripts/generate-thumbnails.ts`, the `thumbnails/` WebPs, the `generate` npm script, and Vite’s copy of that directory are gone. `sharp` is uninstalled; Puppeteer remains for Scanify.
