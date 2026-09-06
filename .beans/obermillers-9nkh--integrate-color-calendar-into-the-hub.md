---
# obermillers-9nkh
title: Integrate Color Calendar into the hub
status: todo
type: feature
created_at: 2026-09-06T01:18:12Z
updated_at: 2026-09-06T01:18:12Z
parent: obermillers-9zzf
---

Bring Color Calendar into this Vite hub as an SPA at **`/cal`** (keep that public URL). Hub already links to `/cal/` without `spa: true`. After cutover, drop the `cal` rsync exclude in `.github/workflows/publish.yml`.

## Source

- Local: `~/dev/personal/colorcal`
- GitHub: `ianobermiller/colorcal`
- Live: `https://obermillers.com/cal`
- Stack: SolidJS + Vite + InstantDB (`@instantdb/core`), Tailwind 4

## Work

- [ ] Port into `src/cal/` (or equivalent) and wire Chicane + lazy `App.tsx` + `vite.config.ts` SPA paths + `.htaccess` rewrite
- [ ] Hub `tools` entry: set `spa: true` (Color Calendar already listed)
- [ ] InstantDB env/schema stays working (`instant-cli` / existing app)
- [ ] Solid vs hub React: either nest a Solid island/entry or port to React — pick the smaller honest path and document it
- [ ] Match oxlint / oxfmt / knip / TypeScript 7
