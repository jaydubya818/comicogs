#!/usr/bin/env bash
set -euo pipefail
STRICT="${1:-}"   # pass "strict" to fail on test failures

echo "🧪 Installing & building frontend"
( cd frontend && npm ci && npm run build )

# unit/integration tests (if present)
if [ -f "frontend/package.json" ] && jq -e '.scripts.test' frontend/package.json >/dev/null 2>&1; then
  echo "🧪 Running frontend tests"
  if [ "$STRICT" = "strict" ]; then
    ( cd frontend && npm test )
  else
    ( cd frontend && npm test || true )
  fi
fi

# playwright e2e (if present)
if [ -f "playwright.config.ts" ] || [ -f "playwright.config.mjs" ] || [ -f "playwright.config.js" ]; then
  echo "🎭 Installing Playwright deps"
  npx playwright install --with-deps
  echo "🎭 Running Playwright tests"
  if [ "$STRICT" = "strict" ]; then
    npx playwright test
  else
    npx playwright test || true
  fi
fi

echo "✅ Debug run complete"
