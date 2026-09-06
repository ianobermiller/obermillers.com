---
# obermillers-xatm
title: Integrate Homes into the hub
status: todo
type: feature
created_at: 2026-09-06T01:18:12Z
updated_at: 2026-09-06T01:18:12Z
parent: obermillers-9zzf
---

Bring the home-search tracker into this Vite hub as an SPA. It is **not** on the family hub today. Today it is a standalone Vite + React app with InstantDB and a Vercel serverless `/api/enrich` (JSON-LD parse + OSRM distance to BNA).

## Source

- Local: `~/dev/personal/homes`
- GitHub: `ianobermiller/homes` (private)
- Stack: React 19 + Vite + InstantDB + Chicane + Leaflet; Vercel API; Playwright/vitest

## Work

- [ ] Port UI into `src/homes/` with Chicane + lazy route + SPA fallback + `.htaccess`
- [ ] Pick and keep a public URL (e.g. `/homes`); add hub link with `spa: true`
- [ ] Re-home `/api/enrich` (Vercel function cannot ride the Apache `obermillers.com` rsync as-is) — Cloudflare/worker, PocketBase hook, or keep a small Vercel endpoint and document why
- [ ] InstantDB auth, share links (`/?share=`), schema/perms (`instant-cli`) still work
- [ ] Tests: keep unit/e2e if they still make sense in the monorepo
- [ ] Match oxlint / oxfmt / knip / TypeScript 7
