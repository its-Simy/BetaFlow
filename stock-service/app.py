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

# Mock data for common stocks to avoid rate limiting
MOCK_STOCK_DATA = {
    'AAPL': {
        'symbol': 'AAPL',
        'name': 'Apple Inc.',
        'current_price': 175.43,
        'currency': 'USD',
        'exchange': 'NASDAQ',
        'market_cap': 2800000000000,
        'sector': 'Technology',
        'industry': 'Consumer Electronics',
        'description': 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.',
        'logo_url': '',
        'website': 'https://www.apple.com',
        'employees': 164000,
        'city': 'Cupertino',
        'state': 'CA',
        'country': 'United States',
        'zip': '95014',
        'phone': '408-996-1010',
        'ceo': 'Tim Cook',
        'founded': 1976,
        'pe_ratio': 28.5,
        'eps': 6.13,
        'dividend_yield': 0.44,
        'beta': 1.29,
        '52_week_high': 198.23,
        '52_week_low': 124.17,
        'volume': 45000000,
        'avg_volume': 55000000,
        'market_cap_formatted': '2.8T',
        'price_change': 2.34,
        'price_change_percent': 1.35
    },
    'GOOGL': {
        'symbol': 'GOOGL',
        'name': 'Alphabet Inc.',
        'current_price': 142.56,
        'currency': 'USD',
        'exchange': 'NASDAQ',
        'market_cap': 1800000000000,
        'sector': 'Technology',
        'industry': 'Internet Content & Information',
        'description': 'Alphabet Inc. provides online advertising services in the United States, Europe, the Middle East, Africa, the Asia-Pacific, Canada, and Latin America.',
        'logo_url': '',
        'website': 'https://www.google.com',
        'employees': 190000,
        'city': 'Mountain View',
        'state': 'CA',
        'country': 'United States',
        'zip': '94043',
        'phone': '650-253-0000',
        'ceo': 'Sundar Pichai',
        'founded': 1998,
        'pe_ratio': 25.2,
        'eps': 5.61,
        'dividend_yield': 0.0,
        'beta': 1.05,
        '52_week_high': 151.55,
        '52_week_low': 83.34,
        'volume': 25000000,
        'avg_volume': 30000000,
        'market_cap_formatted': '1.8T',
        'price_change': -1.23,
        'price_change_percent': -0.86
    },
    'MSFT': {
        'symbol': 'MSFT',
        'name': 'Microsoft Corporation',
        'current_price': 378.85,
        'currency': 'USD',
        'exchange': 'NASDAQ',
        'market_cap': 2800000000000,
        'sector': 'Technology',
        'industry': 'Software—Infrastructure',
        'description': 'Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide.',
        'logo_url': '',
        'website': 'https://www.microsoft.com',
        'employees': 221000,
        'city': 'Redmond',
        'state': 'WA',
        'country': 'United States',
        'zip': '98052',
        'phone': '425-882-8080',
        'ceo': 'Satya Nadella',
        'founded': 1975,
        'pe_ratio': 32.1,
        'eps': 11.79,
        'dividend_yield': 0.68,
        'beta': 0.89,
        '52_week_high': 384.30,
        '52_week_low': 309.45,
        'volume': 20000000,
        'avg_volume': 25000000,
        'market_cap_formatted': '2.8T',
        'price_change': 3.45,
        'price_change_percent': 0.92
    },
    'TSLA': {
        'symbol': 'TSLA',
        'name': 'Tesla, Inc.',
        'current_price': 248.50,
        'currency': 'USD',
        'exchange': 'NASDAQ',
        'market_cap': 790000000000,
        'sector': 'Consumer Cyclical',
        'industry': 'Auto Manufacturers',
        'description': 'Tesla, Inc. designs, develops, manufactures, leases, and sells electric vehicles, and energy generation and storage systems in the United States, China, and internationally.',
        'logo_url': '',
        'website': 'https://www.tesla.com',
        'employees': 127855,
        'city': 'Austin',
        'state': 'TX',
        'country': 'United States',
        'zip': '78725',
        'phone': '512-516-8177',
        'ceo': 'Elon Musk',
        'founded': 2003,
        'pe_ratio': 65.2,
        'eps': 3.62,
        'dividend_yield': 0.0,
        'beta': 2.31,
        '52_week_high': 299.29,
        '52_week_low': 138.80,
        'volume': 80000000,
        'avg_volume': 90000000,
        'market_cap_formatted': '790B',
        'price_change': -5.67,
        'price_change_percent': -2.23
    },
    'AMZN': {
        'symbol': 'AMZN',
        'name': 'Amazon.com, Inc.',
        'current_price': 155.20,
        'currency': 'USD',
        'exchange': 'NASDAQ',
        'market_cap': 1600000000000,
        'sector': 'Consumer Cyclical',
        'industry': 'Internet Retail',
        'description': 'Amazon.com, Inc. engages in the retail sale of consumer products and subscriptions in North America and internationally.',
        'logo_url': '',
        'website': 'https://www.amazon.com',
        'employees': 1540000,
        'city': 'Seattle',
        'state': 'WA',
        'country': 'United States',
        'zip': '98109',
        'phone': '206-266-1000',
        'ceo': 'Andy Jassy',
        'founded': 1994,
        'pe_ratio': 52.3,
        'eps': 2.90,
        'dividend_yield': 0.0,
        'beta': 1.15,
        '52_week_high': 189.77,
        '52_week_low': 101.15,
        'volume': 35000000,
        'avg_volume': 40000000,
        'market_cap_formatted': '1.6T',
        'price_change': 1.89,
        'price_change_percent': 1.23
    },
    'META': {
        'symbol': 'META',
        'name': 'Meta Platforms, Inc.',
        'current_price': 485.30,
        'currency': 'USD',
        'exchange': 'NASDAQ',
        'market_cap': 1200000000000,
        'sector': 'Technology',
        'industry': 'Internet Content & Information',
        'description': 'Meta Platforms, Inc. develops products that help people connect and share with friends and family through mobile devices, personal computers, virtual reality headsets, and wearables worldwide.',
        'logo_url': '',
        'website': 'https://www.meta.com',
        'employees': 87000,
        'city': 'Menlo Park',
        'state': 'CA',
        'country': 'United States',
        'zip': '94025',
        'phone': '650-543-4800',
        'ceo': 'Mark Zuckerberg',
        'founded': 2004,
        'pe_ratio': 24.8,
        'eps': 19.56,
        'dividend_yield': 0.0,
        'beta': 1.18,
        '52_week_high': 531.49,
        '52_week_low': 197.16,
        'volume': 15000000,
        'avg_volume': 18000000,
        'market_cap_formatted': '1.2T',
        'price_change': 8.45,
        'price_change_percent': 1.77
    },
    'NVDA': {
        'symbol': 'NVDA',
        'name': 'NVIDIA Corporation',
        'current_price': 875.28,
        'currency': 'USD',
        'exchange': 'NASDAQ',
        'market_cap': 2100000000000,
        'sector': 'Technology',
        'industry': 'Semiconductors',
        'description': 'NVIDIA Corporation operates as a computing company in the United States, Taiwan, China, Hong Kong, and internationally.',
        'logo_url': '',
        'website': 'https://www.nvidia.com',
        'employees': 29000,
        'city': 'Santa Clara',
        'state': 'CA',
        'country': 'United States',
        'zip': '95051',
        'phone': '408-486-2000',
        'ceo': 'Jensen Huang',
        'founded': 1993,
        'pe_ratio': 65.2,
        'eps': 13.42,
        'dividend_yield': 0.03,
        'beta': 1.68,
        '52_week_high': 974.00,
        '52_week_low': 180.68,
        'volume': 45000000,
        'avg_volume': 50000000,
        'market_cap_formatted': '2.1T',
        'price_change': 12.34,
        'price_change_percent': 1.43
    }
}

