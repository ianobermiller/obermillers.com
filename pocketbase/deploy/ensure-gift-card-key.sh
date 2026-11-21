#!/usr/bin/env bash
set -euo pipefail

# Run on the PocketBase host. Never replace an existing encryption key.
PB_USER="${PB_USER:-pocketbase}"
KEY_DIR=/etc/pocketbase
KEY_FILE="${KEY_DIR}/gift-card.key"

install -d -o root -g "${PB_USER}" -m 0750 "${KEY_DIR}"
if [[ -L "${KEY_FILE}" ]]; then
  echo "Refusing a symlink at ${KEY_FILE}" >&2
  exit 1
fi
if [[ ! -e "${KEY_FILE}" ]]; then
  command -v openssl >/dev/null || { echo "Install openssl before creating the gift card key" >&2; exit 1; }
  umask 077
  key_tmp="$(mktemp "${KEY_DIR}/.gift-card.key.XXXXXX")"
  trap 'rm -f "${key_tmp}"' EXIT
  openssl rand -base64 32 >"${key_tmp}"
  chown "${PB_USER}:${PB_USER}" "${key_tmp}"
  chmod 0600 "${key_tmp}"
  # Link atomically and refuse to replace a key created by another invocation.
  if ln "${key_tmp}" "${KEY_FILE}" 2>/dev/null; then
    echo "Created gift card key. Back it up separately from PocketBase data."
  elif [[ ! -f "${KEY_FILE}" ]]; then
    echo "Could not install gift card key" >&2
    exit 1
  fi
fi
chown "${PB_USER}:${PB_USER}" "${KEY_FILE}"
chmod 0600 "${KEY_FILE}"
