---
# obermillers-otw2
title: Deploy PocketBase on push when it changed
status: todo
type: task
created_at: 2026-09-06T01:18:12Z
updated_at: 2026-09-06T01:18:12Z
parent: obermillers-yl68
blocked_by:
    - obermillers-ewfx
---

Add CI so a push to `main` rebuilds and deploys the custom PocketBase binary **only if PocketBase files changed** (path filter, not every hub frontend deploy).

Today deploy is manual (`make linux-arm64`, scp to the Oracle ARM VM, restart systemd). Live host: `pb.obermillers.com`. Do not use `pocketbase update` — that only works for the stock GitHub binary.

- [ ] Workflow path filter on the in-repo PocketBase tree (and Go module files)
- [ ] Build `linux-arm64` (CGO off)
- [ ] Install to `/opt/pocketbase/pocketbase` as user `pocketbase`, restart `pocketbase.service`
- [ ] Secrets: SSH key already used for the VM (`~/.ssh/oracle-pocketbase` locally); do not open 8090 to the internet
- [ ] Skip the job when the push only touches Vite/SPA paths

Blocked by importing the source first (`obermillers-ewfx`).
