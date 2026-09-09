---
# obermillers-h9it
title: Add npm run dev:prod against production PocketBase
status: completed
type: task
priority: normal
created_at: 2026-09-09T04:42:59Z
updated_at: 2026-09-09T05:10:50Z
---

## Goal

Add a `dev:prod` npm script that starts the Vite app the same way as `npm run dev`, but talks to production PocketBase (`https://pb.obermillers.com`) instead of spinning up a local instance.

## Why

`npm run dev` always starts local PocketBase and forces `VITE_POCKETBASE_URL` to that local URL. That's right for most work, but sometimes you need to inspect or reproduce against real prod data without a production frontend build.

## Notes

- `scripts/dev.mjs` currently calls `ensureLocalPocketBase()` and overrides `VITE_POCKETBASE_URL`.
- Prod URL is already in `.env.production` as `VITE_POCKETBASE_URL`.
- `pb:setup:prod` already loads `.env` / `.env.local` for admin scripts — Vite should use the same prod URL, without starting local PB.
- Do not seed or mutate prod as part of the script. This is a read/write connection to live data; treat it accordingly.

## Acceptance

- `npm run dev:prod` runs Vite against prod PocketBase and does not start a local PocketBase.
- `npm run dev` is unchanged (local PB).

- [x] Add `dev:prod` script
- [x] Point Vite at prod PocketBase without starting local PB
- [x] Leave `npm run dev` on local PocketBase

## Summary of Changes

`npm run dev:prod` runs `scripts/dev.mjs --prod`: Vite in development mode with `VITE_POCKETBASE_URL=https://pb.obermillers.com`, and no local PocketBase, schema, or seed. `npm run dev` still starts local PB.
