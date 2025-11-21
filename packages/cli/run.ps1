# PowerShell script to run the CLI using Bun
# Bun is required for OpenTUI (supports WASM and .scm files)

$cliPath = Join-Path $PSScriptRoot "src\index.ts"

# Find bun.exe - try common locations
$bunExe = $null
$bunPaths = @(
    "bun.exe",
    "$env:USERPROFILE\.bun\bin\bun.exe",
    "$env:LOCALAPPDATA\bun\bun.exe",
    "$env:ProgramFiles\bun\bun.exe"
)

foreach ($path in $bunPaths) {
    if ($path -eq "bun.exe") {
        # Try to find in PATH
        $found = Get-Command bun.exe -ErrorAction SilentlyContinue
        if ($found) {
            $bunExe = $found.Source
            break
        }
    } elseif (Test-Path $path) {
        $bunExe = $path
        break
    }
}

if (-not $bunExe) {
    Write-Host "Error: Bun not found. Bun is required for this CLI." -ForegroundColor Red
    Write-Host "Install Bun: https://bun.sh/docs/installation" -ForegroundColor Yellow
    Write-Host "Windows: powershell -c `"irm bun.sh/install.ps1 | iex`"" -ForegroundColor Yellow
    exit 1
}

# Run the CLI with Bun
& $bunExe run $cliPath $args
