#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

rsync \
  --archive \
  --verbose \
  --compress \
  --delete \
  src/bank/subdomain-redirect/ \
  iano@obermillers.com:~/public_html/bank/
