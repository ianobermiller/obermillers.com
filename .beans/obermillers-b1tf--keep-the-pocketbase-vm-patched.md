---
# obermillers-b1tf
title: Keep the PocketBase VM patched
status: completed
type: task
priority: high
created_at: 2026-11-09T15:35:31Z
updated_at: 2026-11-09T15:47:19Z
---

The PocketBase host is a customer-managed Oracle Linux VM. Oracle CPU emails do not patch it. Apply the pending security errata and turn on dnf-automatic so later security updates install without waiting on a quarterly notice.

- [x] Apply pending dnf security updates and reboot
- [x] Enable dnf-automatic for security updates, rebooting only when a package needs it
- [x] Confirm PocketBase and Caddy come back
- [x] Teach deploy/setup.sh the same automatic-update setup

## Summary of Changes

Applied Oracle Linux security errata on pb.obermillers.com and rebooted onto kernel-uek 6.12.0-208.112.5. PocketBase and Caddy came back; https://pb.obermillers.com/api/health is healthy. dnf-automatic-install.timer now installs security updates daily around 06:00 GMT and reboots only when a package needs it. deploy/setup.sh enables that same timer (unattended-upgrades on Ubuntu).
