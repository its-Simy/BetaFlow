#!/bin/bash

# Start Stock Service with Python
echo "Starting Stock Service (Python + yfinance)..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed"
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "Error: pip3 is not installed"
    exit 1
fi

# Install Python dependencies if requirements.txt exists
if [ -f "stock-service/requirements.txt" ]; then
    echo "Installing Python dependencies..."
    pip3 install -r stock-service/requirements.txt
fi

# Start the stock service
echo "Starting stock service on port 5002..."
cd stock-service
python3 run.py &
STOCK_PID=$!

# Wait a moment for the service to start
sleep 3

# Check if the service started successfully
if ps -p $STOCK_PID > /dev/null; then
    echo "✅ Stock service started successfully (PID: $STOCK_PID)"
    echo "Stock service running on http://localhost:5002"
    echo "Press Ctrl+C to stop the service"
    
    # Keep the script running
    wait $STOCK_PID
else
    echo "❌ Failed to start stock service"
    exit 1
fi
