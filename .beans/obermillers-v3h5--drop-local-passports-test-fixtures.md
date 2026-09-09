---
# obermillers-v3h5
title: Drop local Passports test fixtures
status: completed
type: task
priority: normal
created_at: 2026-09-09T05:10:05Z
updated_at: 2026-09-09T05:10:28Z
---

The /passports/test harness and JPEGs were kept out of dist so local dev could still serve them. We do not need a special local test copy; Passports can use the CDN like production.

- [x] Remove src/passports/static/test
- [x] Drop the copy-skip special case in vite.config.ts
- [x] Update the Passports static README

## Summary of Changes

## Summary of Changes

Deleted `/passports/test` (harness + ~38MB JPEGs) and reverted static copy to a plain `cpSync` with no skip list. Local and production Passports both use the IMG.LY/jsDelivr CDNs.
