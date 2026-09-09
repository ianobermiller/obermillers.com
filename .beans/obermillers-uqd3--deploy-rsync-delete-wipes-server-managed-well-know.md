---
# obermillers-uqd3
title: Deploy rsync --delete wipes server-managed .well-known
status: completed
type: bug
priority: high
created_at: 2026-09-09T03:53:10Z
updated_at: 2026-09-09T05:07:02Z
---

## Problem

The publish rsync uses `--delete` but did not exclude `.well-known`, so deploying removed the certbot webroot on the server. Observed in CI run 34308461818:

```
deleting .well-known/acme-challenge/
deleting .well-known/
```

`.well-known/acme-challenge/` is the Let's Encrypt HTTP-01 webroot. It is server-managed and never built from this repo, so every deploy destroyed it. It happened to be empty at the time, so no in-flight challenge token was lost, but a deploy landing mid-renewal would have broken certificate renewal.

## Fix

Added `--exclude='.well-known'` to both rsync call sites (.github/workflows/publish.yml and publish.sh).

The pattern is deliberately left unanchored (no leading slash) so it matches at any depth. The repo ships an empty `2024/.well-known/acme-challenge/` placeholder, and an anchored `/.well-known` would protect only the root copy while leaving the 2024 webroot exposed to `--delete`. Unanchored protects both. Since `--delete-excluded` is not used, excluded paths are preserved on the server, and the only thing skipped on upload is an empty placeholder directory.

Verified with a local rsync against a fixture containing challenge tokens at both root and 2024 depth: no deletions, both tokens survived.

## Todo

- [x] Exclude .well-known in .github/workflows/publish.yml
- [x] Exclude .well-known in publish.sh
- [x] Verify excluded paths survive --delete
- [ ] Confirm the root .well-known/acme-challenge/ is restored on the server

## Verification

Shipped in commit b179d1f. CI run 34308863790 deployed with zero deletions of any kind, and zero .well-known deletions specifically (previous run 34308461818 had deleted .well-known/ and .well-known/acme-challenge/).

Still open: confirming the root .well-known/acme-challenge/ directory exists again on the server. Certbot webroot recreates it on the next renewal attempt, so this is expected to self-heal, but it is worth an explicit check since a renewal between the destructive deploy and the recreation would fail. Needs shell access on the host; the deploy key is a CI secret and is not available locally.
