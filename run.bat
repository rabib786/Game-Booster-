@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM Game Booster - Run Script for Windows
REM This script provides multiple ways to run the Game Booster application

echo ========================================
echo    Game Booster - Run Script
echo ========================================

if "%1"=="" (
    set MODE=dev
) else (
    set MODE=%1
)

if "%MODE%"=="help" goto :help
if "%MODE%"=="--help" goto :help
if "%MODE%"=="-h" goto :help

goto :%MODE% 2>nul
if errorlevel 1 goto :unknown_mode

:dev
    echo Starting development environment...
    echo This will start both the Vite dev server and Python backend
    
    REM Check dependencies
    call :check_dependencies
    
    REM Start Vite dev server in background
    echo Starting Vite dev server on port 3000...
    start "Vite Dev Server" cmd /c "npm run vite:dev"
    
    REM Wait a moment for dev server to start
    timeout /t 3 /nobreak >nul
    
    REM Start Python backend
    echo Starting Python backend...
    cd booster_app_export
    python main.py
    
    goto :eof

:prod
    echo Starting production app...
    
    call :check_dependencies
    
    REM Check if frontend is built
    if not exist "booster_app_export\web" (
        echo Frontend not built. Building now...
        call :build_frontend
    ) else (
        dir /b "booster_app_export\web" >nul 2>&1
        if errorlevel 1 (
            echo Frontend not built. Building now...
            call :build_frontend
        ) else (
            echo ✓ Frontend already built
        )
    )
    
    echo Starting Python backend...
    cd booster_app_export
    python main.py
    
    goto :eof

:frontend
    echo Starting Vite dev server only...
    call :check_dependencies
    npm run vite:dev
    goto :eof

:backend
    echo Starting Python backend only...
    
    call :check_dependencies
    
    REM Check if frontend is built
    if not exist "booster_app_export\web" (
        echo Error: Frontend not built. Please run "run.bat build" first
        exit /b 1
    )
    
    dir /b "booster_app_export\web" >nul 2>&1
    if errorlevel 1 (
        echo Error: Frontend not built. Please run "run.bat build" first
        exit /b 1
    )
    
    cd booster_app_export
    python main.py
    goto :eof

:build
    echo Building frontend...
    call :check_dependencies
    call :build_frontend
    echo ✓ Frontend built successfully
    echo You can now run "run.bat prod" to start the production app
    goto :eof

:help
    echo Usage: run.bat [mode]
    echo.
    echo Modes:
    echo   dev           - Start development environment (Vite dev server + Python backend)
    echo   prod          - Build frontend and start production Python app
    echo   frontend      - Start Vite dev server only (port 3000)
    echo   backend       - Start Python backend only (requires built frontend)
    echo   build         - Build frontend only
    echo   help          - Show this help message
    echo.
    echo If no mode is specified, defaults to 'dev'
    goto :eof

:unknown_mode
    echo Error: Unknown mode '%MODE%'
    call :help
    exit /b 1

:check_dependencies
    echo Checking dependencies...
    
    REM Check for Node.js/npm
    where node >nul 2>&1
    if errorlevel 1 (
        echo ✗ Node.js is not installed
        echo Please install Node.js from https://nodejs.org/
        exit /b 1
    )
    echo ✓ Node.js is installed
    
    REM Check for Python
    where python >nul 2>&1
    if errorlevel 1 (
        where python3 >nul 2>&1
        if errorlevel 1 (
            echo ✗ Python is not installed
            echo Please install Python from https://www.python.org/
            exit /b 1
        )
    )
    echo ✓ Python is installed
    
    REM Check for npm packages
    if exist "package.json" (
        echo Checking npm dependencies...
        if exist "node_modules" (
            echo ✓ node_modules directory exists
        ) else (
            echo ⚠ node_modules not found. Installing dependencies...
            npm install
        )
    )
    
    REM Check for Python dependencies
    if exist "requirements.txt" (
        echo Checking Python dependencies...
        python -m pip install -r requirements.txt 2>nul || (
            python3 -m pip install -r requirements.txt 2>nul || (
                echo ⚠ Could not install Python dependencies automatically
            )
        )
    )
    
    exit /b 0

:build_frontend
    npm run build
    exit /b 0

:eof
endlocal