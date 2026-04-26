# Game Booster - Run Script for PowerShell
# Minimal working version

param([string]$Mode = "dev")

Write-Host "========================================" -ForegroundColor Blue
Write-Host "   Game Booster - Run Script" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue

if ($Mode -eq "help") {
    Write-Host "Usage: .\run.ps1 [-Mode <mode>]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Modes:"
    Write-Host "  dev      - Start development (Vite + Python)"
    Write-Host "  prod     - Build and start production"
    Write-Host "  frontend - Vite dev server only"
    Write-Host "  backend  - Python backend only"
    Write-Host "  build    - Build frontend only"
    Write-Host "  help     - Show this help"
    exit 0
}

Write-Host "Mode: $Mode" -ForegroundColor Cyan

# Check Node.js
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Host "Error: Node.js not found" -ForegroundColor Red
    exit 1
}

# Check Python
$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) { $python = Get-Command python3 -ErrorAction SilentlyContinue }
if (-not $python) {
    Write-Host "Error: Python not found" -ForegroundColor Red
    exit 1
}

# Run based on mode
if ($Mode -eq "dev") {
    Write-Host "Starting dev environment..." -ForegroundColor Green
    Start-Process -NoNewWindow npm -ArgumentList "run vite:dev"
    Start-Sleep 2
    Set-Location booster_app_export
    & $python main.py
    Set-Location ..
}
elseif ($Mode -eq "prod") {
    Write-Host "Starting production..." -ForegroundColor Green
    if (-not (Test-Path "booster_app_export\web\index.html")) {
        Write-Host "Building frontend..." -ForegroundColor Yellow
        npm run build
    }
    Set-Location booster_app_export
    & $python main.py
    Set-Location ..
}
elseif ($Mode -eq "frontend") {
    Write-Host "Starting frontend dev server..." -ForegroundColor Green
    npm run vite:dev
}
elseif ($Mode -eq "backend") {
    Write-Host "Starting backend..." -ForegroundColor Green
    if (-not (Test-Path "booster_app_export\web\index.html")) {
        Write-Host "Error: Frontend not built. Run build first." -ForegroundColor Red
        exit 1
    }
    Set-Location booster_app_export
    & $python main.py
    Set-Location ..
}
elseif ($Mode -eq "build") {
    Write-Host "Building frontend..." -ForegroundColor Green
    npm run build
    Write-Host "Build complete" -ForegroundColor Green
}
else {
    Write-Host "Error: Unknown mode $Mode" -ForegroundColor Red
    Write-Host "Use: .\run.ps1 help" -ForegroundColor Yellow
    exit 1
}