# Family Bank

Allowance ledger for kids, now a hub SPA at **`/bank`**.

Parents create accounts, pay allowance and chores, and accrue interest. Kids sign in with their email to see the ledger.

Live data is PocketBase at `https://pb.obermillers.com`. Auth uses the shared `users` collection; app data is `familybank_accounts`, `familybank_presets`, and `familybank_transactions`.

`npm run dev` talks to production PocketBase. To run a local instance from `pocketbase/` and seed demo users:

```bash
npm run bank:dev
```

Apply collections (superuser in `.env.local` for production):

```bash
npm run bank:setup
```

`bank.obermillers.com` 301s to `https://obermillers.com/bank`. Re-apply with `scripts/redirect-bank-subdomain.sh` (rsyncs `src/bank/subdomain-redirect/` to `~/public_html/bank`).
