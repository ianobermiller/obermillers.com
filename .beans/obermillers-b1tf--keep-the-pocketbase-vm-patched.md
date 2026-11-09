---
# obermillers-b1tf
title: Keep the PocketBase VM patched
status: todo
type: task
priority: high
created_at: 2026-11-09T15:35:31Z
updated_at: 2026-11-09T15:35:31Z
---

The PocketBase host is a customer-managed Oracle Linux VM. Oracle CPU emails do not patch it. Apply the pending security errata and turn on dnf-automatic so later security updates install without waiting on a quarterly notice.

- [ ] Apply pending dnf security updates and reboot
- [ ] Enable dnf-automatic for security updates, rebooting only when a package needs it
- [ ] Confirm PocketBase and Caddy come back
- [ ] Teach deploy/setup.sh the same automatic-update setup
