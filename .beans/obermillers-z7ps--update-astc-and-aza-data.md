---
# obermillers-z7ps
title: Update ASTC and AZA data
status: completed
type: task
priority: normal
created_at: 2026-09-09T05:38:21Z
updated_at: 2026-09-09T06:13:15Z
---

Refresh bundled ASTC Travel Passport and AZA reciprocity lists from the current official PDFs. Reuse existing IDs and coordinates when names match; geocode only new venues.

- [x] Parse ASTC May 2026–October 2026 passport PDF
- [x] Parse AZA May 2026–April 2027 reciprocity chart
- [x] Merge with existing coords/IDs and geocode new venues
- [x] Write `src/museums/data/astc-museums.json` and `aza-institutions.json`
- [x] Preserve the source PDFs' record ordering
- [x] Split ASTC membership eligibility out of `admittancePolicy`

## Summary of Changes

Refreshed bundled lists from the ASTC Travel Passport (May 1–October 31, 2026) and AZA Reciprocal Admissions chart (May 2026–April 2027).

- ASTC: 344 → **368** venues; AZA: 131 → **153** institutions (adds Mexico/Colombia; drops zoos no longer on the chart)
- UI now labels AZA **Free to public** sites

### Admittance policy restructured

The 2026 passport no longer publishes per-venue admittance rules — it lists only
which membership tiers qualify, plus one program-wide rule in the preamble. So:

- ASTC `admittancePolicy` is now empty; tiers moved to `eligibleMemberships: { individual, group }`
- Cards show the program-wide rule (`ASTC_ADMITTANCE_RULE` in `lib/reciprocity.ts`)
  and a collapsible "Which memberships qualify?" section
- AZA `admittancePolicy` is unchanged — that chart still carries real policy text

### Data fixes

The previous file had names truncated by an earlier parse (`"Planetarium"`,
`"Technology"`, `"University"`), and reusing those IDs made the matcher attach
them to the wrong venues — Museum of Coastal Carolina and East Kentucky Science
Center had swapped coordinates, ~400 miles off. IDs are only React keys and are
not persisted, so they are now regenerated from names with city/state
disambiguation.

- Fixed 7 ASTC records whose `city` had absorbed zip/URL fragments
- Moved 22 AZA emails out of `phone` (the chart's one phone column sometimes holds an email)
- Restored `Petrosains, The Discovery Centre` and the Morrill Hall name; added missing URL schemes
