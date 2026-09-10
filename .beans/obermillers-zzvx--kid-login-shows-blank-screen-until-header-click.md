---
# obermillers-zzvx
title: Kid login shows blank screen until header click
status: completed
type: bug
priority: normal
created_at: 2026-09-10T20:30:23Z
updated_at: 2026-09-10T20:41:57Z
---

## Problem

When a kid logs into Family Bank, they get a blank screen and have to click the header before content appears.

## Todos

- [x] Reproduce / inspect kid login routing and auth gate
- [x] Fix so the account list (or kid home) renders immediately after login
- [x] Verify in the browser

## Summary of Changes

Kids with one account no longer hit a render-time `Router.replace` that returned `null` (blank until the header was clicked). `/bank` now renders the account list, and a single-account kid sees their account immediately while the URL updates in `useLayoutEffect`.
