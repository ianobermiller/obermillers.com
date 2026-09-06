---
# obermillers-wf07
title: Set up beans issue tracker
status: completed
type: task
priority: normal
created_at: 2026-09-06T01:14:54Z
updated_at: 2026-09-06T01:14:57Z
---

Initialize Beans (https://github.com/hmans/beans) in this repo so humans and coding agents can track work as markdown files alongside the code.

- [x] Run `beans init`
- [x] Add AGENTS.md and Cursor rule that run `beans prime`

## Summary of Changes

Initialized Beans in this repo (CLI already installed via Homebrew). Tracked files: `.beans.yml`, `.beans/`, `AGENTS.md`, and `.cursor/rules/beans.mdc` so agents run `beans prime` at the start of a session.
