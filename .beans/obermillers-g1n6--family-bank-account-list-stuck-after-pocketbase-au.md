---
# obermillers-g1n6
title: Family bank account list stuck after PocketBase auto-cancel
status: completed
type: bug
priority: normal
created_at: 2026-09-06T03:28:47Z
updated_at: 2026-09-06T03:35:17Z
---

On /bank/accounts, getSession, listAccounts, and claimPending all call getFullList on familybank_accounts at once. The PocketBase JS SDK auto-cancels duplicate requests, so listAccounts stays undefined and the page shows only the Family Bank title.

- [x] Disable SDK auto-cancellation on the shared client
- [x] Stop treating cancelled fetches as a permanent empty load

## Summary of Changes

- `pb.ts`: `pb.autoCancellation(false)` so session, account list, and claim-pending can hit the same collections on mount. Added `isPbAbort` for leftover abort errors.
- `live.tsx`: aborted live queries retry instead of leaving data undefined.
- `auth.tsx`: claim-pending ignores abort errors.
- `AccountList.tsx`: loading returns null and the kid-empty state no longer repeats the Family Bank chrome title.
