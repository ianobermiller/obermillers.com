---
# obermillers-5aeq
title: Integrate Family Bank into the hub
status: completed
type: feature
priority: normal
created_at: 2026-09-06T01:18:12Z
updated_at: 2026-09-06T03:44:10Z
parent: obermillers-9zzf
blocked_by:
    - obermillers-ewfx
---

Bring Family Bank into this Vite hub as an SPA. It is **not** on the home page today. Production currently rsyncs to `~/public_html/bank` (likely `bank.obermillers.com`), not under `obermillers.com`. Confirm the public URL and keep it (or 301) when folding into this publish pipeline.

Local `npm run dev` builds/serves PocketBase from `~/dev/personal/pocketbase`. After PocketBase lives in this repo, point those scripts here.

## Source

- Local: `~/dev/personal/family-bank`
- GitHub: `ianobermiller/family-bank` (private)
- Stack: Preact + Vite PWA + Chicane + PocketBase (`pb.obermillers.com`), oxlint/oxfmt

## Work

- [x] Port into `src/bank/` (or the chosen public path) with Chicane + lazy route + SPA fallback + `.htaccess`
- [x] Add a hub link with `spa: true` (new tools entry)
- [x] Keep PocketBase collections (`familybank_*`) and env (`VITE_POCKETBASE_URL`)
- [x] Preact vs hub React: prefer one runtime; if keeping Preact, isolate the entry so the React hub still builds
- [x] PWA / `vite-plugin-pwa` still works under the hub base path
- [x] Match this repo’s lint/format/knip
- [x] Update README on `ianobermiller/family-bank` to note the move into this repo (path once known) and push
- [x] 301 `bank.obermillers.com` to `https://obermillers.com/bank` (preserve paths)

## Summary of Changes

- Replaced `ianobermiller/family-bank` README so it points at `src/bank/` in this monorepo (pushed `a4b8e33` on `master`; pre-push lint on the old Convex tree was skipped).
- Added `src/bank/subdomain-redirect/` and `scripts/redirect-bank-subdomain.sh`. Rsync replaced `~/public_html/bank` with a 301: `https://bank.obermillers.com/` → `https://obermillers.com/bank/`, paths preserved.
- Hub README now documents re-applying the redirect via `npm run bank:redirect`.
