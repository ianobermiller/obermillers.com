---
# obermillers-g687
title: Add private shared gift card tracker
status: completed
type: feature
priority: normal
created_at: 2026-11-21T21:09:05Z
updated_at: 2026-11-21T21:18:14Z
---

Build a mobile-friendly gift card tracker backed by PocketBase with owner-managed sharing and signed-in home visibility. Verify server-side isolation and permissions, then run check and build.

## Summary of Changes

- Added the /gift-cards mobile wallet with manual balances, currency, merchant search, active/used filters, optional expiry, notes, card codes, and PINs.
- Reused hub authentication and show the home-page link only after a valid session refresh. Sign-out clears the wallet.
- Added private PocketBase collections and per-card, read-only sharing by verified email. Only owners can edit, delete, share, or revoke access; ownership cannot be reassigned.
- Masked codes and PINs with 30-second reveals, hide on blur, and refresh permissions on focus and periodically. No gift card data is persisted to browser storage.
- Integrated schema setup and fixed back-relation rule initialization ordering. Added real HTTP-handler permission tests using a temporary database, and wired Go tests into PocketBase CI.
- Verified npm run check (27 tests), npm run build, and go test ./... in pocketbase. Chrome at 390px verified sign-in visibility, layout without overflow, masking/reveal, sharing/revocation, and adding a card using API fixtures.

## Deployment Notes

Apply the new schema with npm run pb:setup (local) or npm run pb:setup:prod (production) before deploying the frontend. Production schema and hosting were not changed. Optional card numbers and PINs are not end-to-end encrypted; server administrators and explicitly shared readers can access them. Sharing grants access but does not send an email.
