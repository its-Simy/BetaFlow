#!/bin/bash

# Start Finance Optimizer Service

echo "🚀 Starting Finance Optimizer Service..."
echo ""

# Check if port 5004 is available
if lsof -Pi :5004 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Port 5004 is already in use"
    echo "Killing existing process..."
    pkill -f "python3.*run.py" || true
    sleep 2
fi

# Navigate to service directory
cd finance-optimizer || exit 1

# Check if requirements are installed
if ! python3 -c "import flask" 2>/dev/null; then
    echo "📦 Installing dependencies..."
    pip3 install -r requirements.txt --quiet
fi

# Start the service
echo "✅ Starting service on http://localhost:5004"
echo "Press CTRL+C to stop"
echo ""

python3 run.py

