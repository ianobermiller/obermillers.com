---
# obermillers-7s9x
title: Brand NF Wavemakers auth emails
status: completed
type: bug
priority: high
created_at: 2026-10-24T01:31:05Z
updated_at: 2026-10-24T01:33:24Z
---

OTP and new-login emails for NF Wavemakers still say Obermillers, because PocketBase fills {APP_NAME} from the shared app name.

Login-code subject, body, and the new-location alert should use the NF Wavemakers application name when the request origin is nfwavemakers.com. Family apps on obermillers.com keep Obermillers.

## Todos

- [x] Use the application name in OTP and login-alert mail when it is a different brand
- [x] Remember the auth-request origin so the login alert can be branded
- [x] Unit-test brand selection and the mail rewrite

## Summary of Changes

OTP and new-login emails now replace the PocketBase app name with the applications record name when that name is a different brand. A request from nfwavemakers.com (including subdomains) writes NF Wavemakers into the subject and body. obermillers.com keeps Obermillers, because its prompt name is the same brand. A custom otp_subject still replaces the whole OTP subject.
