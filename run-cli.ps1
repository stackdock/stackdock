# PowerShell script to run the CLI using Bun from workspace root
# Usage: .\run-cli.ps1 [args]

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$cliPath = Join-Path $scriptPath "packages\cli\src\index.ts"

# Find bun.exe
$bunExe = $null
$bunPaths = @(
    "bun.exe",
    "$env:USERPROFILE\.bun\bin\bun.exe",
    "$env:LOCALAPPDATA\bun\bun.exe",
    "$env:ProgramFiles\bun\bun.exe"
)

foreach ($path in $bunPaths) {
    if ($path -eq "bun.exe") {
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
    Write-Host "Error: Bun not found. Install: https://bun.sh/docs/installation" -ForegroundColor Red
    Write-Host "Windows: powershell -c `"irm bun.sh/install.ps1 | iex`"" -ForegroundColor Yellow
    exit 1
}

# Run the CLI with Bun
& $bunExe run $cliPath $args
