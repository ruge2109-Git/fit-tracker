# Pre-commit script for Windows PowerShell
# Runs linting, type checking, and formatting before commit

$ErrorActionPreference = "Stop"

Write-Host "Running pre-commit checks..." -ForegroundColor Cyan

# Function to print status
function Print-Status {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Print-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Print-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

# Check if we're in a git repository
$gitCheck = git rev-parse --git-dir 2>&1
if ($LASTEXITCODE -ne 0) {
    Print-Error "Not a git repository"
    exit 1
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Print-Warning "node_modules not found. Installing dependencies..."
    npm install
}

# 1. Type checking
Print-Status "Running TypeScript type check..."
if (Test-Path "package.json" -PathType Leaf) {
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    if ($packageJson.scripts.'type-check') {
        npm run type-check
    } else {
        npx tsc --noEmit
    }
} else {
    npx tsc --noEmit
}

if ($LASTEXITCODE -ne 0) {
    Print-Error "Type check failed"
    exit 1
}
Print-Status "Type check passed"

# 2. Linting
Print-Status "Running ESLint..."
npm run lint
if ($LASTEXITCODE -ne 0) {
    Print-Error "Linting failed"
    exit 1
}
Print-Status "Linting passed"

# 3. Check for console.log/error/warn (excluding logger.ts and comments)
Print-Status "Checking for console statements..."
$consoleMatches = Get-ChildItem -Path "src" -Include "*.ts","*.tsx" -Recurse -Exclude "logger.ts" | 
    Select-String -Pattern "console\.(log|error|warn|debug)" -ErrorAction SilentlyContinue |
    Where-Object { 
        $line = $_.Line.Trim()
        # Exclude lines that are comments or inside logger.ts
        -not $line.StartsWith("//") -and 
        -not $line.StartsWith("*") -and
        -not $_.Path -like "*logger.ts"
    }
if ($consoleMatches) {
    Print-Warning "Found console statements. Consider using logger service instead."
    $consoleMatches | ForEach-Object { Write-Host "  $($_.Path):$($_.LineNumber)" -ForegroundColor Yellow }
} else {
    Print-Status "No console statements found"
}

# 4. Check for TODO/FIXME comments
Print-Status "Checking for TODO/FIXME comments..."
$todos = Select-String -Path "src\**\*.ts","src\**\*.tsx" -Pattern "TODO|FIXME" -ErrorAction SilentlyContinue
if ($todos) {
    $count = ($todos | Measure-Object).Count
    Print-Warning "Found $count TODO/FIXME comments"
    $todos | ForEach-Object { Write-Host "  $($_.Path):$($_.LineNumber) - $($_.Line.Trim())" -ForegroundColor Yellow }
}

# Success
Write-Host ""
Print-Status "All pre-commit checks passed!"
exit 0

