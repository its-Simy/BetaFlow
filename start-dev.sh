#!/bin/bash

# BetaFlow Development Startup Script
# This script handles port conflicts and starts both frontend and backend

echo "🚀 Starting BetaFlow Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if port is in use
check_port() {
    lsof -i :$1 > /dev/null 2>&1
}

# Function to kill process on port
kill_port() {
    local port=$1
    local pid=$(lsof -ti :$port)
    if [ ! -z "$pid" ]; then
        echo -e "${YELLOW}⚠️  Killing process on port $port (PID: $pid)${NC}"
        kill -9 $pid 2>/dev/null || true
        sleep 1
    fi
}

# Check and clean up common development ports
echo "🔍 Checking for port conflicts..."
for port in 5055 5056 5057 5058 8000 8001 3000 3001; do
    if check_port $port; then
        echo -e "${YELLOW}⚠️  Port $port is in use${NC}"
        read -p "Do you want to kill the process on port $port? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            kill_port $port
        fi
    fi
done

# Start backend
echo -e "${GREEN}🔧 Starting backend...${NC}"
cd backend
npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Check if backend started successfully
if ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}✅ Backend started successfully${NC}"
else
    echo -e "${RED}❌ Backend failed to start${NC}"
    exit 1
fi

# Start frontend
echo -e "${GREEN}🎨 Starting frontend...${NC}"
cd ..
npm run dev &
FRONTEND_PID=$!

echo -e "${GREEN}🎉 BetaFlow is running!${NC}"
echo -e "${GREEN}📡 Frontend: so http://localhost:3000${NC}"
echo -e "${GREEN}🔧 Backend: Check terminal for actual port${NC}"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user interrupt
trap 'echo -e "\n${YELLOW}🛑 Stopping servers...${NC}"; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0' INT

# Keep script running
wait
