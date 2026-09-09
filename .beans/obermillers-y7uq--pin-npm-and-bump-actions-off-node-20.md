---
# obermillers-y7uq
title: Pin npm and bump Actions off Node 20
status: in-progress
type: task
priority: high
created_at: 2026-09-09T03:59:49Z
updated_at: 2026-09-09T04:00:15Z
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
- [ ] Confirm CI no longer warns about Node 20
