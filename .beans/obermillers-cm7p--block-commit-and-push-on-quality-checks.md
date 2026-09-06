---
# obermillers-cm7p
title: Block commit and push on quality checks
status: completed
type: task
priority: normal
created_at: 2026-09-06T03:51:41Z
updated_at: 2026-09-06T03:53:16Z
---

## Goal

Gate git with repo quality tools. Commit only checks changed files; push runs the full suite.

## Todos

- [x] Add pre-commit hook: typecheck, oxlint, and oxfmt on staged files
- [x] Add pre-push hook: typecheck, lint, fmt:check, and knip
- [x] Install hooks via npm prepare so clones pick them up
- [x] Verify hooks are executable and fail closed

## Summary of Changes

Added `.githooks/pre-commit` (oxfmt + oxlint on staged files, `tsc --noEmit` when any TypeScript is staged) and `.githooks/pre-push` (`npm run check`: typecheck, lint, fmt, knip). `npm prepare` runs `scripts/install-git-hooks.mjs` to set `core.hooksPath` and chmod the hooks. Bypass with `SKIP_GIT_HOOKS=1`.
