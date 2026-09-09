---
# obermillers-gd4i
title: Update color scheme toggles
status: completed
type: task
priority: normal
created_at: 2026-09-09T05:38:44Z
updated_at: 2026-09-09T15:03:33Z
---

If we want to keep the toggle in the header, make it a two state: [https://lea.verou.me/blog/2026/dark-mode-toggles/](https://lea.verou.me/blog/2026/dark-mode-toggles/)

Otherwise, put it in a settings page

## Summary of Changes

Went with the two-state header toggle, and consolidated the three separate
implementations into one shared module at `src/theme/`.

**Shared model** (`src/theme/colorScheme.tsx`) — `ColorSchemeProvider` /
`useColorScheme`. localStorage holds an override of `light` or `dark`, or no key
at all, which means "follow the OS". The old literal `"system"` value is dropped
on read, so existing keys migrate themselves. The provider puts `light`/`dark`
plus `color-scheme` on `<html>` (so portalled Radix content is covered), takes
an optional `scopeClass` for museums, and follows the OS live via `matchMedia`.

**Toggle** (`src/theme/ColorSchemeToggle.tsx`) — one icon button showing the
current scheme. Pressing it flips to the opposite of what is on screen; when
that opposite is what the OS says, the override is removed rather than stored,
so "follow the OS" stays reachable. An override is never collapsed just because
the OS changed, only on an explicit press — that matters for anyone whose OS
switches on a schedule. The tooltip says "Switch back to light (system default)"
when the press will hand control back to the OS. `className` carries the whole
look so each app matches its own buttons.

**Per app**
- museums: dropdown replaced by the toggle; deleted `lib/theme.tsx`,
  `components/ThemeToggle.tsx`, and the now-unused `ui/dropdown-menu.tsx`.
- bank: toggle added to the header beside the menu; the menu's Theme radio group
  is gone, and `AppMenu` now renders nothing when signed out (it only held
  account actions). Settings keeps a tri-state picker — the right call for a
  settings panel — and now labels the third option "System (light|dark)" so it
  says what it resolves to. Deleted `ui/ThemeProvider.tsx` and the four
  dropdown-menu exports it was the only consumer of.
- cal: gained a toggle for the first time, replacing the hardcoded
  `prefers-color-scheme` listener in `index.tsx`.

Verified in a browser on all three apps: the scheme flips, the stored value goes
`null` → `"light"` → `null`, and the `<html>` class/`color-scheme` track it.
`npm run check` is clean.

## Deferred

No first-paint bootstrap script, so a stored override still flashes the wrong
scheme on load (`index.html` hardcodes a dark `#09090b` background). Worth a
follow-up.