@app.route('/stocks/search', methods=['GET'])
def search_stocks():
    """Search for stocks by symbol or name"""
    try:
        query = request.args.get('q', '').strip().upper()
        if not query:
            return jsonify({"error": "Query parameter 'q' is required"}), 400
        
        # Generate mock data for any symbol
        def generate_mock_stock_data(symbol):
            # Check if we have detailed mock data for this symbol
            if symbol in MOCK_STOCK_DATA:
                return MOCK_STOCK_DATA[symbol]
            
            # Generate basic mock data for any symbol
            import hashlib
            hash_value = int(hashlib.md5(symbol.encode()).hexdigest()[:8], 16)
            current_price = 50 + (hash_value % 500)  # Price between $50-$550
            
            # Generate consistent data based on symbol hash
            price_change = (hash_value % 20) - 10  # -10 to +10
            price_change_percent = (hash_value % 10) - 5  # -5% to +5%
            
            return {
                'symbol': symbol,
                'name': f'{symbol} Corporation',
                'current_price': current_price,
                'currency': 'USD',
                'exchange': 'NASDAQ',
                'market_cap': current_price * (1000000 + (hash_value % 50000000)),
                'sector': 'Technology',
                'industry': 'Software',
                'description': f'{symbol} Corporation is a leading technology company.',
                'logo_url': '',
                'website': f'https://www.{symbol.lower()}.com',
                'employees': 1000 + (hash_value % 100000),
                'city': 'San Francisco',
                'state': 'CA',
                'country': 'United States',
                'zip': '94105',
                'phone': '555-0123',
                'ceo': 'John Smith',
                'founded': 2000 + (hash_value % 25),
                'pe_ratio': 15 + (hash_value % 30),
                'eps': current_price / (15 + (hash_value % 30)),
                'dividend_yield': (hash_value % 5) / 100,
                'beta': 0.8 + (hash_value % 40) / 100,
                '52_week_high': current_price * 1.2,
                '52_week_low': current_price * 0.8,
                'volume': 1000000 + (hash_value % 10000000),
                'avg_volume': 2000000 + (hash_value % 20000000),
                'market_cap_formatted': f'{(current_price * (1000000 + (hash_value % 50000000))) / 1000000000:.1f}B',
                'price_change': price_change,
                'price_change_percent': price_change_percent
            }
        
        # Always return mock data for any symbol
        mock_data = generate_mock_stock_data(query)
        return jsonify(mock_data)
        
        # For other symbols, try yfinance with fallback
        try:
            ticker = yf.Ticker(query)
            
            # Try to get basic info first, with error handling
            try:
                info = ticker.info
            except Exception as e:
                logger.warning(f"Failed to get info for {query}: {str(e)}")
                # Fallback: try to get just the basic data
                hist = ticker.history(period="1d")
                if hist.empty:
                    return jsonify({"error": f"Stock {query} not found"}), 404
                
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
                return jsonify({"error": f"Stock {query} not found"}), 404
            
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
        
        # Use the same mock data generation as search
        def generate_mock_stock_data(symbol):
            # Check if we have detailed mock data for this symbol
            if symbol in MOCK_STOCK_DATA:
                return MOCK_STOCK_DATA[symbol]
            
            # Generate basic mock data for any symbol
            import hashlib
            hash_value = int(hashlib.md5(symbol.encode()).hexdigest()[:8], 16)
            current_price = 50 + (hash_value % 500)  # Price between $50-$550
            
            # Generate consistent data based on symbol hash
            price_change = (hash_value % 20) - 10  # -10 to +10
            price_change_percent = (hash_value % 10) - 5  # -5% to +5%
            
            return {
                'symbol': symbol,
                'name': f'{symbol} Corporation',
                'current_price': current_price,
                'currency': 'USD',
                'exchange': 'NASDAQ',
                'market_cap': current_price * (1000000 + (hash_value % 50000000)),
                'sector': 'Technology',
                'industry': 'Software',
                'description': f'{symbol} Corporation is a leading technology company.',
                'logo_url': '',
                'website': f'https://www.{symbol.lower()}.com',
                'employees': 1000 + (hash_value % 100000),
                'city': 'San Francisco',
                'state': 'CA',
                'country': 'United States',
                'zip': '94105',
                'phone': '555-0123',
                'ceo': 'John Smith',
                'founded': 2000 + (hash_value % 25),
                'pe_ratio': 15 + (hash_value % 30),
                'eps': current_price / (15 + (hash_value % 30)),
                'dividend_yield': (hash_value % 5) / 100,
                'beta': 0.8 + (hash_value % 40) / 100,
                '52_week_high': current_price * 1.2,
                '52_week_low': current_price * 0.8,
                'volume': 1000000 + (hash_value % 10000000),
                'avg_volume': 2000000 + (hash_value % 20000000),
                'market_cap_formatted': f'{(current_price * (1000000 + (hash_value % 50000000))) / 1000000000:.1f}B',
                'price_change': price_change,
                'price_change_percent': price_change_percent
            }
        
        # Generate mock data for any symbol
        mock_data = generate_mock_stock_data(symbol)
        return jsonify(mock_data)
        
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
        
        # Generate mock historical data for any symbol
        def generate_mock_history(symbol, period, interval):
            import random
            from datetime import datetime, timedelta
            
            # Get current price from mock data if available, otherwise generate one
            if symbol in MOCK_STOCK_DATA:
                current_price = MOCK_STOCK_DATA[symbol]['current_price']
            else:
                # Generate a realistic price based on symbol hash for consistency
                import hashlib
                hash_value = int(hashlib.md5(symbol.encode()).hexdigest()[:8], 16)
                current_price = 50 + (hash_value % 500)  # Price between $50-$550
            
            days = 30 if period == '1mo' else 7 if period == '1w' else 1
            
            history_data = []
            base_price = current_price * 0.9  # Start 10% below current price
            
            for i in range(days):
                date = datetime.now() - timedelta(days=days-i-1)
                
                # Generate realistic price movement
                change_percent = random.uniform(-0.05, 0.05)  # ±5% daily change
                base_price *= (1 + change_percent)
                
                open_price = base_price
                high_price = base_price * random.uniform(1.0, 1.03)
                low_price = base_price * random.uniform(0.97, 1.0)
                close_price = base_price * random.uniform(0.98, 1.02)
                volume = random.randint(1000000, 10000000)
                
                history_data.append({
                    "date": date.strftime('%Y-%m-%d'),
                    "timestamp": int(date.timestamp() * 1000),  # JavaScript timestamp
                    "open": round(open_price, 2),
                    "high": round(high_price, 2),
                    "low": round(low_price, 2),
                    "close": round(close_price, 2),
                    "volume": volume,
                    "adj_close": round(close_price, 2)
                })
            
            return {
                "symbol": symbol,
                "period": period,
                "interval": interval,
                "data": history_data
            }
        
        # Always generate mock data for any symbol
        mock_data = generate_mock_history(symbol, period, interval)
        return jsonify(mock_data)
        
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
