# Quick Start - Game Booster

This guide will help you quickly run the Game Booster application.

## Prerequisites
- Node.js (v18 or later)
- Python 3.8+
- Windows OS (recommended for full functionality)

## Quick Start

### Option 1: Using Run Scripts (Easiest)

**Windows Users:**
1. Open Command Prompt or PowerShell in the project directory
2. Run: `run.bat`
   - This will start the development environment automatically

**PowerShell Users:**
1. Open PowerShell in the project directory
2. Run: `.\run.ps1`
   - This will start the development environment

**Linux/macOS Users:**
1. Make the script executable: `chmod +x run.sh`
2. Run: `./run.sh`

### Option 2: Manual Steps

1. Install dependencies:
   ```bash
   npm install
   pip install -r requirements.txt
   ```

2. Run the app:
   ```bash
   # Build frontend and start backend
   npm run build
   npm run python:start
   ```

## Run Script Modes

The run scripts support different modes:

| Mode | Description | Command |
|------|-------------|---------|
| `dev` | Start development environment (Vite + Python) | `run.bat` or `.\run.ps1` |
| `prod` | Build frontend and start production app | `run.bat prod` |
| `frontend` | Start Vite dev server only (port 3000) | `run.bat frontend` |
| `backend` | Start Python backend only | `run.bat backend` |
| `build` | Build frontend only | `run.bat build` |
| `help` | Show help | `run.bat help` |

## Common Issues

1. **"Node.js not found"**: Install Node.js from https://nodejs.org/
2. **"Python not found"**: Install Python from https://www.python.org/
3. **Permission errors on Windows**: Run as Administrator for full functionality
4. **Frontend not building**: Run `npm install` first

## Development vs Production

- **Development mode**: Uses Vite dev server with hot reload (port 3000)
- **Production mode**: Uses built frontend files served by Python Eel

## Next Steps

- Check the main [README.md](README.md) for detailed documentation
- Run tests: `npm run test:ui` and `npm run test:backend`
- Build executable: `npm run build:exe`