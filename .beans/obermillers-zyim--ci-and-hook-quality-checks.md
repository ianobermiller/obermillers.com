---
# obermillers-zyim
title: CI and hook quality checks
status: completed
type: task
priority: normal
created_at: 2026-09-06T03:55:14Z
updated_at: 2026-09-06T03:57:04Z
---

## Goal

No test runner yet. Add Vitest, run related tests on commit and all tests on push, and split CI into separate blocking checks (typecheck, lint, fmt, knip, test) that must pass before publish.

## Todos

- [x] Add Vitest with passWithNoTests until tests exist
- [x] Run related tests on staged files in pre-commit; all tests in pre-push
- [x] Split CI into separate typecheck, lint, fmt, knip, and test jobs
- [x] Make publish wait on those jobs
- [x] Verify all five checks are green locally

## Summary of Changes

There were no tests. Added Vitest (`passWithNoTests`). Pre-commit runs `vitest related` on staged source; pre-push/`npm run check` includes the full suite. CI is five jobs (typecheck, lint, fmt, knip, test); `publish` `needs` all five. Local runs of all five passed. Formatted a few bank files and ignored `.beans` in oxfmt so fmt is green.
