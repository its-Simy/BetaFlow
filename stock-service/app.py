from flask import Flask, request, jsonify
from flask_cors import CORS
import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
import logging

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
        
        # For now, we'll search for the exact symbol
        # In a real implementation, you might want to use a stock symbol database
        try:
            ticker = yf.Ticker(query)
            info = ticker.info
            
            if not info or 'symbol' not in info:
                return jsonify({"error": "Stock not found"}), 404
            
            result = {
                "symbol": info.get('symbol', query),
                "name": info.get('longName', info.get('shortName', query)),
                "current_price": info.get('currentPrice', info.get('regularMarketPrice', 0)),
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
                "market_state": info.get('marketState', 'UNKNOWN')
            }
            
            return jsonify(result)
            
        except Exception as e:
            logger.error(f"Error fetching stock data for {query}: {str(e)}")
            return jsonify({"error": f"Failed to fetch data for {query}"}), 500
            
    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/stocks/<symbol>', methods=['GET'])
def get_stock_details(symbol):
    """Get detailed information for a specific stock"""
    try:
        symbol = symbol.upper()
        ticker = yf.Ticker(symbol)
        info = ticker.info
        
        if not info or 'symbol' not in info:
            return jsonify({"error": "Stock not found"}), 404
        
        # Get current price and basic info
        current_price = info.get('currentPrice', info.get('regularMarketPrice', 0))
        
        result = {
            "symbol": symbol,
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
            "market_state": info.get('marketState', 'UNKNOWN')
        }
        
        return jsonify(result)
        
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
        
        ticker = yf.Ticker(symbol)
        
        # Get historical data
        hist = ticker.history(period=period, interval=interval)
        
        if hist.empty:
            return jsonify({"error": "No historical data available"}), 404
        
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
        
        return jsonify({
            "symbol": symbol,
            "period": period,
            "interval": interval,
            "data": history_data
        })
        
    except Exception as e:
        logger.error(f"Error fetching history for {symbol}: {str(e)}")
        return jsonify({"error": f"Failed to fetch history for {symbol}"}), 500

@app.route('/stocks/<symbol>/quote', methods=['GET'])
def get_stock_quote(symbol):
    """Get real-time quote for a stock"""
    try:
        symbol = symbol.upper()
        ticker = yf.Ticker(symbol)
        
        # Get current quote
        info = ticker.info
        hist = ticker.history(period="1d", interval="1m")
        
        if not info or 'symbol' not in info:
            return jsonify({"error": "Stock not found"}), 404
        
        current_price = info.get('currentPrice', info.get('regularMarketPrice', 0))
        
        # Calculate change and percentage change
        prev_close = info.get('previousClose', current_price)
        change = current_price - prev_close
        change_percent = (change / prev_close * 100) if prev_close != 0 else 0
        
        result = {
            "symbol": symbol,
            "name": info.get('longName', info.get('shortName', symbol)),
            "current_price": current_price,
            "previous_close": prev_close,
            "change": change,
            "change_percent": change_percent,
            "currency": info.get('currency', 'USD'),
            "volume": info.get('volume', 0),
            "market_state": info.get('marketState', 'UNKNOWN'),
            "last_updated": datetime.now().isoformat()
        }
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error fetching quote for {symbol}: {str(e)}")
        return jsonify({"error": f"Failed to fetch quote for {symbol}"}), 500

@app.route('/stocks/batch', methods=['POST'])
def get_batch_stocks():
    """Get data for multiple stocks at once"""
    try:
        data = request.get_json()
        symbols = data.get('symbols', [])
        
        if not symbols:
            return jsonify({"error": "Symbols array is required"}), 400
        
        results = []
        for symbol in symbols:
            try:
                symbol = symbol.upper()
                ticker = yf.Ticker(symbol)
                info = ticker.info
                
                if info and 'symbol' in info:
                    current_price = info.get('currentPrice', info.get('regularMarketPrice', 0))
                    prev_close = info.get('previousClose', current_price)
                    change = current_price - prev_close
                    change_percent = (change / prev_close * 100) if prev_close != 0 else 0
                    
                    results.append({
                        "symbol": symbol,
                        "name": info.get('longName', info.get('shortName', symbol)),
                        "current_price": current_price,
                        "change": change,
                        "change_percent": change_percent,
                        "volume": info.get('volume', 0),
                        "market_state": info.get('marketState', 'UNKNOWN')
                    })
                else:
                    results.append({
                        "symbol": symbol,
                        "error": "Stock not found"
                    })
                    
            except Exception as e:
                results.append({
                    "symbol": symbol,
                    "error": str(e)
                })
        
        return jsonify({"results": results})
        
    except Exception as e:
        logger.error(f"Batch request error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5003))
    app.run(host='0.0.0.0', port=port, debug=True)
