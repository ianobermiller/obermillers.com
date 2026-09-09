---
# obermillers-a1ws
title: Count nights, not painted squares, in Color Calendar places
status: completed
type: bug
priority: normal
created_at: 2026-09-09T04:42:59Z
updated_at: 2026-09-09T04:43:30Z
---

## Goal

Place counts in the Color Calendar editor should be nights spent at each place, not the number of coloured day squares.

## Why

A travel day is split: morning is the place you leave, afternoon is where you arrive. You sleep at the evening place. Crediting both halves (or only `categoryId`) makes counts like London's `7d` disagree with the itinerary.

## Rule

For each day, count one night for the evening place: `halfCategoryId ?? categoryId`. Morning-only colour on a travel day is not a night there.

## Acceptance

- Example UK trip: London 5n (May 1–4 and 21), not 7.
- Each painted day contributes exactly one night.
- Label matches nights (not `d` for day-squares).

- [x] Count evening place only
- [x] Cover with tests on example trip
- [x] Update the places list suffix

## Summary of Changes

Place counts now use the evening colour of each day (`halfCategoryId ?? categoryId`), so a morning departure is not a night there. The places list shows `n` instead of `d`. Example UK trip: London 5n.
