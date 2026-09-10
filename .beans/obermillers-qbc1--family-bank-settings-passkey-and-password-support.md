---
# obermillers-qbc1
title: 'Family bank settings: passkey and password support'
status: completed
type: feature
priority: normal
created_at: 2026-09-10T20:30:23Z
updated_at: 2026-09-10T20:42:04Z
---

## Problem

Family Bank settings needs passkey and password support so users can add/manage those credentials.

## Todos

- [x] See how other hub apps implement passkey/password settings
- [x] Add passkey and password support to Family Bank settings
- [x] Verify in the browser

## Summary of Changes

Family Bank settings can add a passkey and set a password. PocketBase gained `POST /api/account/password` so a logged-in user can set a password without knowing the OTP-generated one. Login also has a passkey option. Password save verified in the browser; passkey registration needs a real authenticator prompt.
