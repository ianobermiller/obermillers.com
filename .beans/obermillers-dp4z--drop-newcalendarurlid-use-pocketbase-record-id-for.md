---
# obermillers-dp4z
title: Drop newCalendarUrlId; use PocketBase record ID for new calendars
status: completed
type: task
priority: normal
created_at: 2026-09-12T19:18:08Z
updated_at: 2026-09-12T19:21:28Z
---

New calendars use the PocketBase record id in the URL instead of a generated urlId. Old Instant urlIds still resolve but redirect to the canonical record-id URL.

- [x] Drop `newCalendarUrlId`; new calendars use the PocketBase record id
- [x] List rows link to `/cal/<record id>`
- [x] Editor resolves record id or legacy `urlId`, redirects legacy to canonical
- [x] Sharing rules accept record id or `urlId` as `knownCalendar`
- [x] Make `urlId` optional, drop its unique index, update seed and README
- [x] Apply schema to production PocketBase
- [x] Verify in browser: new record-id URL loads; legacy urlId redirects

## Summary of Changes

New calendars use the PocketBase record id in the URL instead of a generated
`urlId`. Old Instant `urlId`s still resolve but redirect to the canonical
record-id URL. Production PocketBase rules and field optionality were updated
with `npm run pb:setup:prod` (plus a one-off to flip `urlId` to optional, since
the setup script does not clear `required` on existing fields).
