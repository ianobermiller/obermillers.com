---
# obermillers-4yak
title: 'Redesign Color Calendar: variant mocks'
status: completed
type: task
priority: normal
created_at: 2026-09-09T04:05:47Z
updated_at: 2026-09-09T05:06:54Z
---

Propose several visual design directions for the /cal Color Calendar app and deliver them as a single standalone static HTML mock page covering the three key screens.

Screens to mock per variant:
- Marketing / logged-out landing
- Calendar list (logged in)
- Calendar editor (grid + category palette + notes)

Uses the real UK example trip data and the real ColorBrewer Set2 palette so the mocks are faithful.

- [x] Pick and define the design variants
- [x] Build standalone HTML mock page with variant + screen switcher
- [x] Verify it renders in a browser (reviewed directly by user)
- [x] Review variants with user and pick a direction

## Chosen direction: Ledger

Neutral zinc palette, hairline rules, real typographic hierarchy (uppercase
micro-labels, tabular numerals), small radii, calm buttons. Keeps the ruled
spreadsheet grid but wraps it in a rounded, clipped frame.

Full scope approved, including the structural changes and all the renames.

### Implementation
- [x] Ledger tokens: Inter font, page shell, dark-mode counterparts
- [x] Restyle shared primitives (Button/Input/Textarea/Modal)
- [x] Topbar with four-color brand mark (replaces Palette icon)
- [x] Marketing page: new hero copy, example panel w/ legend, 3 features
- [x] Calendar list: "Your trips", color-strip fingerprint, day/place counts
- [x] api: owner calendar summaries query (days + categories per calendar)
- [x] Editor: new header, labelled sections, restyled day-note list
- [x] CalendarGrid: framed grid, neutral weekday headers
- [x] CategoryList -> "Places" panel
- [x] Restyle Login / Settings / DayEditor / Notes
- [x] npm run check passes

## Summary of Changes

Applied the Ledger direction across the whole /cal app.

**Design system.** New `src/cal/index.css` defines `--cc-*` tokens for light
and dark, exposed as Tailwind utilities via `@theme inline` (matching the
pattern Family Bank already uses). Inter Variable added as `font-cc`.
`scripts/verify-cal-css.sh` asserts the tokens, utilities and day-fill rules
survive a production build.

**Two fixes found along the way.** The `dark` class moved from a wrapper div
to `<html>`, because the `dark:` variant resolves against an ancestor and
portalled modals/tooltips were therefore stuck in light mode. And the runtime
`getColorForMode()` matchMedia call was replaced by a CSS `color-mix()`, so
day colours now follow the theme without JS.

**Renames adopted:** Categories -> Places, Your Calendars -> Your trips, new
marketing copy, and a four-swatch brand mark replacing the Palette icon.

**New data.** `useOwnerCalendarSummaries` replaces `useOwnerCalendars`,
fetching the owner's days and categories in two extra requests total (not
per calendar) so list rows can show a colour fingerprint and a place count.

Variant mocks kept at `design/cal-redesign-mocks.html` as a design reference.
