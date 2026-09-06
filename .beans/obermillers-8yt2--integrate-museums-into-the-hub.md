---
# obermillers-8yt2
title: Integrate Museums into the hub
status: todo
type: feature
created_at: 2026-09-06T01:18:12Z
updated_at: 2026-09-06T01:18:12Z
parent: obermillers-9zzf
---

Bring Museum Reciprocity into this Vite hub as an SPA at **`/museums`**. Hub already links to `/museums/` without `spa: true`. After cutover, drop the `museums` rsync exclude in `.github/workflows/publish.yml` and stop fetching that URL from the live site in thumbnail generation (`README-thumbnails.md` / `scripts/generate-thumbnails.ts`).

## Source

- Local: `~/dev/personal/museums`
- GitHub: `ianobermiller/museum-reciprocity`
- Live: `https://obermillers.com/museums/`
- Stack: Bun + React 19 + Tailwind + Leaflet (not Vite today)

## Work

- [ ] Port into `src/museums/` on this repo’s Vite + React pipeline (drop Bun as the bundler)
- [ ] Chicane + lazy `App.tsx` + `vite.config.ts` SPA paths + `.htaccess` rewrite
- [ ] Hub `tools` entry: set `spa: true`
- [ ] Keep ASTC/AZA data (`src/data/` in the source repo)
- [ ] Match oxlint / oxfmt / knip / TypeScript 7
