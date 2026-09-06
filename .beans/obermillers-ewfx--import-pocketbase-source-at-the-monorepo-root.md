---
# obermillers-ewfx
title: Import PocketBase source at the monorepo root
status: todo
type: task
priority: normal
created_at: 2026-09-06T01:17:47Z
updated_at: 2026-09-06T01:23:32Z
parent: obermillers-yl68
---

Copy the custom PocketBase Go project from `~/dev/personal/pocketbase` into this repo at the **root** (suggested: `pocketbase/` next to `src/`, not under the Vite app).

- [ ] Bring in Go module, passkey routes, `deploy/` (Caddy, systemd, setup.sh), Makefile / linux-arm64 build
- [ ] Gitignore `pb_data` and other runtime data; data stays on the Oracle VM
- [ ] Point Family Bank local scripts at the in-repo path (today `~/dev/personal/pocketbase` or `POCKETBASE_DIR`)
- [ ] Preserve SSH/deploy docs for `opc@129.213.88.91` / `pb.obermillers.com`
- [ ] If PocketBase has its own GitHub repo, update that README to note the move into this repo and push (local checkout currently has no `origin`)

Do not add GitHub deploy in this bean — that is the sibling deploy task.
