---
# obermillers-62re
title: Kids cannot add bank transactions
status: completed
type: bug
priority: high
created_at: 2026-10-30T14:18:01Z
updated_at: 2026-10-30T14:20:51Z
---

Isla (isla@obermillers.com) cannot add a Family Bank transaction. Production logs show POST /api/collections/familybank_transactions/records returning 400 with `isFromParent: cannot be blank` from Safari on www.obermillers.com. Parent creates (isFromParent true) succeed.

PocketBase bool fields marked required reject false — Required means the value must be true. Kids send isFromParent: false.

- [x] Mark familybank_transactions.isFromParent as not required in the schema
- [x] Apply the schema change to production so kid creates succeed
- [x] Confirm a false isFromParent create is accepted

## Summary of Changes

PocketBase treats a required bool as "must be true", so Isla's `isFromParent: false` was rejected with "cannot be blank". `familybank_transactions.isFromParent` is now optional in the schema and on production. Impersonated creates for Isla (`false`) and Ian (`true`) both succeeded, and the test rows were deleted.
