from flask import Flask, request, jsonify
from flask_cors import CORS
import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
import logging
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "stock-service"})

@app.route('/stocks/search', methods=['GET'])
def search_stocks():
    """Search for stocks by symbol or name"""
    try:
        query = request.args.get('q', '').strip().upper()
        if not query:
            return jsonify({"error": "Query parameter 'q' is required"}), 400
        
        # Try to fetch real data from yfinance first
        try:
            ticker = yf.Ticker(query)
            
            # Add delay to avoid rate limiting
            import time
            time.sleep(0.5)
            
            # Try to get basic info first
            try:
                info = ticker.info
            except Exception as e:
                logger.warning(f"Failed to get info for {query}: {str(e)}")
                # Fallback: try to get just the basic data
                hist = ticker.history(period="1d")
                if hist.empty:
                    raise Exception(f"No data available for {query}")
                
                # Create a minimal response with available data
                info = {
                    'symbol': query,
                    'longName': query,
                    'currentPrice': hist['Close'].iloc[-1] if not hist.empty else 0,
                    'currency': 'USD',
                    'exchange': 'Unknown',
                    'marketCap': 0,
                    'sector': 'Unknown',
                    'industry': 'Unknown'
                }
            
            if not info or 'symbol' not in info:
                raise Exception(f"Stock {query} not found")
            
            # Calculate price change from history
            hist = ticker.history(period="2d")
            price_change = 0
            price_change_percent = 0
            if not hist.empty and len(hist) >= 2:
                current_price = hist['Close'].iloc[-1]
                previous_price = hist['Close'].iloc[-2]
                price_change = current_price - previous_price
                price_change_percent = (price_change / previous_price) * 100
            elif not hist.empty:
                current_price = hist['Close'].iloc[-1]
            else:
                current_price = info.get('currentPrice', info.get('regularMarketPrice', 0))
            
            result = {
                "symbol": info.get('symbol', query),
                "name": info.get('longName', info.get('shortName', query)),
                "current_price": current_price,
                "currency": info.get('currency', 'USD'),
                "exchange": info.get('exchange', 'Unknown'),
                "market_cap": info.get('marketCap', 0),
                "sector": info.get('sector', 'Unknown'),
                "industry": info.get('industry', 'Unknown'),
                "description": info.get('longBusinessSummary', ''),
                "logo_url": info.get('logo_url', ''),
                "website": info.get('website', ''),
                "employees": info.get('fullTimeEmployees', 0),
                "city": info.get('city', ''),
                "state": info.get('state', ''),
                "country": info.get('country', ''),
                "phone": info.get('phone', ''),
                "ceo": info.get('ceo', ''),
                "founded": info.get('foundedYear', ''),
                "dividend_yield": info.get('dividendYield', 0),
                "pe_ratio": info.get('trailingPE', 0),
                "eps": info.get('trailingEps', 0),
                "beta": info.get('beta', 0),
                "52_week_high": info.get('fiftyTwoWeekHigh', 0),
                "52_week_low": info.get('fiftyTwoWeekLow', 0),
                "volume": info.get('volume', 0),
                "avg_volume": info.get('averageVolume', 0),
                "market_cap_formatted": f"{info.get('marketCap', 0) / 1000000000:.1f}B" if info.get('marketCap', 0) > 0 else "N/A",
                "price_change": round(price_change, 2),
                "price_change_percent": round(price_change_percent, 2)
            }
            
            logger.info(f"Successfully fetched real data for {query}")
            return jsonify(result)
            
        except Exception as e:
            logger.warning(f"Failed to fetch real data for {query}: {str(e)}")
            return jsonify({"error": f"Failed to fetch data for {query}"}), 404
            
    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/stocks/<symbol>', methods=['GET'])
def get_stock_details(symbol):
    """Get detailed information for a specific stock"""
    try:
        symbol = symbol.upper()
        
        # Try to fetch real data from yfinance with fallback
        try:
            ticker = yf.Ticker(symbol)
            
            # Add delay to avoid rate limiting
            import time
            time.sleep(0.5)
            
            # Try to get basic info first
            try:
                info = ticker.info
            except Exception as e:
                logger.warning(f"Failed to get info for {symbol}: {str(e)}")
                # Fallback: try to get just the basic data
                hist = ticker.history(period="1d")
                if hist.empty:
                    raise Exception(f"No data available for {symbol}")
                
                # Create a minimal response with available data
                info = {
                    'symbol': symbol,
                    'longName': symbol,
                    'currentPrice': hist['Close'].iloc[-1] if not hist.empty else 0,
                    'currency': 'USD',
                    'exchange': 'Unknown',
                    'marketCap': 0,
                    'sector': 'Unknown',
                    'industry': 'Unknown'
                }
            
            if not info or 'symbol' not in info:
                raise Exception(f"Stock {symbol} not found")
            
            # Calculate price change from history
            hist = ticker.history(period="2d")
            price_change = 0
            price_change_percent = 0
            if not hist.empty and len(hist) >= 2:
                current_price = hist['Close'].iloc[-1]
                previous_price = hist['Close'].iloc[-2]
                price_change = current_price - previous_price
                price_change_percent = (price_change / previous_price) * 100
            elif not hist.empty:
                current_price = hist['Close'].iloc[-1]
            else:
                current_price = info.get('currentPrice', info.get('regularMarketPrice', 0))
            
            result = {
                "symbol": info.get('symbol', symbol),
                "name": info.get('longName', info.get('shortName', symbol)),
                "current_price": current_price,
                "currency": info.get('currency', 'USD'),
                "exchange": info.get('exchange', 'Unknown'),
                "market_cap": info.get('marketCap', 0),
                "sector": info.get('sector', 'Unknown'),
                "industry": info.get('industry', 'Unknown'),
                "description": info.get('longBusinessSummary', ''),
                "logo_url": info.get('logo_url', ''),
                "website": info.get('website', ''),
                "employees": info.get('fullTimeEmployees', 0),
                "city": info.get('city', ''),
                "state": info.get('state', ''),
                "country": info.get('country', ''),
                "phone": info.get('phone', ''),
                "ceo": info.get('ceo', ''),
                "founded": info.get('foundedYear', ''),
                "dividend_yield": info.get('dividendYield', 0),
                "pe_ratio": info.get('trailingPE', 0),
                "eps": info.get('trailingEps', 0),
                "beta": info.get('beta', 0),
                "52_week_high": info.get('fiftyTwoWeekHigh', 0),
                "52_week_low": info.get('fiftyTwoWeekLow', 0),
                "volume": info.get('volume', 0),
                "avg_volume": info.get('averageVolume', 0),
                "market_cap_formatted": f"{info.get('marketCap', 0) / 1000000000:.1f}B" if info.get('marketCap', 0) > 0 else "N/A",
                "price_change": round(price_change, 2),
                "price_change_percent": round(price_change_percent, 2)
            }
            
            logger.info(f"Successfully fetched real data for {symbol}")
            return jsonify(result)
            
        except Exception as e:
            logger.warning(f"Failed to fetch real data for {symbol}: {str(e)}")
            return jsonify({"error": f"Failed to fetch details for {symbol}"}), 404
        
    except Exception as e:
        logger.error(f"Error fetching stock details for {symbol}: {str(e)}")
        return jsonify({"error": f"Failed to fetch details for {symbol}"}), 500

