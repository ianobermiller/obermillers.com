---
# obermillers-6f7s
title: Port household finance tracker into the hub
status: todo
type: feature
created_at: 2026-09-06T03:52:55Z
updated_at: 2026-09-06T03:52:55Z
parent: obermillers-9zzf
---

Bring the local household ledger at `~/dev/personal/finance` into this Vite hub as an SPA, replace the Bun SQLite + Hono API with PocketBase, then keep accounts current via SimpleFIN and a scheduled sync.

This is **not** Family Bank (`/bank`, kids' allowances). It is the adult household warehouse: charts, filters, transaction detail, and the categorization inbox.

## Source

- Local: `~/dev/personal/finance` (no GitHub remote)
- Stack today: React + Vite UI, Hono on Bun, `bun:sqlite` warehouse (`data/finance.db`), Python CSV/payslip import scripts
- Capabilities to preserve: dashboard (date/category/search), review inbox (keep / override / recategorize matching), pie/area charts, auto vs manual categories, transfer/income flags, analysis exclusions

## Work

- [ ] Port the UI into `src/finance/` (or equivalent) and wire Chicane + lazy entry + `vite.config.ts` SPA paths + `.htaccess` rewrite
- [ ] Hub `tools` entry with `spa: true` (distinct from Family Bank)
- [ ] Auth: family-only, same PocketBase users as the rest of the hub — do not leave the ledger public
- [ ] Model transactions/accounts/categories on PocketBase (collections named so they do not collide with `familybank_*`); migrate existing SQLite data if we still want history
- [ ] Drop the local Hono + `bun:sqlite` API; dashboard/review/recategorize go through PocketBase
- [ ] Match oxlint / oxfmt / knip / TypeScript 7
- [ ] Add SimpleFIN: store the access URL as a secret (not in git); map SimpleFIN accounts/transactions onto the PocketBase collections; idempotent ingest (pending vs posted, fingerprints)
- [ ] Cron (PocketBase scheduled job or equivalent) to pull SimpleFIN on a regular interval and upsert new/changed transactions without clobbering manual category overrides
- [ ] Do not commit `finance.db`, raw CSVs, payslip PDFs, or SimpleFIN credentials
