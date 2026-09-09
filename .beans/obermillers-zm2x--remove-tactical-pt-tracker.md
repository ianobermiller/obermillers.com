---
# obermillers-zm2x
title: Remove Tactical PT Tracker
status: completed
type: task
priority: normal
created_at: 2026-09-09T03:45:06Z
updated_at: 2026-09-09T05:04:33Z
---

The standalone workout timer at `/pt/` is unused. Remove the page, hub link, static-dir copy, and thumbnail so publish no longer ships it.

## Acceptance

- [ ] Delete `pt/`
- [ ] Remove the hub card
- [ ] Stop copying `/pt` into `dist`
- [ ] Drop thumbnail generation and `thumbnails/pt.webp`

## Summary of Changes

Removed the unused Tactical PT Tracker: deleted `pt/index.html` and `thumbnails/pt.webp`, dropped the hub Tools card, and stopped serving/copying `/pt` from Vite and the thumbnail script. `/pt` now hits the hub 404. Next publish with `--delete` will remove it from production.
