#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

npm run build

rsync \
  --archive \
  --verbose \
  --delete \
  --exclude='.git' \
  --exclude='.well-known' \
  --exclude='blog' \
  --exclude='wp-content' \
  dist/ \
  iano@obermillers.com:~/www/obermillers/
