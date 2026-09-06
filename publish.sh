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
  --exclude='blog' \
  --exclude='cal' \
  --exclude='museums' \
  --exclude='wp-content' \
  dist/ \
  iano@obermillers.com:~/www/obermillers/
