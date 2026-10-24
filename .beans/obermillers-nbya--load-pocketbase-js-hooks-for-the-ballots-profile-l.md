---
# obermillers-nbya
title: Load PocketBase JS hooks for the ballots profile link
status: completed
type: task
priority: high
created_at: 2026-10-24T00:31:49Z
updated_at: 2026-10-24T00:32:55Z
---

The ballots admin link-profile route lives in pb_hooks, but the custom PocketBase binary never registered the JSVM plugin, so the hook did not load. A binary was then built from the stale ~/dev/personal/pocketbase checkout and deployed, dropping applications, account, and OTP mail.

Register JSVM in this tree, keep already-applied pb_migrations from being evaluated again, rebuild the linux/arm64 binary, and redeploy it to pb.obermillers.com.

- [x] Register the JSVM plugin in pocketbase/main.go without re-running applied JS migrations
- [x] Rebuild and redeploy the arm64 binary from this repo
- [x] Confirm health, the account route, and the ballots link-profile hook

## Summary of Changes

Registered the JSVM plugin in pocketbase/main.go so pb_hooks load, with migrations pointed at a missing directory so already-applied JS migrations are not evaluated again. Rebuilt the linux/arm64 binary from this repo and deployed it to pb.obermillers.com. Health is ok, /api/account/password and /api/ballots/link-profile both require auth, and linking Wellington returns the existing student profile.
