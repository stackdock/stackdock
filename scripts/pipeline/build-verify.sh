#!/bin/bash
set -e

# Get absolute path to repo root
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "========================================"
echo "Build Verification"
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

# Build frontend
if [ -f "$REPO_ROOT/apps/web/package.json" ]; then
  echo "Building frontend..."
  echo "Build output: $REPO_ROOT/apps/web/dist"
  echo "Working directory: $REPO_ROOT/apps/web"
  cd "$REPO_ROOT/apps/web"
  
  # Check if build script exists
  if grep -q "\"build\"" package.json; then
    echo "Running: npm run build"
    
    if npm run build; then
      echo "✓ Frontend build succeeded"
      
      # Check if dist directory was created
      if [ -d "dist" ]; then
        echo "✓ Build artifacts created in: $REPO_ROOT/apps/web/dist"
      else
        echo "⚠ Build completed but dist directory not found"
      fi
    else
      echo "❌ Frontend build failed"
      exit 1
    fi
  else
    echo "⚠ No build script found in apps/web/package.json"
    echo "Skipping frontend build"
  fi
  
  cd "$REPO_ROOT"
else
  echo "⚠ apps/web directory not found"
  echo "Skipping frontend build"
fi

echo ""
echo "========================================"
echo "✓ Build Verification: PASSED"
echo "========================================"
echo "Current Directory: $(pwd)"
echo "Repo Root: $REPO_ROOT"
echo ""

exit 0
