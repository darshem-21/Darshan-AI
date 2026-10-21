#!/usr/bin/env bash
# Installs REA (https://github.com/morluto/rea, npm: rea-agents) as a pinned local
# dependency of the backend. Requires Node.js 22.19+ (or 24.11+/26+) and npm.
set -euo pipefail
cd "$(dirname "$0")/../backend/rea"
npm ci --no-audit --no-fund
./node_modules/.bin/rea --version
./node_modules/.bin/rea mcp doctor | head -5
echo "REA installed. Set ENABLE_REA_CLI_EXECUTION=true in backend/.env to allow approved runs."
