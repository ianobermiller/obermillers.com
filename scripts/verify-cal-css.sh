#!/usr/bin/env bash
# Confirms the Color Calendar design tokens survive a production build: the
# light and dark token definitions, the Tailwind utilities generated from them,
# and the two hand-written day-fill rules.
#
# Counts occurrences rather than matching lines, since the built CSS is minified
# onto a single line.
set -euo pipefail

cd "$(dirname "$0")/.."

css=$(grep -l 'cc-page' dist/assets/*.css | head -1)
echo "checking $css"
echo

fail=0
count() { grep -o -- "$1" "$css" | wc -l | tr -d ' '; }

echo "-- token definitions (expect 2: :root and .dark) --"
for token in cc-page cc-surface cc-inset cc-rule cc-border cc-text cc-muted \
  cc-accent cc-danger cc-day-ink cc-day-amount cc-day-mix; do
  n=$(count "\--$token:")
  printf '  %-16s %s\n' "$token" "$n"
  [ "$n" -eq 2 ] || { echo "     ^ expected 2, got $n"; fail=1; }
done

echo
echo "-- generated utilities --"
for util in bg-cc-page bg-cc-surface bg-cc-surface-2 bg-cc-inset text-cc-text \
  text-cc-muted text-cc-faint text-cc-day-ink text-cc-danger border-cc-border \
  border-cc-rule bg-cc-accent text-cc-accent-text font-cc; do
  n=$(count "\.$util")
  printf '  %-22s %s\n' "$util" "$n"
  [ "$n" -ge 1 ] || { echo "     ^ utility was never generated"; fail=1; }
done

echo
echo "-- day fill rules (a plain fallback plus the color-mix) --"
for rule in cc-fill cc-half; do
  n=$(count "\.$rule{")
  printf '  %-10s %s rule(s)\n' "$rule" "$n"
  [ "$n" -ge 1 ] || { echo "     ^ rule missing"; fail=1; }
  grep -o "\.$rule{[^}]*}" "$css" | sed 's/^/     /'
done

echo
echo "-- inter font --"
n=$(ls dist/assets | grep -ci inter || true)
echo "  $n font file(s)"
[ "$n" -ge 1 ] || { echo "     ^ Inter was not bundled"; fail=1; }

echo
if [ "$fail" -eq 0 ]; then
  echo "OK — all Color Calendar tokens, utilities and rules present"
else
  echo "FAILED"
  exit 1
fi
