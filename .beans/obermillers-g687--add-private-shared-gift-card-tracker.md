---
# obermillers-g687
title: Add private shared gift card tracker
status: completed
type: feature
priority: normal
created_at: 2026-11-21T21:09:05Z
updated_at: 2026-11-22T00:29:04Z
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

## Simplify the wallet and share all cards

- [x] Replace individual-card access with owner-wide sharing for existing and future cards, with verified-email checks and revocation.
- [x] Remove descriptions, notes, repeated badges, and per-card sharing controls; use a compact mobile-friendly display.
- [x] Verify sharing isolation and inheritance, run required checks, capture updated screenshots, and commit.

## Summary of Changes: simplified wallet and all-card sharing

- Removed the page tagline, authentication description, notes input and display, repeated privacy badges, and per-card sharing controls. Replaced large tiles with compact rows showing merchant, balance, check date, and Check balance and Details controls. Numbers, PINs, expiry, editing, and deletion stay under Details.
- Added one Share all cards people list per owner. New giftcard_shares grants include all current and future cards owned by that user. Recipients need a verified matching email and remain read-only. Received cards cannot be reshared through a recipient’s own wallet list.
- Migrated frontend schema, queries, mutations, and tests to owner-wide grants. Schema setup retires the draft giftcard_access API without silently expanding old individual-card grants; legacy records remain for administrator review. Apply the updated schema and add intended people in the new sharing panel before rollout.
- Real PocketBase HTTP-handler tests verify existing and future card access, isolation from other owners, prevention of onward sharing, owner-only grant changes, verified-email requirements, wallet-wide revocation, retained access to other cards after a deletion, and encrypted reveals through the new view rule.
- Verified npm run check with 36 tests, npm run build, and go -C pocketbase test ./.... Browser checks with isolated sample data verified the 390px layout without horizontal overflow, global add and revoke actions, email normalization, and collapsed card details with no individual-card sharing action.
- Captured and inspected updated screenshots: gift-cards-simple-mobile.jpg, gift-cards-share-all.jpg, and gift-cards-simple-desktop.jpg in the chat visualization directory. No production data, card codes, or keys were accessed or changed. Not deployed.

## Group cards by store

- [x] Group matching store names into one row with card count and summed balances, keeping currencies separate.
- [x] Expand each store to manage individual cards, preserving check dates, encrypted details, and sharing permissions.
- [x] Test Costco-style four-card packs and partial spending, run required checks, capture the grouped view, and commit.

Keep each card’s server-recorded date added and show it under Details.


## Summary of Changes: store groups and date added

- Grouped cards by canonical store name and currency into expandable rows with summed balances and card counts. Four $25 cards appear as one $100 store. Individual cards retain their ownership, details, and balance-check actions.
- Store check dates use the oldest check when every card has been checked; otherwise they show the unchecked count. Currency totals remain separate.
- Read PocketBase’s existing server-generated created timestamp and show Added under each card’s Details, independently of the last balance check.
- Added six grouping tests covering packs, partial spending, merchant aliases, currencies, ownership, dates, zero balances, and empty wallets. npm run check passed with 42 tests; npm run build passed.
- Verified the 390px UI with isolated sample data, no horizontal overflow, four $25 cards expanding under $100, the added date, and a saved $12 balance changing the store total to $87 while preserving Added. Captured gift-cards-grouped-mobile.jpg. Stopped preview servers; no production data changed. Not deployed.

## Account menu and local samples

- [x] Move email, sharing, and sign-out to a top-right avatar menu; use an accessible sharing modal.
- [x] Fix select arrow spacing, inset the search icon, and remove redundant manual refresh.
- [x] Add repeatable local fake-card seeding, verify the UI and checks, then commit.


## Summary of Changes: account controls and local samples

- Moved the signed-in email, Share all cards, and Sign out into a top-right avatar dropdown. Sharing opens a Radix modal with focus trapping, Escape dismissal, a close control, and accessible title and description. Added an optional PageShell header action.
- Inset the search icon, gave select arrows consistent right padding, and removed the redundant refresh button. The wallet still reloads on focus, visibility changes, every minute, and after writes; refresh never queried retailers.
- Removed the currency selector and make saved cards USD. Merchant entry suggests supported and existing merchant names through a native datalist while accepting freeform names.
- Card number and PIN inputs use masked ordinary text fields, autocomplete off, and password-manager ignore hints instead of password inputs. Verified Chromium applies disc masking and the form contains no password inputs.
- Replaced numbered card labels with their added date and last four characters. PocketBase emits only the suffix in authorized record responses, never the complete number or PIN. Short values of four characters or fewer emit no suffix. Added a real HTTP-handler assertion for suffix metadata.
- Added Copy number and Copy PIN under Details. These use the existing access-checked no-store reveal endpoint, write directly to the clipboard, and never put fetched secrets in visible UI or React state. Verified demo number and PIN copying, success feedback, and continued visual masking.
- Added local-only, repeatable sample seeding to dev startup: 16 invalid demo cards across the four stores, including partially spent and depleted cards. Deterministic IDs avoid duplicates and preserve user-entered records. Verified a second seed leaves the same record count and the seed rejects remote URLs. Seeded the running local parent@example.com account and preserved its existing card and sharing.
- npm run check passed with 42 tests, npm run build passed, and go -C pocketbase test ./... passed. Browser checks at 390px verified the account menu, sharing modal, no horizontal overflow, freeform merchant entry, USD-only form, date/suffix identification, and hidden copy actions. Screenshots saved in the chat visualization directory.
- Local preview remains running at http://127.0.0.1:5188/gift-cards with the updated sole PocketBase instance on 8090. No production data or hosting changed.

## Compact card labels

- [x] Remove the Added prefix, use a single asterisk before the last four characters, and remove visible USD labels; verify and commit.

## Summary of Changes: compact card labels

Removed Added from card headings and changed the suffix to *0016 format. Removed currency codes from store balances, individual balances, and the balance-confirmation field label while retaining dollar formatting and USD storage. npm run check passed with 42 tests and npm run build passed. The running local preview hot-reloads these changes.

## Summary of Changes: card separator

Removed the middle dot between the added date and masked card suffix. Labels now read Nov 21, 2026 *0016. npm run check passed with 42 tests and npm run build passed.
