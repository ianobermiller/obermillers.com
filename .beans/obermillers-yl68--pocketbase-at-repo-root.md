---
# obermillers-yl68
title: PocketBase at repo root
status: todo
type: epic
created_at: 2026-09-06T01:17:40Z
updated_at: 2026-09-06T01:17:40Z
parent: obermillers-vjhk
---

Import `~/dev/personal/pocketbase` into this repo at the **root** (not under `src/`). This is a custom Go PocketBase with passkey routes, currently serving `https://pb.obermillers.com` on an Oracle ARM VM (`opc@129.213.88.91`).

Unlike the family SPAs, this is not part of the Vite hub. Keep the Go module, `deploy/`, and systemd/Caddy docs as a sibling of `src/` (e.g. `pocketbase/` at the monorepo root — confirm layout against the existing repo).

Family Bank’s local `npm run dev` currently expects this checkout at `~/dev/personal/pocketbase` (or `POCKETBASE_DIR`). After the move, update that path.

## Source

- Local: `~/dev/personal/pocketbase`
- Live: `pb.obermillers.com` → Caddy → PocketBase on `127.0.0.1:8090`
- Data stays on the VM (`/opt/pocketbase/pb_data`); do not commit `pb_data`

## Child work

- Import the source and keep local/dev docs working from this repo
- GitHub Action: build `linux-arm64` and deploy **only when PocketBase files changed** (path filters on push)
