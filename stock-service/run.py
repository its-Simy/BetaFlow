#!/usr/bin/env python3
"""
Stock Service Runner
Starts the Flask application for stock data using yfinance
"""

import os
import sys
from app import app

if __name__ == '__main__':
    # Set default port
    port = int(os.environ.get('PORT', 5003))
    
    print(f"Starting Stock Service on port {port}")
    print("Available endpoints:")
    print("  GET  /health - Health check")
    print("  GET  /stocks/search?q=SYMBOL - Search stocks")
    print("  GET  /stocks/SYMBOL - Get stock details")
    print("  GET  /stocks/SYMBOL/history - Get price history")
    print("  GET  /stocks/SYMBOL/quote - Get real-time quote")
    print("  POST /stocks/batch - Get multiple stocks")
    
    app.run(host='0.0.0.0', port=port, debug=True)
