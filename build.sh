#!/usr/bin/env bash
# Vercel build orchestrator for the Playground monorepo.
#
# Produces a single `dist/` directory that contains:
#   dist/index.html                 — the landing page
#   dist/styles.css                 — landing-page styles
#   dist/floor-plan-designer/...    — static export of the Next.js sub-app
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
OUT="$ROOT/dist"

rm -rf "$OUT"
mkdir -p "$OUT"

# 1. Landing page static assets.
cp "$ROOT/index.html" "$OUT/index.html"
cp "$ROOT/styles.css" "$OUT/styles.css"

# 2. Floor Plan Designer — static Next.js export.
cd "$ROOT/floor-plan-designer"
npm ci --prefer-offline --no-audit
npm run build
mkdir -p "$OUT/floor-plan-designer"
cp -r "$ROOT/floor-plan-designer/out/." "$OUT/floor-plan-designer/"

echo "Build complete → $OUT"
