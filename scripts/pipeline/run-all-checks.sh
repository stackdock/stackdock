#!/bin/bash
set -e

# Get absolute path to repo root
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "========================================"
echo "StackDock Pipeline: Running All Checks"
echo "========================================"
echo ""
echo "Current Directory: $(pwd)"
echo "Repo Root: $REPO_ROOT"
echo ""

# Change to repo root
cd "$REPO_ROOT"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "ERROR: package.json not found. Are you in the repo root?"
  echo "Expected location: $REPO_ROOT/package.json"
  exit 2
fi

echo "========================================"
echo "[1/6] Lint & Type Check"
echo "========================================"
echo "Script: $REPO_ROOT/scripts/pipeline/lint-type-check.sh"
"$REPO_ROOT/scripts/pipeline/lint-type-check.sh"
echo ""

echo "========================================"
echo "[2/6] Unit Tests (Vitest)"
echo "========================================"
echo "Script: $REPO_ROOT/scripts/pipeline/vitest-unit.sh"
"$REPO_ROOT/scripts/pipeline/vitest-unit.sh"
echo ""

echo "========================================"
echo "[3/6] E2E Tests (Playwright)"
echo "========================================"
echo "Script: $REPO_ROOT/scripts/pipeline/playwright-e2e.sh"
"$REPO_ROOT/scripts/pipeline/playwright-e2e.sh"
echo ""

echo "========================================"
echo "[4/6] Security Scan"
echo "========================================"
echo "Script: $REPO_ROOT/scripts/pipeline/security-scan.sh"
"$REPO_ROOT/scripts/pipeline/security-scan.sh"
echo ""

echo "========================================"
echo "[5/6] Build Verification"
echo "========================================"
echo "Script: $REPO_ROOT/scripts/pipeline/build-verify.sh"
"$REPO_ROOT/scripts/pipeline/build-verify.sh"
echo ""

echo "========================================"
echo "[6/6] Principle Engineer Checks"
echo "========================================"
echo "All automated checks passed."
echo "Principle engineers should review code and update stand-downs:"
echo "Stand-downs file: $REPO_ROOT/stand-downs/agent-sessions.json"
echo ""

echo "========================================"
echo "✅ All Pipeline Checks Passed"
echo "========================================"
echo "Current Directory: $(pwd)"
echo "Repo Root: $REPO_ROOT"
echo ""
echo "Next steps:"
echo "1. Principle engineers review code"
echo "2. Update stand-downs: $REPO_ROOT/stand-downs/agent-sessions.json"
echo "3. All agents must approve before merge"
echo ""

exit 0
