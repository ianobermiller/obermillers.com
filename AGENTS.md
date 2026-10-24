**IMPORTANT**: before you do anything else, run the `beans prime` command and heed its output.

## Project

obermillers is the family hub at obermillers.com (Vite + React, `npm run build` into `dist/`) with PocketBase in `pocketbase/`.

## Work tracking

- **Always use beans instead of TodoWrite** for task tracking in this repo.
- Before starting work, check for an existing bean (`beans list --json --ready`, then `beans show --json <id>`). If none covers the task, create one with `beans create` before writing code.
- Mark beans `in-progress` while working; `completed` when done with a `## Summary of Changes` section.
- Include bean IDs in commit messages.
- When asked to add a bean, commit it right away in its own commit containing only the new bean file. A workspace branches from `main`, so an uncommitted bean is invisible there.
- One bean per workspace; respect `--blocked-by` dependencies.

## Workspaces for parallel bean work

The main checkout stays on `main`. Agents never edit, build, or commit in the main checkout — the only commands an agent runs there are the workspace scripts. Each bean gets a git worktree so several can run at once.

- **Start**: `npm run worktree:new -- <bean-id>` creates `.agents/worktrees/<bean-id>` on branch `bean/<bean-id>`, installs dependencies, and marks the bean in-progress inside the workspace.
- **Work** entirely inside that directory. Commits include the bean file and the bean id.
- **Verify**: `npm run check` and `npm run build` in the workspace. The main checkout owns Vite on port 5173 and PocketBase on 8090. A workspace dev server must use another port (`VITE_POCKETBASE_URL=http://127.0.0.1:8090 npx vite --port 0`) and must not start a second PocketBase.
- **Land**: when landing a bean on `main`, run `npm run worktree:merge -- <bean-id>` from the main checkout — never raw `git merge` / `git commit`. It creates one squash commit, refuses to commit until `npm run check` and `npm run build` pass, then removes the workspace and branch. If verification fails, the workspace stays; fix the staged tree and finish with `npm run worktree:merge -- <bean-id> --commit-only`. `git reset --hard HEAD` abandons the staged merge. The `land-bean` skill (`.cursor/skills/land-bean`) does this when asked to merge or land — do not wait for a separate cleanup request.
- **Abandon**: `npm run worktree:done -- <bean-id> [--force]` removes a workspace you are not landing. `--force` discards an unmerged branch and uncommitted workspace files.
- **Fan out**: the `/dispatch` skill (`.cursor/skills/dispatch`) picks ready beans, shows the numbered selection, and waits for a swap-or-continue answer before running this workflow with one background subagent per bean.

## Issue tracker

Issues live in Beans (markdown in `.beans/`). See `docs/agents/issue-tracker.md`.
