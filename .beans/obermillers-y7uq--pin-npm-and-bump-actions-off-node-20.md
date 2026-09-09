---
# obermillers-y7uq
title: Pin npm and bump Actions off Node 20
status: completed
type: task
priority: high
created_at: 2026-09-09T03:59:49Z
updated_at: 2026-09-09T04:05:58Z
---

## Problem

CI warns that actions/checkout@v4 and actions/setup-node@v4 still target Node 20. GitHub is forcing those onto Node 24 and will drop Node 20 from runners.

Separately, lockfile generation is npm-version-sensitive: local npm 11.6.2 vs the runner's bundled 11.19.0 produced a lockfile CI could not install. Node 24.x updates will keep shipping a newer npm, so this will happen again unless we pin npm independently of Node.

## Approach

- Bump checkout and setup-node to v5 (Node 24 action runtime).
- Add package.json `packageManager` so Corepack pins an exact npm.
- Activate that npm in the shared setup-node action before `npm ci`.

## Todo

- [x] Bump GitHub Actions to Node 24 runtimes
- [x] Pin npm via packageManager and Corepack in CI
- [x] Confirm CI no longer warns about Node 20

## Summary of Changes

Bumped `actions/checkout` and `actions/setup-node` from v4 to v5 (Node 24 action runtime), including PocketBase checkout. Added `packageManager: npm@11.19.0` and `engines.npm >=11.19.0`. The shared setup-node action now runs Corepack to activate that npm before `npm ci`.

CI run 34309282412 succeeded with no Node 20 annotations. Setup logs show `Preparing npm@11.19.0 for immediate activation` and `npm --version` 11.19.0.

## Local activation

- [x] Enable Corepack and activate npm@11.19.0 locally
- [x] Commit remaining bean updates and push; confirm CI

Local nvm Node 24.11.1 still had npm 11.6.2 because `corepack enable` does not install the npm shim; `corepack enable npm` is required. After that, `npm -v` is 11.19.0 and `npm ci --dry-run` succeeds. The setup-node action now also runs `corepack enable npm` so CI and local use the same shims. Note: `nvm install`/`nvm use` of a fresh Node will restore the bundled npm symlink and this must be re-run.
