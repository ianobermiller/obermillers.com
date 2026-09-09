---
# obermillers-2dy8
title: Prevent color-scheme flash on first paint
status: todo
type: bug
created_at: 2026-09-09T15:43:16Z
updated_at: 2026-09-09T15:43:16Z
---

index.html hardcodes `html { background-color: #09090b }`, and there is no inline bootstrap script. A stored light override (or a light OS preference on a cold load) flashes dark until React hydrates ColorSchemeProvider.

Add a tiny blocking script in index.html that:
- Picks the storage key from the path (`/bank` → family-bank-theme, `/museums` → museum-finder-theme, `/cal` → color-calendar-theme)
- Reads `light`/`dark` or falls back to `prefers-color-scheme`
- Sets `document.documentElement.classList` and `style.colorScheme` before first paint
- Adds `museums-theme` on `/museums`

Keep it in lockstep with `src/theme/colorScheme.tsx` (same keys, same meaning of a missing key).
