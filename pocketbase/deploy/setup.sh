#!/usr/bin/env bash
# PocketBase + Caddy on Ubuntu (apt) or Oracle Linux (dnf).
# Builds a custom binary with pocketbase-passkey WebAuthn routes.
# Usage: sudo DOMAIN=pb.example.com ./setup.sh
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run as root: sudo DOMAIN=pb.example.com $0" >&2
  exit 1
fi

DOMAIN="${DOMAIN:-}"
if [[ -z "${DOMAIN}" ]]; then
  echo "Set DOMAIN to a hostname that already points at this VM." >&2
  exit 1
fi

GO_VERSION="${GO_VERSION:-1.27.1}"
PB_DIR="${PB_DIR:-/opt/pocketbase}"
PB_USER="${PB_USER:-pocketbase}"
GOMEMLIMIT="${GOMEMLIMIT:-512MiB}"
REPO_URL="${REPO_URL:-}"

arch="$(uname -m)"
case "${arch}" in
  aarch64|arm64) PB_ARCH="arm64" ;;
  x86_64|amd64) PB_ARCH="amd64" ;;
  *)
    echo "Unsupported architecture: ${arch}" >&2
    exit 1
    ;;
esac

. /etc/os-release
ID_LIKE="${ID_LIKE:-}"

is_debian() {
  [[ "${ID:-}" == "ubuntu" || "${ID:-}" == "debian" || "${ID_LIKE}" == *debian* ]]
}

is_rhel() {
  [[ "${ID:-}" == "ol" || "${ID:-}" == "rhel" || "${ID:-}" == "centos" || "${ID:-}" == "fedora" || "${ID_LIKE}" == *fedora* || "${ID_LIKE}" == *rhel* ]]
}

open_http_ports() {
  if command -v firewall-cmd >/dev/null 2>&1 && systemctl is-active --quiet firewalld; then
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --reload
  fi
  if command -v iptables >/dev/null 2>&1; then
    if ! iptables -C INPUT -p tcp -m state --state NEW --dport 80 -j ACCEPT 2>/dev/null; then
      iptables -I INPUT 1 -m state --state NEW -p tcp --dport 80 -j ACCEPT || true
    fi
    if ! iptables -C INPUT -p tcp -m state --state NEW --dport 443 -j ACCEPT 2>/dev/null; then
      iptables -I INPUT 1 -m state --state NEW -p tcp --dport 443 -j ACCEPT || true
    fi
    if command -v netfilter-persistent >/dev/null 2>&1; then
      netfilter-persistent save || true
    fi
  fi
}

install_packages() {
  if is_debian; then
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq
    apt-get install -y -qq curl git unzip ca-certificates debian-keyring debian-archive-keyring apt-transport-https gnupg iptables-persistent
    if ! command -v caddy >/dev/null 2>&1; then
      curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
        | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
      curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
        | tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
      chmod o+r /usr/share/keyrings/caddy-stable-archive-keyring.gpg /etc/apt/sources.list.d/caddy-stable.list
      apt-get update -qq
      apt-get install -y -qq caddy
    fi
  elif is_rhel; then
    dnf install -y curl git unzip ca-certificates gnupg2 dnf-plugins-core
    if ! command -v caddy >/dev/null 2>&1; then
      dnf copr enable -y @caddy/caddy
      dnf install -y caddy
    fi
  else
    echo "Unsupported distro: ${ID:-unknown}" >&2
    exit 1
  fi
}

install_go() {
  export PATH="/usr/local/go/bin:${PATH}"
  if command -v go >/dev/null 2>&1; then
    local have
    have="$(go env GOVERSION 2>/dev/null || true)"
    if [[ "${have}" == "go${GO_VERSION}" ]]; then
      return
    fi
  fi
  local tmp_go
  tmp_go="$(mktemp)"
  curl -fsSL "https://go.dev/dl/go${GO_VERSION}.linux-${PB_ARCH}.tar.gz" -o "${tmp_go}"
  rm -rf /usr/local/go
  tar -C /usr/local -xzf "${tmp_go}"
  rm -f "${tmp_go}"
  export PATH="/usr/local/go/bin:${PATH}"
}

