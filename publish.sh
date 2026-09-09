#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

npm run build

rsync \
  --archive \
  --verbose \
  --compress \
  --delete \
  --exclude='.git' \
  --exclude='.well-known' \
  --exclude='blog' \
  --exclude='museums' \
  --exclude='wp-content' \
  dist/ \
  iano@obermillers.com:~/www/obermillers/
