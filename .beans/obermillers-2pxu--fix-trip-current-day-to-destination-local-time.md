---
# obermillers-2pxu
title: Fix trip current day to destination local time
status: completed
type: bug
priority: normal
created_at: 2026-09-19T07:10:52Z
updated_at: 2026-09-19T07:49:32Z
---

Current-day highlighting on the 2026 trip page uses a single Europe/Paris calendar date, so it is often a day ahead while traveling (especially in Morocco). Use each day's destination timezone, and fill completed day-number circles.

- [x] Compute “today” from destination local time, not a fixed Paris TZ / Eastern trip bounds
- [x] Fill completed day circles with the day number still visible
- [x] Verify itinerary “We are here” and trip status stay in sync

- [x] Make day circles truly round and center lining (not oldstyle) numerals

## Summary of Changes

Current day is now the itinerary date in that day’s destination timezone (not a single Paris clock). Completed day discs fill with lining numerals, sized 1:1 so they stay round.
