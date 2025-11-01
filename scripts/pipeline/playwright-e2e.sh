#!/bin/bash
set -e

# Get absolute path to repo root
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "========================================"
echo "E2E Tests (Playwright)"
echo "========================================"
echo "Current Directory: $(pwd)"
echo "Repo Root: $REPO_ROOT"
echo ""

cd "$REPO_ROOT"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "ERROR: package.json not found. Are you in the repo root?"
  echo "Expected location: $REPO_ROOT/package.json"
  exit 2
fi

# Check if Playwright is configured
if [ -f "$REPO_ROOT/apps/web/package.json" ]; then
  echo "Checking for Playwright configuration..."
  echo "Test location: $REPO_ROOT/apps/web/e2e/**/*.spec.ts"
  echo "Working directory: $REPO_ROOT/apps/web"
  cd "$REPO_ROOT/apps/web"
  
  # Check if playwright is in package.json
  if grep -q "playwright" package.json 2>/dev/null || [ -f "playwright.config.ts" ] || [ -f "playwright.config.js" ]; then
    echo "Playwright detected. Running E2E tests..."
    
    # Check if tests exist
    if [ -d "e2e" ] && find e2e -name "*.spec.ts" -o -name "*.spec.js" | grep -q .; then
      if npm run test:e2e 2>/dev/null || npx playwright test 2>/dev/null; then
        echo "✓ E2E tests passed"
      else
        echo "❌ E2E tests failed"
        exit 1
      fi
    else
      echo "⚠ No E2E test files found in $REPO_ROOT/apps/web/e2e"
      echo "Skipping E2E tests"
    fi
  else
    echo "⚠ Playwright not configured"
    echo "To enable E2E tests:"
    echo "  1. Install: npm install -D @playwright/test"
    echo "  2. Initialize: npx playwright install"
    echo "  3. Create tests in: $REPO_ROOT/apps/web/e2e/"
    echo "Skipping E2E tests"
  fi
  
  cd "$REPO_ROOT"
else
  echo "⚠ apps/web directory not found"
  echo "Skipping E2E tests"
fi

echo ""
echo "========================================"
echo "✓ E2E Tests: COMPLETED"
echo "========================================"
echo "Current Directory: $(pwd)"
echo "Repo Root: $REPO_ROOT"
echo ""

exit 0
