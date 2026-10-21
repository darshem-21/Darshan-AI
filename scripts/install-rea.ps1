# Windows: installs REA (rea-agents) locally into backend\rea. Needs Node.js 22.19+.
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..\backend\rea")
npm ci --no-audit --no-fund
.\node_modules\.bin\rea.cmd --version
.\node_modules\.bin\rea.cmd mcp doctor
