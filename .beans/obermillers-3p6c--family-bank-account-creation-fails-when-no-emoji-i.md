---
# obermillers-3p6c
title: Family bank account creation fails when no emoji is picked
status: completed
type: bug
priority: normal
created_at: 2026-09-06T03:06:32Z
updated_at: 2026-09-06T03:08:08Z
---

Creating an account POSTs emoji: "" but the PocketBase familybank_accounts.emoji field is required, so the request 400s with validation_required. The failure is also invisible in the UI because useForm fires onSubmit with `void`, leaving an unhandled rejection.

- [x] Default the emoji so forms never submit a blank value
- [x] Surface async submit failures in the form instead of an unhandled rejection

## Summary of Changes

- `accountEmojis.ts`: added `DEFAULT_ACCOUNT_EMOJI` (`😀`, part of the curated list so the picker highlights it).
- `schemas.ts`: `ACCOUNT_SCHEMA.emoji` now falls back to the default when trimmed empty, so `createAccount`/`updateAccount`/`updateAppearance` never send a blank required field.
- `EmojiPicker.tsx`: seeds state from the default when no `defaultValue` is given, so new-account forms show the emoji that will be saved.
- `useForm.tsx`: awaits `onSubmit` and renders the failure via `pbMessage` instead of leaving an unhandled promise rejection.
- `pb.ts`: `pbMessage` now prefixes PocketBase field errors with the field name (`emoji: Cannot be blank.`).
