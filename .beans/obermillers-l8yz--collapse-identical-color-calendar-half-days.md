---
# obermillers-l8yz
title: Collapse identical Color Calendar half-days
status: completed
type: bug
priority: normal
created_at: 2026-09-09T04:56:55Z
updated_at: 2026-09-09T04:58:40Z
---

## Goal

If a day's `categoryId` and `halfCategoryId` are the same place, drop the half. A whole day is one colour; a duplicate half draws a triangle of the same colour and looks broken.

## Write

Any create/update that would set both to the same id must store `halfCategoryId` as empty instead. Drag-painting a range currently writes both halves to the selected place on middle days, which is how this data appears.

## Render

Treat a half that equals the morning place as empty, so leftover records (e.g. Atlanta/Atlanta) draw as a full square.

- [x] Helper to collapse redundant halves
- [x] Normalize on create/update/drag writes
- [x] Render identical halves as empty
- [x] Tests

## Summary of Changes

Added `effectiveHalfCategoryId` / `collapsedHalfCategoryId`. Creates, drag writes, and two-field updates store a null half when it would match the morning place. Filling the afternoon to match the morning now clears the half instead of duplicating it.

Loaded days and the grid treat a matching half as empty, so leftover Atlanta/Atlanta records draw as a full square without a triangle.
