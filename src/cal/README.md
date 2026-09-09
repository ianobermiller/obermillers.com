# Color Calendar

Travel planning at `/cal`. Data lives in PocketBase (`colorcal_*` collections, shared `users` OTP with Family Bank). Public calendar links keep the old Instant shape: `/cal/<urlId>`, where migrated calendars use uuid-url of the Instant id.

A public calendar is shared by link, never listed: readers must pass the `knownCalendar` query param matching the calendar's `urlId`, which ports Instant's `ruleParams.knownCalendarId`. Without it a list request returns nothing, so public calendars can't be enumerated.

`npm run dev` seeds two calendars for `parent@example.com` plus one owned by someone else (`src/cal/pocketbase.seed.mjs`), and points local PocketBase at the mail catcher in `scripts/localMailCatcher.mjs`. Sign in with any seeded address; the login code prints in the dev server terminal.

Collections, fields, and rules live in `src/cal/pocketbase.schema.mjs`.

```bash
npm run pb:setup                       # local collections
npm run pb:setup:prod                  # production schema
npm run cal:migrate-instant -- --dry-run # preview Instant → PocketBase
npm run cal:migrate-instant            # migrate (needs INSTANT_ADMIN_TOKEN)
```

The migration reads `POCKETBASE_URL`/`VITE_POCKETBASE_URL` and the superuser credentials from `.env` and `.env.local`, so it targets production by default.
