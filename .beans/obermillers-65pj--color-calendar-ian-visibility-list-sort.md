---
# obermillers-65pj
title: 'Color calendar: Ian visibility + list sort'
status: completed
type: bug
priority: normal
created_at: 2026-09-12T18:55:00Z
updated_at: 2026-09-12T18:57:18Z
---

1) Determine if ian@obermillers.com should see Bardwells calendar (2vKz3Na4SgKUTtTXGVgaJQ). 2) Sort calendar list by calendar date.

- [x] Check PocketBase ownership of Bardwell (`2vKz3Na4SgKUTtTXGVgaJQ`)
- [x] Sort trip list by calendar start date (newest first)

## Summary of Changes

Ian **should** see Bardwell: it is owned by `ian@obermillers.com`, private (`isPubliclyVisible: false`), so list rules only return it to the owner. Jacob Bardwell's separate `Europe Trip` is not listed for Ian.

Trip list now sorts by `startDate` descending (then title), instead of `lastEdited`.
