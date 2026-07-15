#!/usr/bin/env bash
# Repo-specific checks (React / TS). tsc type check + vite build (see the
# "build" script in package.json).
set -euo pipefail

npm ci
npm run build
