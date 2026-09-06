---
# obermillers-ewfx
title: Import PocketBase source at the monorepo root
status: completed
type: task
priority: normal
created_at: 2026-09-06T01:17:47Z
updated_at: 2026-09-06T01:31:02Z
parent: obermillers-yl68
---

Copy the custom PocketBase Go project from `~/dev/personal/pocketbase` into this repo at the **root** (suggested: `pocketbase/` next to `src/`, not under the Vite app).

- [x] Bring in Go module, passkey routes, `deploy/` (Caddy, systemd, setup.sh), Makefile / linux-arm64 build
- [x] Gitignore `pb_data` and other runtime data; data stays on the Oracle VM
- [x] Point Family Bank local scripts at the in-repo path — deferred until Family Bank is migrated into this repo
- [x] Preserve SSH/deploy docs for `opc@129.213.88.91` / `pb.obermillers.com`
- [x] If PocketBase has its own GitHub repo, update that README to note the move into this repo and push (local checkout currently has no `origin`) — N/A, no origin

Do not add GitHub deploy in this bean — that is the sibling deploy task.

## Summary of Changes

Imported the custom Go PocketBase into `pocketbase/` at the monorepo root (Go module, passkey routes, deploy/Caddy/systemd, Makefile). Gitignored `pb_data` and the built binary. SSH/deploy docs for `pb.obermillers.com` are in `pocketbase/README.md` and `pocketbase/deploy/instance.md`. The old PocketBase checkout has no GitHub remote. Family Bank still points at `~/dev/personal/pocketbase` until it is migrated into this repo. GitHub Action deploy is left to `obermillers-otw2`.
