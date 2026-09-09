---
# obermillers-sj5w
title: Stale out-of-range day records inflate Color Calendar counts
status: completed
type: bug
priority: high
created_at: 2026-09-09T04:52:30Z
updated_at: 2026-09-09T04:54:07Z
---

## Symptom

Dev, `parent@example.com`, "Trip to Atlanta": place "Ian in CA" shows `8n` where the trip only contains 3 nights.

## Cause

Shrinking or moving a calendar's date range leaves the old `colorcal_days` records behind. The editor loads every day record for the calendar, so days outside `startDate..endDate` still feed counts, `autoColor`, the day-notes list, and Copy HTML — even though the grid never draws them.

"Trip to Atlanta" is `2026-11-15..2026-11-21` (7 days) but has 18 day records, 11 of them from an abandoned September range. Nights for "Ian in CA": 8 across all records, 3 within the range.

## Rule

A calendar's days are the day records whose date falls within `startDate..endDate`. Everything derived from days must use that filtered set.

## Acceptance

- "Trip to Atlanta" shows 3n for "Ian in CA".
- Calendar list place counts and colour strips also ignore out-of-range days.
- Out-of-range records are left in place (not deleted), so widening the range restores them.

- [x] Filter days to the calendar's date range at the source
- [x] Apply to the calendar-list summaries too
- [x] Cover with tests

## Summary of Changes

Added `daysInTrip(calendar, days)` in `src/cal/utils/tripDays.ts` and applied it in `api.ts` at both query sites (`useCalendarEditor` and `useOwnerCalendarSummaries`), so every consumer — night counts, `autoColor`, the day-notes list, Copy HTML, and the list colour strips — sees only days inside `startDate..endDate`. Out-of-range records are left in the database, so widening the range restores the painting.

Regression test reproduces the dev "Trip to Atlanta" records: "Ian in CA" is 8 nights across all 18 records and 3 within the trip.
