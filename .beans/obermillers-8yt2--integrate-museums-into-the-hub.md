---
# obermillers-8yt2
title: Integrate Museums into the hub
status: in-progress
type: feature
priority: normal
created_at: 2026-09-06T01:18:12Z
updated_at: 2026-09-09T05:38:21Z
parent: obermillers-9zzf
---

Bring Museum Reciprocity into this Vite hub as an SPA at **`/museums`**. Hub already links to `/museums/` without `spa: true`. After cutover, drop the `museums` rsync exclude in `.github/workflows/publish.yml`.

## Source

- Local: `~/dev/personal/museums`
- GitHub: `ianobermiller/museum-reciprocity`
- Live: `https://obermillers.com/museums/`
- Stack: Bun + React 19 + Tailwind + Leaflet (not Vite today)

## Work

- [x] Port into `src/museums/` on this repo’s Vite + React pipeline (drop Bun as the bundler)
- [x] Chicane + lazy `App.tsx` + `vite.config.ts` SPA paths + `.htaccess` rewrite
- [x] Hub `tools` entry: set `spa: true`
- [x] Keep ASTC/AZA data (`src/museums/data/`)
- [x] Match oxlint / oxfmt / knip / TypeScript 7
- [ ] Update README on `ianobermiller/museum-reciprocity` to note the move into this repo (path once known) and push
