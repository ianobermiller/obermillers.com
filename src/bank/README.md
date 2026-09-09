# Family Bank

Allowance ledger for kids, now a hub SPA at **`/bank`**.

Parents create accounts, pay allowance and chores, and accrue interest. Kids sign in with their email to see the ledger.

Live data is PocketBase at `https://pb.obermillers.com`. Auth uses the shared `users` collection; app data is `familybank_accounts`, `familybank_presets`, and `familybank_transactions`.

`npm run dev` runs a local PocketBase from `pocketbase/`, applies the schema, seeds demo users (`src/bank/pocketbase.seed.mjs`), and routes its mail to the catcher in `scripts/localMailCatcher.mjs` so login codes print in the terminal. Use `npm run dev:prod` to run the Vite app against production PocketBase without starting a local instance.

Collections, fields, and rules live in `src/bank/pocketbase.schema.mjs` and are applied by `scripts/setup-pocketbase.mjs`:

```bash
npm run pb:setup       # local
npm run pb:setup:prod  # production, superuser from .env.local
```

`bank.obermillers.com` 301s to `https://obermillers.com/bank`. Re-apply with `scripts/redirect-bank-subdomain.sh` (rsyncs `src/bank/subdomain-redirect/` to `~/public_html/bank`).
