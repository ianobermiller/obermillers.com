---
# obermillers-g687
title: Add private shared gift card tracker
status: completed
type: feature
priority: normal
created_at: 2026-11-21T21:09:05Z
updated_at: 2026-11-21T22:54:20Z
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

## Server-side encryption

- [x] Encrypt card numbers and PINs before persistence and reveal only after checking current access.
- [x] Keep the encryption key outside the database, repository, and database backups; support local setup and server deployment.
- [x] Update the UI to fetch secrets only on reveal and preserve them during metadata edits.
- [x] Verify encryption, tampering rejection, sharing, revocation, migration, and missing-key behavior; run check, build, and Go tests.
- [x] Document provisioning and recovery, then commit the completed change.

## Summary of Changes: server-side encryption

- Added AES-256-GCM encryption to the existing Go PocketBase extension. Numbers and PINs are encrypted before persistence, use fresh random nonces, and authenticate the card ID and field name.
- Hid stored ciphertext in all regular record responses. The protected POST reveal endpoint rechecks current view permissions, returns no-store responses, and rejects missing authentication, strangers, unverified recipients, revoked access, and invalid ciphertext.
- Added validated write-only inputs. Balance and other metadata edits preserve stored secrets; owners can replace or remove each secret explicitly. Lists and edit forms never fetch plaintext. Reveals disappear after 30 seconds, on blur, and on sign-out.
- Added a private key-file loader, owner-only permission checks, startup checks, transactional legacy migration, and idempotent key provisioning in local setup and deployment. Production keys live outside pb_data and Git. No production key or data was accessed or changed.
- Documented provisioning, recovery, deployment order, historical plaintext backups, and the requirement to preserve the key. Rotation requires an explicit re-encryption operation rather than replacing the key file.
- Verified npm run check, npm run build, go -C pocketbase test ./..., shell syntax, and browser behavior at 390px using API fixtures. Real PocketBase HTTP-handler tests cover encrypted persistence, authorized reads, revocation, secret replacement and removal; crypto tests cover random nonces, tampering, swapped cards and fields, wrong keys, migration, and unsafe key-file permissions.

Deployment still requires landing the branch, deploying the updated PocketBase binary, and applying pb:setup:prod before the frontend. Save a separate recovery copy of the production key before storing real cards.
