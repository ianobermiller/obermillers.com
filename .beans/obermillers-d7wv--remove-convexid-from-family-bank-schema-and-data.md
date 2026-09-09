---
# obermillers-d7wv
title: Remove convexId from family bank schema and data
status: completed
type: task
priority: normal
created_at: 2026-09-07T01:25:10Z
updated_at: 2026-09-09T05:10:28Z
---

Leftover Convex import keys on Family Bank PocketBase collections. Drop `convexId` from schema and records once the import is done.

- [x] Confirm `convexId` on production `familybank_*` collections
- [x] Stop preserving `convexId` in PocketBase schema apply
- [x] Apply to production so the field and values are gone
- [x] Confirm records no longer expose `convexId`

## Summary of Changes

Production Family Bank collections still had leftover Convex import keys (`convexId` on all 4 accounts, 6 presets, and 443 transactions). Schema apply used to merge existing fields, so those keys never went away.

`scripts/setup-pocketbase.mjs` now drops `convexId` on collection update. `npm run pb:setup:prod` applied that: the field is gone from schema and records; counts are unchanged.