resolve_source() {
  local script_dir repo_root
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  repo_root="$(cd "${script_dir}/.." && pwd)"
  if [[ -f "${repo_root}/go.mod" && -f "${repo_root}/passkey.go" ]]; then
    echo "${repo_root}"
    return
  fi
  if [[ -z "${REPO_URL}" ]]; then
    echo "No Go source next to deploy/, and REPO_URL is unset." >&2
    echo "Copy this pocketbase/ tree onto the VM or set REPO_URL to the obermillers.com git remote." >&2
    exit 1
  fi
  local src
  src="$(mktemp -d)"
  git clone --depth 1 "${REPO_URL}" "${src}"
  if [[ -f "${src}/go.mod" && -f "${src}/passkey.go" ]]; then
    echo "${src}"
    return
  fi
  if [[ -f "${src}/pocketbase/go.mod" && -f "${src}/pocketbase/passkey.go" ]]; then
    echo "${src}/pocketbase"
    return
  fi
  echo "Cloned ${REPO_URL} but could not find go.mod + passkey.go at the repo root or in pocketbase/." >&2
  exit 1
}

install_packages
open_http_ports

if ! id -u "${PB_USER}" >/dev/null 2>&1; then
  useradd --system --home "${PB_DIR}" --shell /usr/sbin/nologin "${PB_USER}"
fi

install -d -o "${PB_USER}" -g "${PB_USER}" -m 0750 "${PB_DIR}"
install -d -o "${PB_USER}" -g "${PB_USER}" -m 0750 "${PB_DIR}/pb_data"

install_go
SRC="$(resolve_source)"
echo "Building PocketBase with passkey support from ${SRC}"
CGO_ENABLED=0 go build -C "${SRC}" -o "${PB_DIR}/pocketbase" .
chown "${PB_USER}:${PB_USER}" "${PB_DIR}/pocketbase"
chmod 0755 "${PB_DIR}/pocketbase"

cat >/etc/systemd/system/pocketbase.service <<EOF
[Unit]
Description=PocketBase
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=${PB_USER}
Group=${PB_USER}
WorkingDirectory=${PB_DIR}
ExecStart=${PB_DIR}/pocketbase serve --http=127.0.0.1:8090
Restart=always
RestartSec=5s
LimitNOFILE=4096
Environment=GOMEMLIMIT=${GOMEMLIMIT}
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=${PB_DIR}

[Install]
WantedBy=multi-user.target
EOF

cat >/etc/caddy/Caddyfile <<EOF
${DOMAIN} {
	encode gzip
	request_body {
		max_size 32MB
	}
	reverse_proxy 127.0.0.1:8090 {
		header_up X-Real-IP {remote_host}
		header_up X-Forwarded-For {remote_host}
		header_up X-Forwarded-Proto {scheme}
		transport http {
			read_timeout 360s
		}
	}
}
EOF

systemctl daemon-reload
systemctl enable --now pocketbase
caddy validate --config /etc/caddy/Caddyfile
systemctl enable --now caddy
systemctl reload caddy

echo
echo "PocketBase with passkeys (${PB_ARCH}) is listening on 127.0.0.1:8090"
echo "Caddy is terminating TLS for https://${DOMAIN}"
echo "Passkey relying parties and OTP subjects are in the applications collection"
echo
echo "Create a superuser:"
echo "  sudo -u ${PB_USER} ${PB_DIR}/pocketbase superuser create EMAIL 'PASSWORD'"
echo
echo "If HTTPS fails, confirm DNS A record and OCI security list + host firewall for 80/443."
echo "  journalctl -u caddy -n 50 --no-pager"
echo "  journalctl -u pocketbase -n 50 --no-pager"
