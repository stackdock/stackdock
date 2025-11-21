#!/bin/bash
# Bash script to run the CLI using tsx from workspace root

WORKSPACE_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TSX_PATH="$WORKSPACE_ROOT/node_modules/tsx/dist/cli.mjs"
CLI_PATH="$(cd "$(dirname "$0")" && pwd)/src/index.ts"

if [ -f "$TSX_PATH" ]; then
    node "$TSX_PATH" "$CLI_PATH" "$@"
else
    echo "Error: tsx not found at $TSX_PATH"
    echo "Please run 'npm install' from the workspace root"
    exit 1
fi
