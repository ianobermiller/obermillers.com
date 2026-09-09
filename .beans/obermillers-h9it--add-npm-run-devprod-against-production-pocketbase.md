---
# obermillers-h9it
title: Add npm run dev:prod against production PocketBase
status: todo
type: task
created_at: 2026-09-09T04:42:59Z
updated_at: 2026-09-09T04:42:59Z
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

- [ ] Add `dev:prod` script
- [ ] Point Vite at prod PocketBase without starting local PB
- [ ] Leave `npm run dev` on local PocketBase
