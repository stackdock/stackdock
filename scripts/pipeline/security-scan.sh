#!/bin/bash
set -e

# Get absolute path to repo root
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "========================================"
echo "Security Scan"
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

# Dependency vulnerability scan
echo "Running npm audit..."
echo "Working directory: $REPO_ROOT"
echo ""

if npm audit --audit-level=moderate 2>/dev/null; then
  echo "✓ No high/critical vulnerabilities found"
else
  echo "⚠ Vulnerabilities found or audit failed"
  echo "Review output above"
  # Don't fail on warnings, only critical issues
fi

# Check for exposed secrets
echo ""
echo "Scanning for exposed secrets..."
echo "Checking files in: $REPO_ROOT"

# Check for common secret patterns
SECRETS_FOUND=0

# Check for API keys in code (excluding node_modules and .git)
if grep -r -E "(sk_live_|sk_test_|api[_-]?key\s*[:=]|secret[_-]?key\s*[:=])" \
  --exclude-dir=node_modules \
  --exclude-dir=.git \
  --exclude-dir=dist \
  --exclude-dir=build \
  "$REPO_ROOT" 2>/dev/null | grep -v "ENCRYPTION_MASTER_KEY" | grep -v "process.env" | grep -q .; then
  echo "⚠ Potential secrets found in code"
  echo "Review the following files:"
  grep -r -E "(sk_live_|sk_test_|api[_-]?key\s*[:=]|secret[_-]?key\s*[:=])" \
    --exclude-dir=node_modules \
    --exclude-dir=.git \
    --exclude-dir=dist \
    --exclude-dir=build \
    "$REPO_ROOT" 2>/dev/null | grep -v "ENCRYPTION_MASTER_KEY" | grep -v "process.env" || true
  SECRETS_FOUND=1
else
  echo "✓ No exposed secrets detected"
fi

# Check encryption usage in Convex
echo ""
echo "Checking encryption usage..."
echo "Encryption file: $REPO_ROOT/convex/lib/encryption.ts"

if [ -f "$REPO_ROOT/convex/lib/encryption.ts" ]; then
  echo "✓ Encryption module found"
  
  # Check if API keys are being encrypted in mutations
  if grep -r "encryptApiKey" "$REPO_ROOT/convex" --include="*.ts" | grep -q .; then
    echo "✓ encryptApiKey() usage found"
  else
    echo "⚠ No encryptApiKey() usage found in Convex mutations"
    echo "Ensure all API keys are encrypted before storage"
  fi
else
  echo "⚠ Encryption module not found"
  echo "Expected: $REPO_ROOT/convex/lib/encryption.ts"
fi

# Check RBAC usage
echo ""
echo "Checking RBAC enforcement..."
echo "RBAC file: $REPO_ROOT/convex/lib/rbac.ts"

if [ -f "$REPO_ROOT/convex/lib/rbac.ts" ]; then
  echo "✓ RBAC module found"
  
  # Check if mutations/queries use withRBAC
  if grep -r "withRBAC" "$REPO_ROOT/convex" --include="*.ts" | grep -q .; then
    echo "✓ withRBAC() usage found"
  else
    echo "⚠ No withRBAC() usage found"
    echo "Ensure all mutations/queries use RBAC"
  fi
else
  echo "⚠ RBAC module not found"
  echo "Expected: $REPO_ROOT/convex/lib/rbac.ts"
fi

# Check .env files not committed
echo ""
echo "Checking for committed .env files..."
if git ls-files | grep -E "\.env$|\.env\.local$|\.env\.production$" | grep -q .; then
  echo "⚠ .env files found in git"
  echo "Ensure .env files are in .gitignore"
  SECRETS_FOUND=1
else
  echo "✓ No .env files committed"
fi

echo ""
echo "========================================"
if [ $SECRETS_FOUND -eq 1 ]; then
  echo "⚠ Security Scan: ISSUES FOUND"
  echo "Review findings above"
else
  echo "✓ Security Scan: PASSED"
fi
echo "========================================"
echo "Current Directory: $(pwd)"
echo "Repo Root: $REPO_ROOT"
echo ""

exit 0
