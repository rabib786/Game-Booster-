#!/bin/bash

# Game Booster - Run Script
# This script provides multiple ways to run the Game Booster application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}   Game Booster - Run Script${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_usage() {
    echo "Usage: $0 [mode]"
    echo ""
    echo "Modes:"
    echo "  dev           - Start development environment (Vite dev server + Python backend)"
    echo "  prod          - Build frontend and start production Python app"
    echo "  frontend      - Start Vite dev server only (port 3000)"
    echo "  backend       - Start Python backend only (requires built frontend)"
    echo "  build         - Build frontend only"
    echo "  help          - Show this help message"
    echo ""
    echo "If no mode is specified, defaults to 'dev'"
}

check_dependencies() {
    echo -e "${YELLOW}Checking dependencies...${NC}"
    
    # Check for Node.js/npm
    if command -v node &> /dev/null; then
        echo -e "${GREEN}✓ Node.js is installed${NC}"
    else
        echo -e "${RED}✗ Node.js is not installed${NC}"
        echo "Please install Node.js from https://nodejs.org/"
        return 1
    fi
    
    # Check for Python
    if command -v python3 &> /dev/null; then
        echo -e "${GREEN}✓ Python 3 is installed${NC}"
    elif command -v python &> /dev/null; then
        echo -e "${GREEN}✓ Python is installed${NC}"
    else
        echo -e "${RED}✗ Python is not installed${NC}"
        echo "Please install Python from https://www.python.org/"
        return 1
    fi
    
    # Check for npm packages
    if [ -f "package.json" ]; then
        echo -e "${YELLOW}Checking npm dependencies...${NC}"
        if [ -d "node_modules" ]; then
            echo -e "${GREEN}✓ node_modules directory exists${NC}"
        else
            echo -e "${YELLOW}⚠ node_modules not found. Installing dependencies...${NC}"
            npm install
        fi
    fi
    
    # Check for Python dependencies
    if [ -f "requirements.txt" ]; then
        echo -e "${YELLOW}Checking Python dependencies...${NC}"
        python3 -m pip install -r requirements.txt 2>/dev/null || \
        python -m pip install -r requirements.txt 2>/dev/null || \
        echo -e "${YELLOW}⚠ Could not install Python dependencies automatically${NC}"
    fi
    
    return 0
}

run_dev() {
    echo -e "${GREEN}Starting development environment...${NC}"
    echo -e "${YELLOW}This will start both the Vite dev server and Python backend${NC}"
    
    # Start Vite dev server in background
    echo -e "${BLUE}Starting Vite dev server on port 3000...${NC}"
    npm run vite:dev &
    VITE_PID=$!
    
    # Wait a moment for dev server to start
    sleep 3
    
    # Start Python backend
    echo -e "${BLUE}Starting Python backend...${NC}"
    cd booster_app_export && python main.py
    
    # Cleanup on exit
    kill $VITE_PID 2>/dev/null || true
}

run_prod() {
    echo -e "${GREEN}Starting production app...${NC}"
    
    # Build frontend if needed
    if [ ! -d "booster_app_export/web" ] || [ -z "$(ls -A booster_app_export/web 2>/dev/null)" ]; then
        echo -e "${YELLOW}Frontend not built. Building now...${NC}"
        npm run build
    else
        echo -e "${GREEN}✓ Frontend already built${NC}"
    fi
    
    # Start Python backend
    echo -e "${BLUE}Starting Python backend...${NC}"
    cd booster_app_export && python main.py
}

run_frontend() {
    echo -e "${GREEN}Starting Vite dev server only...${NC}"
    npm run vite:dev
}

run_backend() {
    echo -e "${GREEN}Starting Python backend only...${NC}"
    
    # Check if frontend is built
    if [ ! -d "booster_app_export/web" ] || [ -z "$(ls -A booster_app_export/web 2>/dev/null)" ]; then
        echo -e "${RED}Error: Frontend not built. Please run './run.sh build' first${NC}"
        exit 1
    fi
    
    cd booster_app_export && python main.py
}

run_build() {
    echo -e "${GREEN}Building frontend...${NC}"
    npm run build
    echo -e "${GREEN}✓ Frontend built successfully${NC}"
    echo -e "${YELLOW}You can now run './run.sh prod' to start the production app${NC}"
}

# Main script
print_header

# Default mode
MODE=${1:-dev}

case $MODE in
    dev)
        check_dependencies
        run_dev
        ;;
    prod)
        check_dependencies
        run_prod
        ;;
    frontend)
        check_dependencies
        run_frontend
        ;;
    backend)
        check_dependencies
        run_backend
        ;;
    build)
        check_dependencies
        run_build
        ;;
    help|--help|-h)
        print_usage
        exit 0
        ;;
    *)
        echo -e "${RED}Error: Unknown mode '$MODE'${NC}"
        print_usage
        exit 1
        ;;
esac