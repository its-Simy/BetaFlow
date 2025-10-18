#!/bin/bash

# Start BetaFlow with yfinance integration
echo "🚀 Starting BetaFlow with yfinance integration..."

# Function to cleanup background processes
cleanup() {
    echo "🛑 Shutting down services..."
    kill $NEXT_PID $PYTHON_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 is not installed"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    exit 1
fi

# Install Python dependencies if needed
if [ -f "stock-service/requirements.txt" ]; then
    echo "📦 Installing Python dependencies..."
    cd stock-service
    pip3 install -r requirements.txt > /dev/null 2>&1
    cd ..
fi

# Start Python stock service
echo "🐍 Starting Python stock service on port 5003..."
cd stock-service
python3 run.py &
PYTHON_PID=$!
cd ..

# Wait for Python service to start
sleep 3

# Check if Python service is running
if ! kill -0 $PYTHON_PID 2>/dev/null; then
    echo "❌ Failed to start Python stock service"
    exit 1
fi

echo "✅ Python stock service started (PID: $PYTHON_PID)"

# Start Next.js development server
echo "⚛️  Starting Next.js development server..."
npm run dev &
NEXT_PID=$!

# Wait for Next.js to start
sleep 5

# Check if Next.js is running
if ! kill -0 $NEXT_PID 2>/dev/null; then
    echo "❌ Failed to start Next.js server"
    kill $PYTHON_PID 2>/dev/null
    exit 1
fi

echo "✅ Next.js server started (PID: $NEXT_PID)"
echo ""
echo "🎉 BetaFlow is now running with yfinance integration!"
echo "📊 Frontend: http://localhost:3000"
echo "🐍 Stock Service: http://localhost:5003"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for either process to exit
wait $NEXT_PID $PYTHON_PID
