---
# obermillers-5aeq
title: Integrate Family Bank into the hub
status: todo
type: feature
created_at: 2026-09-06T01:18:12Z
updated_at: 2026-09-06T01:18:12Z
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

- [ ] Port into `src/bank/` (or the chosen public path) with Chicane + lazy route + SPA fallback + `.htaccess`
- [ ] Add a hub link with `spa: true` (new tools entry)
- [ ] Keep PocketBase collections (`familybank_*`) and env (`VITE_POCKETBASE_URL`)
- [ ] Preact vs hub React: prefer one runtime; if keeping Preact, isolate the entry so the React hub still builds
- [ ] PWA / `vite-plugin-pwa` still works under the hub base path
- [ ] Match this repo’s lint/format/knip

Blocked by PocketBase import (`obermillers-ewfx`) so local PocketBase path is known.
