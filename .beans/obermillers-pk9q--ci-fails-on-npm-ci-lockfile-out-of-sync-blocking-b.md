---
# obermillers-pk9q
title: 'CI fails on npm ci: lockfile out of sync, blocking bank deploy'
status: completed
type: bug
priority: high
created_at: 2026-09-09T03:44:59Z
updated_at: 2026-09-09T03:57:44Z
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
- [x] Commit and push the lockfile fix
- [x] Confirm CI goes green and the publish job deploys

## Summary of Changes

Regenerated package-lock.json using npm 11.19.0, the version bundled with Node 24.20 on the runner. Local npm 11.6.2 resolved the tree happily and reported `up to date`, so the lockfile could only be repaired by running the CI npm version via `npx npm@11.19.0 install --package-lock-only`.

The diff added the two missing optional entries (@emnapi/core@1.11.3, @emnapi/runtime@1.11.3) and cleared stale `peer`/`dev` metadata flags. No dependency version changed.

Verified `npm ci` succeeds under both npm 11.19.0 and 11.6.2, and ran the full check suite plus a production build locally before pushing.

CI run 34308461818 went green on all five checks and the publish job deployed for the first time since Sept 6. Confirmed live: /, /bank, and /cal all return 200, and the deployed HTML references index-B5Iagibq.js, matching the local build hash.

Follow-up: the first successful deploy exposed that rsync --delete was wiping the server .well-known webroot, tracked and fixed in obermillers-uqd3.
