---
# obermillers-hw6q
title: Copy the nfwavemakers beans workspace workflow
status: completed
type: task
priority: normal
created_at: 2026-10-24T01:36:18Z
updated_at: 2026-10-24T01:38:05Z
---

Bring the parallel-bean workspace workflow from nfwavemakers into this repo, adapted to the family hub: worktree scripts, land and dispatch skills, the session hook, and agent docs.

- [x] Add worktree:new, worktree:merge, and worktree:done
- [x] Add land-bean and dispatch skills
- [x] Add the beans-prime session hook
- [x] Document the workflow in AGENTS.md and docs/agents/issue-tracker.md
- [x] Ignore .agents/ worktrees

## Summary of Changes

Copied the nfwavemakers parallel-bean workspace workflow into this repo. `npm run worktree:new` creates `.agents/worktrees/<bean-id>` on `bean/<bean-id>`. `npm run worktree:merge` squash-lands onto main only after `npm run check` and `npm run build` pass, then removes the workspace. `/dispatch` and `/land-bean` skills, the session `beans prime` hook, and AGENTS.md describe the same flow. The main checkout keeps Vite on 5173 and PocketBase on 8090; a workspace dev server uses another port and that existing PocketBase.
