# PocketBase on Oracle Cloud (Always Free)

This Go module lives in the [obermillers.com](https://github.com/ianobermiller/obermillers.com) monorepo at `pocketbase/` (next to `src/`, not part of the Vite hub).

Stack: **Oracle Linux ARM VM** → **Caddy** (HTTPS, Let’s Encrypt) → **PocketBase** on `127.0.0.1:8090`.

You need a domain. Let’s Encrypt will not issue a cert for a raw IP.

**Current instance:** `pb.obermillers.com` → `129.213.88.91` (us-ashburn-1, Oracle Linux 9, 1 OCPU / 6 GB). SSH user is **`opc`**. See [deploy/instance.md](deploy/instance.md).

This binary is a custom PocketBase (Go 1.27) with passkey routes. Relying parties and per-domain OTP subjects live in the `applications` collection.

---

## Initial setup

Do this once when bringing up a new VM.

### 1. Oracle account and VM

1. Sign up at [cloud.oracle.com](https://cloud.oracle.com). Home region should offer Ampere (e.g. Phoenix, Ashburn, Chicago). A card is required for identity; stay inside Always Free limits to avoid charges.
2. **Compute → Instances → Create instance**.
3. Image: **Canonical Ubuntu 24.04** (or 22.04). Oracle Linux 9 also works (`opc` instead of `ubuntu`).
4. Shape: **Ampere** / `VM.Standard.A1.Flex`. For PocketBase, **1 OCPU / 6 GB RAM** is plenty (Always Free allows up to 4 OCPU / 24 GB across A1). If Ampere is out of capacity, try another availability domain, another region, or the tiny Always Free AMD micro (`VM.Standard.E2.1.Micro`) and use the `amd64` binary.
5. Networking: assign a **public IPv4**. Download / paste your SSH public key.
6. Boot volume: 50 GB is enough; Always Free allows up to 200 GB.

```bash
ssh -i ~/.ssh/oracle-pocketbase opc@YOUR_PUBLIC_IP
```

Ampere capacity is often exhausted. Retry later or change AD/region rather than switching to a paid shape.

### 2. Open 80 and 443 (two places)

Oracle blocks HTTP/S until **both** the VCN and the guest firewall allow it. Do **not** open 8090 to the internet.

**VCN security list** (or NSG on the VNIC):

- Networking → Virtual Cloud Networks → your VCN → subnet → **Default Security List** (or the instance NSG)
- Add ingress, source `0.0.0.0/0`, TCP **80** and **443** (SSH 22 is already there)

**On the VM** (Oracle Ubuntu images drop 80/443 in iptables even after the security list is open). The setup script does this; if you skip the script:

```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo apt-get install -y iptables-persistent
sudo netfilter-persistent save
```

### 3. DNS

Create an **A** record: `pb.example.com` → instance public IPv4.

Wait until it resolves before running Caddy:

```bash
dig +short pb.example.com
```

If Oracle also gave you a public IPv6, either add an **AAAA** to the same hostname or ignore IPv6 clients. A mismatched AAAA will break TLS.

### 4. Install PocketBase + Caddy

From GitHub, on the VM:

```bash
sudo DOMAIN=pb.example.com REPO_URL=https://github.com/ianobermiller/obermillers.com.git \
  bash -c 'curl -fsSL https://raw.githubusercontent.com/ianobermiller/obermillers.com/main/pocketbase/deploy/setup.sh | bash'
```

Or copy this `pocketbase/` directory onto the VM and run `deploy/setup.sh` (it builds from the adjacent `go.mod`):

```bash
scp -r pocketbase opc@YOUR_PUBLIC_IP:pocketbase
ssh opc@YOUR_PUBLIC_IP
sudo DOMAIN=pb.example.com bash pocketbase/deploy/setup.sh
```

That installs Go, builds the binary, a dedicated `pocketbase` user, systemd, Caddy, and persistent iptables rules.

### 5. First superuser and dashboard

```bash
sudo -u pocketbase /opt/pocketbase/pocketbase superuser create YOU@example.com 'a-strong-password'
```

Open `https://pb.example.com/_/` .

**Settings → Application:**

- Application URL: `https://pb.example.com`
- User IP proxy headers: `X-Forwarded-For` (and `X-Real-IP` if you want both)

Turn on the built-in **rate limiter**. Configure **SMTP** (SendGrid, SES, etc.) so auth emails are not dropped as spam.

On first start the server adds a hidden JSON field `passkey_credentials` on `users`. PocketBase CORS defaults to allowing all origins; tighten it later if you want.

---

## Maintenance

The live host is `pb.obermillers.com`. SSH:

```bash
ssh -i ~/.ssh/oracle-pocketbase opc@129.213.88.91
```

### Logs

```bash
sudo systemctl status pocketbase caddy
sudo journalctl -u pocketbase -f
sudo journalctl -u caddy -f
```

### Deploy a new binary

Do not run `pocketbase update` — that only works for the stock GitHub binary.

Pushes to `main` that touch `pocketbase/` (or `.github/workflows/pocketbase.yml`) build `linux-arm64` in GitHub Actions and install it to `/opt/pocketbase/pocketbase` on this VM. Frontend-only pushes skip that job. The workflow secret is `POCKETBASE_SSH_KEY` (the `opc` key at `~/.ssh/oracle-pocketbase`). Port 8090 stays on loopback.

From a Mac (manual):

```bash
make linux-arm64
scp -i ~/.ssh/oracle-pocketbase dist/pocketbase-linux-arm64 opc@129.213.88.91:/tmp/pocketbase-linux-arm64
ssh -i ~/.ssh/oracle-pocketbase opc@129.213.88.91
sudo systemctl stop pocketbase
sudo install -o pocketbase -g pocketbase -m 0755 /tmp/pocketbase-linux-arm64 /opt/pocketbase/pocketbase
sudo systemctl start pocketbase
```

Or build on the VM from a checkout of this `pocketbase/` tree:

```bash
sudo systemctl stop pocketbase
sudo CGO_ENABLED=0 /usr/local/go/bin/go build -o /opt/pocketbase/pocketbase .
sudo chown pocketbase:pocketbase /opt/pocketbase/pocketbase
sudo systemctl start pocketbase
```

### Passkeys

Routes:

| Method | Path | Auth |
| --- | --- | --- |
| POST | `/api/passkey/register/begin` | logged-in `users` record |
| POST | `/api/passkey/register/finish` | logged-in `users` record |
| POST | `/api/passkey/login/begin` | public (`userId` or `email`) |
| POST | `/api/passkey/login/finish` | public (`userId` or `email`) |

The server picks the relying party from the request `Origin` header. Each RP ID is a registrable domain; **that host and all of its subdomains share passkeys**. Different RP IDs keep separate credentials on the same user record.

Configure domains in the Dashboard collection **`applications`** (superuser only):

| Field | Purpose |
| --- | --- |
| `domain` | RP ID (unique). This host and its subdomains share passkeys. |
| `name` | Passkey prompt name |
| `otp_subject` | If set, OTP emails from this domain use this subject instead of `OTP for {APP_NAME}` |
| `passkeys_enabled` | Allow WebAuthn on this domain |

The first boot seeds `obermillers.com`, `nfwavemakers.com` (OTP subject **NF Wavemakers Login Code**), and `localhost`. After that, edit records in the Admin UI — no rebuild.

| App origin | RP ID | Prompt | Shares keys with |
| --- | --- | --- | --- |
| `https://bank.obermillers.com` | `obermillers.com` | Obermiller | other `*.obermillers.com` |
| `https://pb.obermillers.com` | `obermillers.com` | Obermiller | same |
| `https://nfwavemakers.com` | `nfwavemakers.com` | NF Wavemakers | `*.nfwavemakers.com` only |
| `http://localhost` | `localhost` | PocketBase (local) | local only |

**Add a subdomain** of an existing RP (e.g. `notes.obermillers.com`): no change; it inherits the parent `domain`.

**Add a new company domain:** add an `applications` row. Do not rename a `domain` after people have registered keys; that invalidates those passkeys. Changing `name` or `otp_subject` is safe.

Client (`npm install pocketbase-passkey`). **Register** must send the PocketBase auth token (the upstream SDK does not). Login can use the SDK as-is:

```ts
import PocketBase from "pocketbase";
import { PocketBasePasskey } from "pocketbase-passkey";

const pb = new PocketBase("https://pb.obermillers.com");
const passkey = new PocketBasePasskey({ pb });

// After password/OAuth login:
await fetch(`${pb.baseUrl}/api/passkey/register/begin`, {
  method: "POST",
  headers: {
    Authorization: pb.authStore.token,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ userId: pb.authStore.record?.id }),
});
// …browser WebAuthn create, then POST /api/passkey/register/finish with the same Authorization header.

await passkey.login(userId); // or POST login/begin with { email }
```

### Backups and memory

Data lives in `/opt/pocketbase/pb_data`. Use Dashboard → Settings → Backups, or copy that directory while the service is stopped. Prefer off-box (S3) backups; Always Free instances can still be reclaimed or fail.

`GOMEMLIMIT` is `512MiB` in the unit file so Go GC stays polite on a small VM. Raise it if you grow RAM.
