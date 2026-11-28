---
# obermillers-laap
title: Disable scroll changes to input values
status: completed
type: task
priority: normal
created_at: 2026-11-27T23:03:04Z
updated_at: 2026-11-27T23:04:49Z
---

Prevent mouse-wheel scrolling from changing numeric input values while preserving normal editing and page scrolling.

## Summary of Changes

Added a shared capture-phase wheel listener that blurs numeric inputs before browser wheel stepping, including inputs rendered in dialogs. Normal page scrolling and keyboard editing remain available.

Verified in headless Chrome: numeric values stay unchanged on wheel, the page scrolls, arrow keys still edit, and text inputs retain focus. npm run check passed (56 tests); npm run build passed.
