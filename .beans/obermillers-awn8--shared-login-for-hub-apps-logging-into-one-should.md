---
# obermillers-awn8
title: Shared login for hub apps
status: completed
type: task
priority: normal
created_at: 2026-09-09T03:52:35Z
updated_at: 2026-09-09T05:21:42Z
---

- Logging into one should login to all
- Shared login page component that can be re-used across apps and restyled to match

## Todos

- [x] Shared PocketBase auth client and session hook
- [x] Reusable login form with restyle slots
- [x] Wire Family Bank and Color Calendar to the shared form
- [x] Verify both login screens still render in their own look

## Summary of Changes

Family Bank and Color Calendar now share one PocketBase client, OTP storage key, and restylable LoginForm. Signing into one app authenticates the other. Auth actions are named exports rather than an authClient namespace object.
