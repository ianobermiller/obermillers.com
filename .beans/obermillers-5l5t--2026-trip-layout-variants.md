---
# obermillers-5l5t
title: 2026 trip layout variants
status: completed
type: task
priority: normal
created_at: 2026-09-19T21:00:00Z
updated_at: 2026-09-19T22:14:18Z
---

Generate an HTML file with 3-5 cohesive desktop layout examples for the 2026 trip page (header, timeline, hero, map, itinerary intro).

## Implementation

- [x] Apply layout E: cover hero, timeline ribbon, compact map band, then days
- [x] Fill the header (status + nav) so it is not an empty bar
- [x] Let day cards span the same width as the rest of the page
- [x] Verify in the browser on a wide desktop viewport

## Summary of Changes

Shipped layout E on the live 2026 trip page: full-viewport cover, timeline as a ribbon that sticks, compact map band, then full-width days. Mock HTML is in `design/2026-trip-layout-mocks.html`.
