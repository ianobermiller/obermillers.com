---
# obermillers-7ems
title: Staging site and PocketBase for cloud agents
status: todo
type: task
priority: normal
created_at: 2026-09-07T04:55:48Z
updated_at: 2026-09-07T04:56:38Z
---

Stand up `test.obermillers.com` and `pb.test.obermillers.com` so cloud agents (and humans) can work against a real HTTPS stack without touching prod data.

## Why

Prod is split today: Vite site on DreamHost (`iano@obermillers.com:~/www/obermillers/`), custom PocketBase on the Oracle ARM VM (`129.213.88.91`) behind Caddy at `https://pb.obermillers.com` (`127.0.0.1:8090`). `VITE_POCKETBASE_URL` is baked in at build time (`.env.production`). A cloud agent must not share prod `pb_data` (Family Bank, calendar, passkeys, OTP). Agent VMs are ephemeral, so a local PocketBase on the agent is not a durable backend.

## Layout

| Hostname | DNS | Serves |
| --- | --- | --- |
| `test.obermillers.com` | DreamHost (same box as prod, different docroot) | Vite `dist` built with the test API URL |
| `pb.test.obermillers.com` | A → `129.213.88.91` | Second PocketBase behind the **same** Caddy |

Do not point the test site at Oracle unless we want Caddy serving static files. Do not use a path-based API (`/pb-test`) — cookies, CORS, and the admin UI are worse. Do not spin a second Oracle VM.

A cloud agent running only `npm run dev` needs `pb.test` plus `VITE_POCKETBASE_URL`; the frontend subdomain is for a stable human URL and WebAuthn origins that are not `localhost`.

## Extra PocketBase (same VM, new loopback port, new data dir)

Caddy already owns 80/443. Hostname routing serves the second instance. **Do not open 8091 (or 8090) in the VCN/iptables.**

- Reuse the prod binary: `/opt/pocketbase/pocketbase`
- New unit: `pocketbase-test.service`
- Listen: `127.0.0.1:8091` (any free loopback port; not a public port)
- Data: `/opt/pocketbase-test/pb_data` — never prod `/opt/pocketbase/pb_data`
- Caddy extra site: `pb.test.obermillers.com` → `reverse_proxy 127.0.0.1:8091`
- Seed with `scripts/setup-pocketbase.mjs` against `POCKETBASE_URL=https://pb.test.obermillers.com`. Copying prod data is optional and messy (PII, WebAuthn credentials).
- Per-instance superuser, SMTP, Application URL
- Passkeys: RP ID / `applications` rows must include `https://test.obermillers.com` (and any Cursor preview origin if we hit the API from there)
- 1 OCPU / 6 GB can run two PocketBase processes

Example:

```
ExecStart=/opt/pocketbase/pocketbase serve --http=127.0.0.1:8091 --dir /opt/pocketbase-test/pb_data
```

## Frontend

```
VITE_POCKETBASE_URL=https://pb.test.obermillers.com npm run build
# rsync dist/ → DreamHost test docroot (e.g. ~/www/obermillers-test/)
```

Add `.env.staging` (or CI env) rather than overwriting `.env.production`.

## Deploy / cloud-agent rules

Prod stays push-to-`main` only (existing Publish workflow). Test is a **shared last-writer-wins slot**: a GitHub Actions workflow deploys the frontend to `test.obermillers.com` automatically on **every branch push** (feature branches included). Whoever pushed last is what is live on test.

- Embed the **git branch name** somewhere always visible on the test site (banner/footer plus a machine-readable hook such as `data-deploy-branch` or `window.__DEPLOY_BRANCH__`) so both a human and a cloud agent can tell which branch is currently deployed.
- Do not auto-deploy `main` to prod and test from the same job in a way that can clobber prod `pb_data`. Test frontend build always uses `VITE_POCKETBASE_URL=https://pb.test.obermillers.com`.
- PocketBase CI currently replaces `/opt/pocketbase/pocketbase` and restarts **prod** only. Sharing the binary is fine (install once, restart both units); do not point that Action at test `pb_data`.
- Give the agent SSH as secrets, scoped to the test docroot / test unit if possible.

## Work

- [ ] DNS: `test.obermillers.com` → DreamHost; `pb.test.obermillers.com` → Oracle `129.213.88.91`
- [ ] DreamHost vhost + docroot for the test site (Apache / `.htaccess` as prod)
- [ ] `pocketbase-test.service` on 8091 with separate `pb_data`
- [ ] Caddy site for `pb.test.obermillers.com` (loopback only)
- [ ] Superuser, SMTP, Application URL, seed collections, passkey `applications` for the test origin
- [ ] Test frontend build (`VITE_POCKETBASE_URL`) and rsync path
- [ ] Workflow: on every branch push, build with test PocketBase URL and rsync to the test docroot (shared last-writer-wins; must not touch prod `pb_data`)
- [ ] Show the deployed git branch name on the test site, visible to humans and agents
