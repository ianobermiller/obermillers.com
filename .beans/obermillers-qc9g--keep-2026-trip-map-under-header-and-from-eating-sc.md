---
# obermillers-qc9g
title: Keep 2026 trip map under header and from eating scroll
status: completed
type: bug
priority: normal
created_at: 2026-09-19T20:28:37Z
updated_at: 2026-09-19T20:41:50Z
---

The Leaflet map on the 2026 trip page stacks over the fixed header while scrolling, and wheel/trackpad zoom captures the gesture so it is hard to scroll past.

- [x] Keep map panes below the site header (and progress bar)
- [x] Let page scroll continue over the map (no wheel-zoom capture)
- [x] Verify zoom controls still work and the header stays on top while scrolling the map section

## Summary of Changes

Isolated the map stacking context so Leaflet panes stay under the header and progress bar. Disabled scroll-wheel zoom and set `touch-action: pan-y` so the page can scroll past; zoom buttons still work.
