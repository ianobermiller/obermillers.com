---
# obermillers-pk9q
title: 'CI fails on npm ci: lockfile out of sync, blocking bank deploy'
status: in-progress
type: bug
priority: high
created_at: 2026-09-09T03:44:59Z
updated_at: 2026-09-09T03:46:57Z
---

## Problem

Every CI job fails at the shared `Set up Node` composite action (`npm ci`) with:

```
npm error `npm ci` can only install packages when your package.json and package-lock.json are in sync.
npm error Missing: @emnapi/runtime@1.11.3 from lock file
npm error Missing: @emnapi/core@1.11.3 from lock file
```

Because the `publish` job in .github/workflows/ci.yml has `needs: [typecheck, lint, fmt, knip, test]`, all five failing means the rsync deploy never runs. The Family Bank and /cal updates on main have therefore never been published to obermillers.com.

## Root cause

`@tailwindcss/oxide-wasm32-wasi` is an optional, wasm32-only package that lists `@emnapi/core: ^1.11.1` and `@emnapi/runtime: ^1.11.1` as bundled dependencies. The lockfile was generated on macOS arm64 where that optional package is skipped, so those entries were never written as top-level lock entries (only 1.11.2 copies nested under @oxc-resolver/binding-wasm32-wasi). Now that 1.11.3 is published, npm on the Linux runner resolves the range to 1.11.3, finds it absent from the lock, and refuses.

## Todo

- [x] Regenerate package-lock.json with npm install
- [x] Verify npm ci succeeds against the regenerated lock
- [x] Run the full check suite locally (typecheck, lint, fmt, knip, test)
- [ ] Commit and push the lockfile fix
- [ ] Confirm CI goes green and the publish job deploys
