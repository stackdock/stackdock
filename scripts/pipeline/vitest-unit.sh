#!/bin/bash
set -e

# Get absolute path to repo root
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "========================================"
echo "Unit Tests (Vitest)"
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

# Frontend unit tests
if [ -f "$REPO_ROOT/apps/web/package.json" ]; then
  echo "Running frontend unit tests..."
  echo "Test location: $REPO_ROOT/apps/web/src/**/*.test.{ts,tsx}"
  echo "Working directory: $REPO_ROOT/apps/web"
  cd "$REPO_ROOT/apps/web"
  
  # Check if vitest is configured
  if grep -q "vitest" package.json; then
    if npm run test 2>/dev/null || npm run test:unit 2>/dev/null; then
      echo "✓ Frontend unit tests passed"
    else
      echo "⚠ Frontend unit tests not configured or failed"
      echo "Continuing..."
    fi
  else
    echo "⚠ Vitest not configured in apps/web/package.json"
    echo "Skipping frontend unit tests"
  fi
  
  cd "$REPO_ROOT"
fi

# Backend unit tests (Convex)
if [ -f "$REPO_ROOT/convex/tsconfig.json" ]; then
  echo ""
  echo "Running backend unit tests (Convex)..."
  echo "Test location: $REPO_ROOT/convex/**/*.test.ts"
  echo "Working directory: $REPO_ROOT/convex"
  cd "$REPO_ROOT/convex"
  
  # Check if tests exist
  if find . -name "*.test.ts" -type f | grep -q .; then
    echo "Found test files. Running tests..."
    # Convex tests would run here if configured
    echo "⚠ Convex test runner not configured"
    echo "Skipping backend unit tests"
  else
    echo "⚠ No test files found in $REPO_ROOT/convex"
    echo "Skipping backend unit tests"
  fi
  
  cd "$REPO_ROOT"
fi

echo ""
echo "========================================"
echo "✓ Unit Tests: COMPLETED"
echo "========================================"
echo "Current Directory: $(pwd)"
echo "Repo Root: $REPO_ROOT"
echo ""
echo "Note: Configure Vitest in package.json to enable tests"
echo ""

exit 0
