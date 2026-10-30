---
# obermillers-62re
title: Kids cannot add bank transactions
status: todo
type: bug
priority: high
created_at: 2026-10-30T14:18:01Z
updated_at: 2026-10-30T14:18:01Z
---

Isla (isla@obermillers.com) cannot add a Family Bank transaction. Production logs show POST /api/collections/familybank_transactions/records returning 400 with `isFromParent: cannot be blank` from Safari on www.obermillers.com. Parent creates (isFromParent true) succeed.

PocketBase bool fields marked required reject false — Required means the value must be true. Kids send isFromParent: false.

- [ ] Mark familybank_transactions.isFromParent as not required in the schema
- [ ] Apply the schema change to production so kid creates succeed
- [ ] Confirm a false isFromParent create is accepted
