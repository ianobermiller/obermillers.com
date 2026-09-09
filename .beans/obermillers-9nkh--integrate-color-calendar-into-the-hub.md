---
# obermillers-9nkh
title: Integrate Color Calendar into the hub
status: completed
type: feature
priority: normal
created_at: 2026-09-06T01:18:12Z
updated_at: 2026-09-09T03:42:28Z
parent: obermillers-9zzf
---

Bring Color Calendar into this Vite hub as an SPA at **`/cal`** (keep that public URL). Hub already links to `/cal/` without `spa: true`. After cutover, drop the `cal` rsync exclude in `.github/workflows/publish.yml`.

## Source

- Local: `~/dev/personal/colorcal`
- GitHub: `ianobermiller/colorcal`
- Live: `https://obermillers.com/cal`
- Stack: React + Vite + PocketBase (`colorcal_*` on shared `users` OTP), Tailwind 4

## Work

- [x] Port into `src/cal/` (or equivalent) and wire Chicane + lazy `App.tsx` + `vite.config.ts` SPA paths + `.htaccess` rewrite
- [x] Hub `tools` entry: set `spa: true` (Color Calendar already listed)
- [x] InstantDB replaced by PocketBase (migrate with `npm run cal:migrate-instant`)
- [x] Ported to React (same as the rest of the hub)
- [x] Match oxlint / oxfmt / knip / TypeScript 7
- [x] Local OTP login works: `npm run dev` runs an SMTP sink (`scripts/localMailCatcher.mjs`) and points PocketBase at it, so codes print in the terminal
- [x] Update README on `ianobermiller/colorcal` to note the move into this repo (`src/cal/` in `ianobermiller/obermillers.com`) and push

## PocketBase cutover

- [x] Color Calendar collections + rules on the shared PocketBase (`colorcal_*`, same `users` OTP as Family Bank)
- [x] Replace Instant client usage with PocketBase (keep `/cal/:id` working via `urlId`)
- [x] Script to import Instant calendars/users into PocketBase
- [x] Drop `@instantdb/core` from the hub

## Summary of Changes

Color Calendar is a hub SPA at `/cal` (Chicane, Apache rewrites, `spa: true`). InstantDB is gone; data is PocketBase `colorcal_*` with shared `users` OTP. The `cal` rsync exclude is dropped. The old `ianobermiller/colorcal` README now points at `src/cal/` in this repo (commit `9ba5a5f` on `master`).
