---
# obermillers-g687
title: Add private shared gift card tracker
status: completed
type: feature
priority: normal
created_at: 2026-11-21T21:09:05Z
updated_at: 2026-11-21T23:32:11Z
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

## On-demand balance checks

- [x] Verify official balance lookup options for Domino’s, Shake Shack, Steak ’n Shake, and Cinemark.
- [x] Add a balance check flow that stores confirmed balances and a last-checked timestamp without claiming failed or incomplete checks succeeded.
- [x] Preserve ownership, sharing permissions, and encrypted card details; test and run check/build.
- [x] Summarize supported lookup behavior and commit the change.

## Summary of Changes: balance checks

- Added Check balance to each card with official help for Domino’s, Shake Shack, Steak ’n Shake, and Cinemark, plus a generic confirmation flow for other merchants. The user explicitly approved opening the official checker and manually saving the confirmed result when automatic checks are unavailable.
- Verified the live Domino’s and Shake Shack forms use reCAPTCHA. Steak ’n Shake’s official gift card page directs balance checks to phone or in-store support. Cinemark’s form was visible in Chrome, while the direct server request returned HTTP 403. This change provides guided checks rather than claiming automatic retailer integrations.
- Added owner-only POST /api/giftcards/{id}/balance-check. It validates exact integer cents including zero, checks the expected updated timestamp, and stores the confirmed amount with a server-generated balanceCheckedAt in one transaction. Shared viewers can open help and see results but cannot alter saved balances.
- Displayed the last-checked date as entered manually. Opening or canceling a checker does not change it. Regular edits cannot forge the timestamp; changes to balance, currency, merchant, or secret details clear it, while notes-only edits preserve it.
- Kept encrypted codes out of links and ordinary responses. Balance confirmation preserves existing encrypted secrets. Added a close-and-refresh recovery path for stale checks.
- Verified npm run check (31 tests), npm run build, and go -C pocketbase test ./.... Real PocketBase HTTP-handler tests cover zero balances, invalid amounts, owner-only access, stale requests, atomic persistence, timestamp forgery, invalidation, and preservation of encrypted details. Browser UI verification was attempted but blocked by another Chrome extension; temporary preview and fixture servers were stopped.
- Deployment requires the updated Go binary and latest pb:setup:prod schema. No live cards, keys, or production data were accessed or changed.

Official balance help verified November 21, 2026:
- https://www.dominos.com/content/gift-cards links to https://wbiprod.storedvalue.com/wbir/clients/dominos
- https://shakeshack.com/gift-card-balance embeds https://wbiprod.storedvalue.com/wbir/clients/shakeshack
- https://www.steaknshake.com/gift-card/
- https://www.cinemark.com/guest-services?check-balance=

## Authentication structure and screenshots

- [x] Inspect NF Wavemakers signup and sign-in structure and adapt it to the gift card tracker.
- [x] Verify the authentication states and capture screenshots of sign-in, signup, and the wallet.
- [x] Run required checks, summarize, and commit the update.

## Summary of Changes: NF Wavemakers authentication structure

- Adapted the structure of nfwavemakers/ballots/components/Auth.tsx into a dedicated gift card authentication panel. The initial Sign in or create account screen asks only for email, then verifies a code. Password and passkey options remain secondary, and password sign-in includes password reset by email link.
- Added explicit passwordless account creation before requesting the code. Existing accounts continue through the same screen only when PocketBase reports the email uniqueness conflict; registration failures are not silently treated as existing users. Other hub apps keep their existing LoginForm behavior.
- Added labels, disabled loading controls, error feedback, email normalization, and a different-email action. The verified email session still uses shared PocketBase authentication and the existing private-card rules.
- Browser verified the actual updated UI at 390px with no horizontal overflow, password option navigation, invalid-code feedback, successful email-code signup/sign-in, balance confirmation, and sign-out. Browser data came from an isolated API fixture; no real accounts, gift cards, or email deliveries were used.
- Captured and inspected dark screenshots of mobile unified sign-in/signup, password sign-in, email verification, desktop wallet, and mobile wallet. Files are saved in the chat visualization directory under gift-cards-*.jpg.
- npm run check passed with 36 tests, including five new HTTP-boundary tests for new/existing account flows, failure handling, and password reset links. npm run build passed.
- The update is committed in the existing feature worktree and is not deployed. No NF Wavemakers source files were changed.
