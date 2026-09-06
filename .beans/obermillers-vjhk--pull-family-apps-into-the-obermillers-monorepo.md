---
# obermillers-vjhk
title: Pull family apps into the obermillers monorepo
status: todo
type: milestone
priority: normal
created_at: 2026-09-06T01:17:20Z
updated_at: 2026-09-06T01:21:25Z
---

Bring the remaining family tools into this repo so they share the hub, tooling, and publish pipeline.

- **PocketBase** lives at the **repo root** (Go backend, not a Vite SPA). Deploy the binary on push **only when that tree changed**.
- **SPAs** (Color Calendar, Family Bank, Homes, Museums) should be wired like Recipes / Passports / Scanify: Chicane route, lazy page in `App.tsx`, Vite static dirs, Apache rewrite in `.htaccess`, hub link with `spa: true`.

Child epics own the actual work. Do not implement from this bean.

## Local checkouts (canonical)

- PocketBase: `~/dev/personal/pocketbase` (repo root, not a Vite SPA)
- Color Calendar: `~/dev/personal/colorcal`
- Family Bank: `~/dev/personal/family-bank`
- Museums: `~/dev/personal/museums`
- Homes: `~/dev/personal/homes`
