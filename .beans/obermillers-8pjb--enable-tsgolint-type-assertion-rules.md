---
# obermillers-8pjb
title: Enable tsgolint type-assertion rules
status: todo
type: task
priority: normal
created_at: 2026-09-09T05:38:10Z
updated_at: 2026-09-09T05:38:10Z
---

Oxlint already has `typeAware: true` and `oxlint-tsgolint` is installed, but type-aware assertion rules are not enforced. `typescript/no-unsafe-type-assertion` is explicitly `"off"` in `oxlint.config.ts`.

That hid a real mismatch: `src/museums/App.tsx` used `as MuseumRecord[]` on the ASTC/AZA JSON. The AZA dump includes `discountType: "free-public"` (Cape May County Zoo), which is not in `DiscountType` (`"free" | "50-percent" | "distance-based" | "varies"`), so the badge UI never handles it.

## Goal

Turn on tsgolint’s unsafe-assertion check (and any other type-aware rules we want as errors) so `as` cannot paper over JSON/API shapes.

## Work

- [ ] Set `typescript/no-unsafe-type-assertion` to `"error"` (do not use `consistent-type-assertions: never` — too blunt; annotation vs assertion is not the issue)
- [ ] Confirm `npm run lint` actually runs tsgolint (type-aware) in CI and locally
- [ ] Fix or replace remaining unsafe assertions rather than disabling the rule: museums JSON (valibot parse), `src/museums/lib/storage.ts`, `src/museums/lib/geocoding.ts`, plus existing hits in recipes, scanify, cal, vite.config, scripts
- [ ] Revisit other tsgolint rules that are currently off only because they were noisy; keep `no-explicit-any` / floating promises as they are

## Notes

A trial flip already reported unsafe assertions in:

- `src/museums/App.tsx` (`as MuseumRecord[]`)
- `src/museums/lib/storage.ts`, `src/museums/lib/geocoding.ts`
- `src/recipes/index.tsx`, `src/scanify/{zip.ts,index.tsx}`, `src/cal/{utils,core/routes.ts,CalendarGrid.tsx}`, `src/bank/core/routes.ts`
- `vite.config.ts`, `scripts/migrate-colorcal-instant.ts`, `scripts/scanify-*.ts`