@app.route('/stocks/<symbol>/history', methods=['GET'])
def get_stock_history(symbol):
    """Get historical price data for a stock"""
    try:
        symbol = symbol.upper()
        period = request.args.get('period', '1mo')  # 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max
        interval = request.args.get('interval', '1d')  # 1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo
        
        # Try to fetch real historical data from yfinance
        try:
            ticker = yf.Ticker(symbol)
            
            # Add delay to avoid rate limiting
            import time
            time.sleep(0.5)
            
            # Get historical data
            hist = ticker.history(period=period, interval=interval)
            
            if hist.empty:
                raise Exception(f"No historical data available for {symbol}")
            
            # Convert to list of dictionaries
            history_data = []
            for date, row in hist.iterrows():
                history_data.append({
                    "date": date.strftime('%Y-%m-%d'),
                    "timestamp": int(date.timestamp() * 1000),  # JavaScript timestamp
                    "open": float(row['Open']),
                    "high": float(row['High']),
                    "low": float(row['Low']),
                    "close": float(row['Close']),
                    "volume": int(row['Volume']),
                    "adj_close": float(row['Close'])  # yfinance doesn't always have Adj Close
                })
            
            logger.info(f"Successfully fetched real history for {symbol}")
            return jsonify({
                "symbol": symbol,
                "period": period,
                "interval": interval,
                "data": history_data
            })
            
        except Exception as e:
            logger.warning(f"Failed to fetch real history for {symbol}: {str(e)}")
            return jsonify({"error": f"Failed to fetch history for {symbol}"}), 404
        
    except Exception as e:
        logger.error(f"Error fetching history for {symbol}: {str(e)}")
        return jsonify({"error": f"Failed to fetch history for {symbol}"}), 500

@app.route('/stocks/<symbol>/quote', methods=['GET'])
def get_stock_quote(symbol):
    """Get real-time quote for a stock"""
    try:
        symbol = symbol.upper()
        ticker = yf.Ticker(symbol)
        
        # Get real-time data
        hist = ticker.history(period="1d", interval="1m")
        
        if hist.empty:
            return jsonify({"error": f"No data available for {symbol}"}), 404
        
        latest = hist.iloc[-1]
        
        quote = {
            "symbol": symbol,
            "price": float(latest['Close']),
            "change": float(latest['Close'] - hist.iloc[0]['Open']),
            "change_percent": float((latest['Close'] - hist.iloc[0]['Open']) / hist.iloc[0]['Open'] * 100),
            "volume": int(latest['Volume']),
            "timestamp": int(latest.name.timestamp() * 1000)
        }
        
        return jsonify(quote)
        
    except Exception as e:
        logger.error(f"Error fetching quote for {symbol}: {str(e)}")
        return jsonify({"error": f"Failed to fetch quote for {symbol}"}), 500

@app.route('/stocks/batch', methods=['POST'])
def get_batch_stocks():
    """Get multiple stocks at once"""
    try:
        data = request.get_json()
        symbols = data.get('symbols', [])
        
        if not symbols:
            return jsonify({"error": "No symbols provided"}), 400
        
        results = []
        for symbol in symbols:
            try:
                ticker = yf.Ticker(symbol)
                hist = ticker.history(period="1d")
                
                if not hist.empty:
                    latest = hist.iloc[-1]
                    results.append({
                        "symbol": symbol,
                        "price": float(latest['Close']),
                        "change": float(latest['Close'] - hist.iloc[0]['Open']),
                        "change_percent": float((latest['Close'] - hist.iloc[0]['Open']) / hist.iloc[0]['Open'] * 100),
                        "volume": int(latest['Volume'])
                    })
                else:
                    results.append({
                        "symbol": symbol,
                        "error": "No data available"
                    })
            except Exception as e:
                results.append({
                    "symbol": symbol,
                    "error": str(e)
                })
        
        return jsonify({"results": results})
        
    except Exception as e:
        logger.error(f"Error in batch request: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
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
