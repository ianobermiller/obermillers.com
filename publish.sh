rsync \
  --archive \
  --verbose \
  --compress \
  --delete \
  --exclude='.git' \
  --exclude-from='.gitignore' \
  --exclude='blog' \
  --exclude='cal' \
  --exclude='museums' \
  --exclude='wp-content' \
  . \
  iano@obermillers.com:~/www/obermillers/