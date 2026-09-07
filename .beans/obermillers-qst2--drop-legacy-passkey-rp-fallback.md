---
# obermillers-qst2
title: Drop legacy passkey RP fallback
status: completed
type: task
priority: normal
created_at: 2026-09-07T01:11:27Z
updated_at: 2026-09-07T01:11:39Z
---

## Goal

Remove `legacyPasskeyRPID` and empty-RPID fallback; untagged credentials do not need compatibility.

## Todos

- [x] Delete the constant and treat stored RPID as-is

## Summary of Changes

Removed `legacyPasskeyRPID`. Passkeys match only on the stored RP ID.
