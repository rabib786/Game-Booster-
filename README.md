<div align="center">
  <h1 style="font-size: 3rem;">Nexus Booster</h1>
  <p>A lightweight, powerful Game & System Booster app built with React, Vite, Python, and Eel.</p>
</div>

## Overview
Nexus Booster is an all-in-one desktop application designed to improve your gaming and system performance. Think of it as a lightweight alternative to Razer Cortex.

It consists of two main components running seamlessly as one desktop application:
- **Frontend**: A sleek, modern UI built with React, Tailwind CSS, and Vite.
- **Backend**: A robust Python backend utilizing `psutil`, `os`, and Windows Registry (`winreg`) to execute system-level operations cleanly.

## Features
- **Game Booster**: Frees up RAM and CPU by safely killing non-essential background processes (Spotify, Chrome, Discord, etc.).
- **System Cleaner**: Reclaims disk space by thoroughly and safely wiping the Windows `%TEMP%` directory.
- **Startup Optimizer**: Improves boot times by disabling non-essential applications from the Windows startup registry.

## Prerequisites
To run and build this project locally, you will need:
- [Node.js](https://nodejs.org/) (for building the React UI)
- [Python 3.8+](https://www.python.org/) (for running the desktop app)

## Installation & Setup

1. **Install Node Dependencies**
   Open a terminal in the root directory and run:
   ```bash
   npm i
   ```

2. **Install Python Dependencies**
   You need `eel`, `psutil`, and `pyinstaller` installed in your Python environment:
   ```bash
   pip install -r requirements.txt
   ```

## Running the Application

### Using Run Scripts (Recommended)
We provide convenient run scripts for different platforms:

**Windows (Batch):**
```bash
run.bat [mode]
```

**Windows (PowerShell):**
```powershell
.\run.ps1 [-Mode <mode>]
```

**Linux/macOS (Bash):**
```bash
./run.sh [mode]
```

Available modes:
- `dev` - Start development environment (Vite dev server + Python backend)
- `prod` - Build frontend and start production Python app
- `frontend` - Start Vite dev server only (port 3000)
- `backend` - Start Python backend only (requires built frontend)
- `build` - Build frontend only
- `help` - Show help message

Examples:
```bash
# Start development environment (default)
run.bat
.\run.ps1
./run.sh

# Build and run production app
run.bat prod
.\run.ps1 -Mode prod
./run.sh prod

# Build frontend only
run.bat build
```

### The Complete Desktop App (Manual)
This application must be run on Windows and ideally with **Administrator privileges** to properly clean files and optimize the registry.

1. First, build the React frontend:
   ```bash
   npm run build
   ```
2. Then, run the Python application:
   ```bash
   npm run python:start
   ```
   *This will launch a native desktop window serving the React UI connected to the Python backend!*

### Packaging as a Standalone Executable (.exe)
To package the entire application (frontend and backend) into a single `.exe` file that can be launched easily on a Windows PC without requiring Python or Node to be installed, simply run:

```bash
npm run build:exe
```
After the build process completes, your standalone executable will be located at `booster_app_export/dist/main.exe`.

### Web Preview Mode (Development)
If you only want to work on the UI without executing real Python system commands, you can run the web preview:
```bash
npm run vite:dev
```

## Testing

We have full test coverage for both the frontend UI and the backend system logic.

- **Test Frontend (Vitest)**
  ```bash
  npm run test:ui
  ```

- **Test Backend (Pytest)**
  ```bash
  npm run test:backend
  ```

## Architecture Notes
We use [Eel](https://github.com/python-eel/Eel) to bridge the gap between Python and JavaScript. During the `npm run build` step, Vite compiles the React app into the `booster_app_export/web` directory, which Python then serves as a local desktop window.
