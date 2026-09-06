---
# obermillers-9zzf
title: Integrate standalone SPAs into the family hub
status: todo
type: epic
priority: normal
created_at: 2026-09-06T01:17:40Z
updated_at: 2026-09-06T01:23:32Z
parent: obermillers-vjhk
---

Port Color Calendar, Family Bank, Homes, and Museums into this Vite + React hub the same way Recipes / Passports / Scanify work.

For each app:

- [ ] Bring source into `src/<name>/` (or a nested route if that matches the public URL)
- [ ] Add a Chicane route in `src/router.ts` and a lazy import in `src/App.tsx`
- [ ] SPA fallback in `vite.config.ts` (`isSpaPath`, `SPA_STATIC_DIRS`)
- [ ] Apache rewrite in `.htaccess` to `/index.html`
- [ ] Hub entry in `src/home/links.ts` with `spa: true`
- [ ] Align with this repo’s oxlint / oxfmt / knip / TypeScript 7
- [ ] Stop rsync-excluding the old live path once the SPA is served from `dist/` (today `.github/workflows/publish.yml` excludes `cal` and `museums`)
- [ ] Keep public URLs stable (`/cal/`, `/museums/`, etc.) or 301 from the old path
- [ ] If the app has its own GitHub repo, update that README to say it moved into this monorepo and link the new path; push that change

Stacks differ (Solid, Preact, Bun, Vercel API). Prefer matching the hub’s React + Vite setup; call out remaining backends (InstantDB, PocketBase, enrich APIs) in the child features.

Do not implement from this bean — work the child features.

## Local checkouts (canonical)

Copy from these directories. GitHub remotes are secondary.

- Color Calendar: `~/dev/personal/colorcal`
- Family Bank: `~/dev/personal/family-bank`
- Museums: `~/dev/personal/museums`
- Homes: `~/dev/personal/homes`
