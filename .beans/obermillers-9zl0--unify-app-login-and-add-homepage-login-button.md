---
# obermillers-9zl0
title: Unify app login and add homepage login button
status: completed
type: feature
priority: normal
created_at: 2026-11-28T01:47:22Z
updated_at: 2026-11-28T01:53:23Z
---

- [x] Add a homepage login entry point and shared login screen across hub apps
- [x] Verify login flows, run check and build

## Summary of Changes

Added homepage login/logout controls and a shared /login page for Bank, Calendar, Grading, and Gift Cards. Login preserves app paths, queries, and fragments, rejects external or looping destinations, and keeps email-code, password, signup, reset, and passkey methods. Removed app-specific login screens and the unsupported Apple auth stub.

Validation: npm run check (66 tests) and npm run build passed. Headless Chrome verified desktop/mobile layout, homepage login/logout, all app redirects, Calendar entry point, password/reset controls, OTP persistence across reload, successful login return, and shared session. Browser backend responses were intercepted; no real email was sent.

- [x] Move homepage login to a light text link in the upper right and verify desktop/mobile layout

Follow-up: moved homepage login/logout to subtle light text links in the upper-right corner. Verified desktop and mobile position, no horizontal overflow, and navigation to shared login in Chrome. npm run check and npm run build passed.
