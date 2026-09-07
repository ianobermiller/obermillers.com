---
# obermillers-g965
title: Admin-editable auth applications
status: completed
type: feature
priority: normal
created_at: 2026-09-07T01:08:06Z
updated_at: 2026-09-07T01:11:05Z
---

## Goal

Store WebAuthn relying parties and per-domain OTP subjects in a PocketBase `applications` collection so they can be changed in the Admin UI without rebuilding.

## Todos

- [x] Add locked `applications` collection with seed records
- [x] Load passkey RPs and OTP subjects from that collection
- [x] Unit-test domain matching and OTP subjects
- [x] Update PocketBase README

## Summary of Changes

Added a superuser-only `applications` collection (domain, name, otp_subject, passkeys_enabled). First boot seeds the current three domains. Passkey RP lookup and OTP subjects read from that collection, so later changes are Admin UI only.
