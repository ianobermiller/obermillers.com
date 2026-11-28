---
# obermillers-otwf
title: Simplify gift card details and balance workflow
status: completed
type: task
priority: normal
created_at: 2026-11-24T15:59:12Z
updated_at: 2026-11-28T16:11:36Z
---

Apply the six browser comments: remove timed reveal, show last four with inline copy icons, remove confirmation checkbox, provide numbered balance-check steps with copy controls, and hide unchecked status text. Verify in local preview and run check/build.

## Summary of Changes

- Removed timed visual reveal and its plaintext display state; full numbers and PINs are fetched only for copying.
- Show masked card numbers ending in their saved last four characters, with accessible inline copy icons beside number and PIN in Details and balance checks.
- Reworked balance checks into numbered copy, retailer lookup, and save steps; removed the confirmation checkbox.
- Removed Not checked and unchecked labels while preserving real checked dates and shared-card labels.
- Verified npm run check (42 tests) and npm run build. Local browser checks against a separate demo database confirmed correct number/PIN clipboard values, no full secrets in the page, and saving $12.34 without a checkbox updated the amount and check date. Desktop layout inspected and captured at /private/tmp/gift-card-workflow-desktop.jpg.
- No production records or hosting changed.

## Compact rows follow-up

- [x] Put Copy number, Copy PIN, and a Check/Edit/Delete overflow menu on compact rows.
- [x] Move balance checks into an accessible modal with numbered steps.
- [x] Verify the layout and interactions, then run check and build.

## Summary of Changes — Compact rows

- Tightened wallet, store, and card spacing. Each row has Copy number, Copy PIN, and a three-dot menu with Check, Edit, Delete; unavailable secrets are disabled and shared cards retain owner-only editing/deletion.
- Moved balance checking into a Radix modal with numbered copy, retailer lookup, and save steps, a close button, Escape dismissal, and keyboard focus restoration.
- Verified desktop and 375px mobile screenshots and browser interactions using intercepted fixture APIs, including real clipboard values, menu order, save/refresh, editing, delete confirmation, shared permissions, focus restoration, and masked details.
- npm run check passes all 42 tests; npm run build passes.

## Single-line mobile rows

- [x] Keep copy controls on the same mobile row as the card identity and balance.
- [x] Verify narrow mobile layouts and copy/menu interactions; run check/build.

## Summary of Changes — Single-line mobile rows

- Mobile rows keep identity, balance, Number, PIN, and overflow menu together. Short labels preserve accessible Copy number/Copy PIN names and show a checkmark after copying. Full labels remain on desktop and in the modal.
- Verified row alignment and no horizontal overflow at 320, 375, 390, 430, 640, 768, and 1280px. Browser checks cover clipboard values, menus, save/refresh, edit/delete confirmation, shared permissions, and modal focus restoration.
- npm run check passes all 42 tests; npm run build passes. Updated mobile screenshot: /private/tmp/gift-cards-compact-mobile.png.

## Store logos

- [x] Add locally bundled app logos for supported stores and a fallback for other merchants.
- [x] Verify mobile layout, logo loading and fallback, then run check/build.

## Summary of Changes — Store logos

- Added locally bundled App Store icons for Domino’s, Shake Shack, Steak ’n Shake, Cinemark, and Target beside store names. Source URLs are recorded in logos/sources.json.
- Unknown stores and failed image loads display an initials tile. Logo images are decorative so store names remain the accessible labels.
- Verified all five images load, both fallback paths, header alignment at 320/375/1280px, and existing row/menu/modal interactions using fixture APIs. Inspected the mobile screenshot at /private/tmp/gift-cards-logos-375.png.
- npm run check passes all 42 tests; npm run build passes.
