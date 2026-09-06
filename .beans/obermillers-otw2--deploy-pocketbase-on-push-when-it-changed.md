---
# obermillers-otw2
title: Deploy PocketBase on push when it changed
status: completed
type: task
priority: normal
created_at: 2026-09-06T01:18:12Z
updated_at: 2026-09-06T01:32:48Z
parent: obermillers-yl68
blocked_by:
    - obermillers-ewfx
---

Add CI so a push to `main` rebuilds and deploys the custom PocketBase binary **only if PocketBase files changed** (path filter, not every hub frontend deploy).

Today deploy is manual (`make linux-arm64`, scp to the Oracle ARM VM, restart systemd). Live host: `pb.obermillers.com`. Do not use `pocketbase update` — that only works for the stock GitHub binary.

- [x] Workflow path filter on the in-repo PocketBase tree (and Go module files)
- [x] Build `linux-arm64` (CGO off)
- [x] Install to `/opt/pocketbase/pocketbase` as user `pocketbase`, restart `pocketbase.service`
- [x] Secrets: SSH key already used for the VM (`~/.ssh/oracle-pocketbase` locally); do not open 8090 to the internet
- [x] Skip the job when the push only touches Vite/SPA paths

Blocked by importing the source first (`obermillers-ewfx`).

## Summary of Changes

Added `.github/workflows/pocketbase.yml`: path filter on `pocketbase/**` (and the workflow file), `make linux-arm64` with CGO off, then scp/install as user `pocketbase` and restart `pocketbase.service` on `pb.obermillers.com`. PRs only build. `POCKETBASE_SSH_KEY` is set from `~/.ssh/oracle-pocketbase`. Frontend Publish ignores PocketBase-only pushes. Port 8090 is unchanged (loopback).
