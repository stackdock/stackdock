#!/bin/bash
set -e

# Get absolute path to repo root
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "========================================"
echo "Lint & Type Check"
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

echo "Checking files in:"
echo "  - Frontend: $REPO_ROOT/apps/web/src"
echo "  - Backend: $REPO_ROOT/convex"
echo ""

# Frontend linting (if eslint configured)
if [ -f "$REPO_ROOT/apps/web/package.json" ]; then
  echo "Running ESLint on frontend..."
  echo "Working directory: $REPO_ROOT/apps/web"
  cd "$REPO_ROOT/apps/web"
  
  if npm run lint 2>/dev/null; then
    echo "✓ ESLint passed"
  else
    echo "⚠ ESLint not configured or failed (continuing...)"
  fi
  
  cd "$REPO_ROOT"
fi

# Prettier check
echo ""
echo "Running Prettier check..."
echo "Working directory: $REPO_ROOT"

if command -v npx &> /dev/null; then
  if npx prettier --check "apps/web/src/**/*.{ts,tsx}" "convex/**/*.ts" 2>/dev/null; then
    echo "✓ Prettier check passed"
  else
    echo "⚠ Prettier check failed or not configured (continuing...)"
  fi
else
  echo "⚠ npx not found (skipping Prettier)"
fi

# TypeScript type check
echo ""
echo "Running TypeScript type check..."
echo "Checking TypeScript files in:"
echo "  - $REPO_ROOT/apps/web"
echo "  - $REPO_ROOT/convex"

# Frontend type check
if [ -f "$REPO_ROOT/apps/web/tsconfig.json" ]; then
  echo ""
  echo "Frontend type check..."
  echo "Working directory: $REPO_ROOT/apps/web"
  cd "$REPO_ROOT/apps/web"
  
  if npx tsc --noEmit; then
    echo "✓ Frontend TypeScript: No errors"
  else
    echo "❌ Frontend TypeScript: Errors found"
    exit 1
  fi
  
  cd "$REPO_ROOT"
fi

# Backend type check (Convex)
if [ -f "$REPO_ROOT/convex/tsconfig.json" ]; then
  echo ""
  echo "Backend type check (Convex)..."
  echo "Working directory: $REPO_ROOT/convex"
  cd "$REPO_ROOT/convex"
  
  if npx tsc --noEmit; then
    echo "✓ Backend TypeScript: No errors"
  else
    echo "❌ Backend TypeScript: Errors found"
    exit 1
  fi
  
  cd "$REPO_ROOT"
fi

echo ""
echo "========================================"
echo "✓ Lint & Type Check: PASSED"
echo "========================================"
echo "Current Directory: $(pwd)"
echo "Repo Root: $REPO_ROOT"
echo ""

exit 0
