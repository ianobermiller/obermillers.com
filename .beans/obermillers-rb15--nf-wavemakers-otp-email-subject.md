---
# obermillers-rb15
title: NF Wavemakers OTP email subject
status: completed
type: bug
priority: normal
created_at: 2026-09-07T00:30:47Z
updated_at: 2026-09-07T00:31:42Z
---

## Goal

Login-code emails for NF Wavemakers Ballot currently use the PocketBase default subject `OTP for Obermillers`. They should say `NF Wavemakers Login Code` instead.

Family Bank and other obermillers.com apps should keep the default subject.

## Todos

- [x] Override OTP mail subject from request Origin for nfwavemakers.com
- [x] Unit-test origin → subject mapping

## Summary of Changes

PocketBase OTP mail is sent in a background goroutine, so the request Origin is stored when OTP is requested and applied in `OnMailerRecordOTPSend`. Origins on `nfwavemakers.com` (including subdomains) get subject **NF Wavemakers Login Code**. Other apps keep `OTP for Obermillers`.
