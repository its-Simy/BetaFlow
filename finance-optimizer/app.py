"""
Finance Optimizer Service
Flask API for portfolio risk analysis
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import os
from dotenv import load_dotenv
from portfolio_risk import analyze_portfolio_risk, analyze_portfolio_risk_with_cache

# Load environment variables from root directory (override existing)
load_dotenv('../.env', override=True)
load_dotenv('../.env.local', override=True)  # Also load .env.local if it exists

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Get FMP API key from environment
FMP_API_KEY = os.getenv('FMP_API_KEY')
logger.info(f"FMP API key loaded: {bool(FMP_API_KEY)}")
if FMP_API_KEY:
    logger.info(f"API key starts with: {FMP_API_KEY[:10]}...")

# Simple in-memory cache
cache = {}
CACHE_DURATION = 24 * 60 * 60  # 24 hours in seconds


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    fmp_api_key = os.getenv("FMP_API_KEY")
    api_key_configured = fmp_api_key is not None and fmp_api_key != "your_fmp_api_key_here"
    return jsonify({
        "status": "healthy",
        "service": "finance-optimizer",
        "api_key_configured": api_key_configured
    })


@app.route('/analyze-risk', methods=['POST'])
def analyze_risk():
    """
    Analyze portfolio risk
    
    Expected JSON payload:
    {
        "holdings": [
            {
                "symbol": "AAPL",
                "shares": 10,
                "value": 1700.00,
                "sector": "Technology"
            },
            ...
        ]
    }
    
    Returns:
    {
        "beta": 1.05,
        "volatility": 18.5,
        "sharpe_ratio": 1.2,
        "max_drawdown": 15.3,
        "var_95": 2.5,
        "diversification_score": 65,
        "correlations": {...},
        "num_holdings": 3,
        "total_value": 10000.00,
        "holdings_breakdown": [...]
    }
    """
    try:
        # Check if API key is configured
        fmp_api_key = os.getenv("FMP_API_KEY")
        if not fmp_api_key or fmp_api_key == "your_fmp_api_key_here":
            return jsonify({
                "error": "FMP API key not configured",
                "message": "Please add FMP_API_KEY to your .env file"
            }), 500
        
        # Get request data
        data = request.get_json()
        
        if not data or 'holdings' not in data:
            return jsonify({
                "error": "Invalid request",
                "message": "Request body must include 'holdings' array"
            }), 400
        
        holdings = data['holdings']
        
        if not holdings or len(holdings) == 0:
            return jsonify({
                "error": "No holdings provided",
                "message": "At least one holding is required for risk analysis"
            }), 400
        
        # Validate holdings structure
        required_fields = ['symbol', 'shares', 'value']
        for holding in holdings:
            for field in required_fields:
                if field not in holding:
                    return jsonify({
                        "error": f"Missing required field: {field}",
                        "message": f"Each holding must include: {', '.join(required_fields)}"
                    }), 400
        
        logger.info(f"Analyzing risk for {len(holdings)} holdings")
        
        # Generate cache key from holdings
        cache_key = '_'.join(sorted([f"{h['symbol']}_{h['shares']}" for h in holdings]))
        
        # Check cache
        if cache_key in cache:
            logger.info("Returning cached results")
            cached_result = cache[cache_key]
            cached_result['cached'] = True
            return jsonify(cached_result)
        
        # Get user_id from request
        user_id = data.get('user_id')
        if not user_id:
            return jsonify({
                "error": "user_id is required for caching",
                "message": "Please provide user_id in the request body"
            }), 400
        
        # Perform risk analysis with caching
        results = analyze_portfolio_risk_with_cache(user_id, holdings, fmp_api_key)
        
        # Cache results
        cache[cache_key] = results
        results['cached'] = False
        
        logger.info("Risk analysis completed successfully")
        return jsonify(results)
        
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return jsonify({
            "error": "Validation error",
            "message": str(e)
        }), 400
        
    except Exception as e:
        logger.error(f"Error analyzing portfolio risk: {str(e)}")
        return jsonify({
            "error": "Analysis failed",
            "message": str(e)
        }), 500


@app.route('/clear-cache', methods=['POST'])
def clear_cache():
    """Clear the analysis cache"""
    global cache
    cache = {}
    return jsonify({"message": "Cache cleared successfully"})


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5004))
    logger.info(f"Starting Finance Optimizer Service on port {port}")
    app.run(host='0.0.0.0', port=port, debug=True)

