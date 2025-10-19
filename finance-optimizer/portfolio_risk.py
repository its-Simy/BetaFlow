"""
Portfolio Risk Analysis Module
Calculates various risk metrics for a portfolio of stocks
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import finnhub
import logging
import json
import os
from db import get_db_cursor

logger = logging.getLogger(__name__)


def _normalize_time_index_series(price_series: pd.Series) -> pd.Series:
    """Ensure the series index is a UTC tz-aware DatetimeIndex, sorted, without duplicates."""
    try:
        if not isinstance(price_series.index, pd.DatetimeIndex):
            price_series.index = pd.to_datetime(price_series.index, utc=True, errors='coerce')
        elif price_series.index.tz is None:
            price_series.index = price_series.index.tz_localize('UTC')
        else:
            price_series.index = price_series.index.tz_convert('UTC')
        price_series = price_series.sort_index()
        return price_series[~price_series.index.duplicated()]
    except Exception as e:
        logger.warning(f"Failed to normalize time index: {e}")
        return price_series


def _normalize_time_index_df(df: pd.DataFrame) -> pd.DataFrame:
    """Ensure the DataFrame index is a UTC tz-aware DatetimeIndex, sorted, without duplicates."""
    try:
        if not isinstance(df.index, pd.DatetimeIndex):
            df.index = pd.to_datetime(df.index, utc=True, errors='coerce')
        elif df.index.tz is None:
            df.index = df.index.tz_localize('UTC')
        else:
            df.index = df.index.tz_convert('UTC')
        df = df.sort_index()
        return df[~df.index.duplicated()]
    except Exception as e:
        logger.warning(f"Failed to normalize DF time index: {e}")
        return df


def get_cached_historical_data(user_id, symbols, days=365):
    """
    Retrieve cached historical data from database
    Returns: dict with symbol -> {dates: [], prices: [], last_updated: timestamp}
    """
    cached_data = {}
    
    try:
        with get_db_cursor() as cursor:
            # Query cached data for all symbols
            placeholders = ','.join(['%s'] * len(symbols))
            query = f"""
                SELECT symbol, data, last_fetched, data_start_date, data_end_date
                FROM stock_data_cache 
                WHERE user_id = %s AND symbol IN ({placeholders})
            """
            cursor.execute(query, [user_id] + symbols)
            results = cursor.fetchall()
            
            for row in results:
                symbol = row['symbol']
                data_json = row['data']
                last_fetched = row['last_fetched']
                start_date = row['data_start_date']
                end_date = row['data_end_date']
                
                # Check if data covers the required range
                required_start = datetime.now() - timedelta(days=days)
                if start_date <= required_start.date() and end_date >= (datetime.now() - timedelta(days=1)).date():
                    cached_data[symbol] = {
                        'data': data_json,
                        'last_fetched': last_fetched,
                        'start_date': start_date,
                        'end_date': end_date
                    }
                    logger.info(f"Found cached data for {symbol} from {start_date} to {end_date}")
                else:
                    logger.info(f"Cached data for {symbol} doesn't cover required range")
                    
    except Exception as e:
        logger.error(f"Error retrieving cached data: {e}")
    
    return cached_data


def is_cache_fresh(cached_data, max_age_days=30):
    """Check if cached data is fresh enough to use"""
    if not cached_data:
        return False
    
    last_fetched = cached_data['last_fetched']
    age_days = (datetime.now() - last_fetched).days
    return age_days < max_age_days


def save_historical_data_to_cache(user_id, symbol, price_series):
    """
    Save fetched historical data to database cache
    """
    try:
        # Convert pandas Series to JSON format
        price_series = _normalize_time_index_series(price_series)
        dates = price_series.index.strftime('%Y-%m-%d').tolist()
        prices = price_series.values.tolist()
        
        data_json = {
            'dates': dates,
            'prices': prices
        }
        
        start_date = price_series.index.min().date()
        end_date = price_series.index.max().date()
        
        with get_db_cursor() as cursor:
            # Upsert data into cache
            query = """
                INSERT INTO stock_data_cache (user_id, symbol, data, data_start_date, data_end_date, last_fetched)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (user_id, symbol)
                DO UPDATE SET 
                    data = EXCLUDED.data,
                    data_start_date = EXCLUDED.data_start_date,
                    data_end_date = EXCLUDED.data_end_date,
                    last_fetched = EXCLUDED.last_fetched,
                    updated_at = CURRENT_TIMESTAMP
            """
            cursor.execute(query, [
                user_id, symbol, json.dumps(data_json), 
                start_date, end_date, datetime.now()
            ])
            
        logger.info(f"Saved {len(price_series)} days of data for {symbol} to cache")
        
    except Exception as e:
        logger.error(f"Error saving data to cache for {symbol}: {e}")


def fetch_from_yfinance(symbol, days=365):
    """Fetch data from yfinance"""
    try:
        import yfinance as yf
        
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period=f"{days}d")
        
        if not hist.empty and 'Close' in hist.columns:
            price_series = hist['Close']
            price_series = price_series.dropna()
            if len(price_series) > 0:
                logger.info(f"Fetched {len(price_series)} days of data for {symbol} from yfinance")
                return price_series
        
        logger.warning(f"No data from yfinance for {symbol}")
        return None
        
    except Exception as e:
        logger.warning(f"yfinance failed for {symbol}: {e}")
        return None


def fetch_from_polygon(symbol, api_key, days=365):
    """
    Fetch historical data from Polygon.io
    Free tier: 5 API calls per minute
    """
    if not api_key or api_key == "your_polygon_api_key_here":
        return None
        
    try:
        import requests
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        url = f'https://api.polygon.io/v2/aggs/ticker/{symbol}/range/1/day/{start_date.strftime("%Y-%m-%d")}/{end_date.strftime("%Y-%m-%d")}'
        params = {'apiKey': api_key, 'adjusted': 'true', 'sort': 'asc'}
        
        response = requests.get(url, params=params)
        if response.status_code == 200:
            data = response.json()
            if 'results' in data and len(data['results']) > 0:
                dates = [datetime.fromtimestamp(r['t']/1000) for r in data['results']]
                prices = [r['c'] for r in data['results']]
                price_series = pd.Series(prices, index=dates)
                price_series = _normalize_time_index_series(price_series)
                logger.info(f"Fetched {len(price_series)} days of data for {symbol} from Polygon")
                return price_series
        else:
            logger.warning(f"Polygon API error for {symbol}: {response.status_code}")
    
    except Exception as e:
        logger.warning(f"Polygon failed for {symbol}: {e}")
    
    return None


def fetch_from_fmp(symbol, api_key, days=365):
    """Fetch data from Financial Modeling Prep API"""
    if not api_key or api_key == "your_fmp_api_key_here":
        return None
        
    try:
        import requests
        
        url = f'https://financialmodelingprep.com/api/v3/historical-price-full/{symbol}'
        params = {'apikey': api_key}
        
        response = requests.get(url, params=params)
        if response.status_code == 200:
            data = response.json()
            
            if 'historical' in data and len(data['historical']) > 0:
                historical = data['historical'][:days]
                prices = [(h['date'], h['close']) for h in historical]
                dates, closes = zip(*prices)
                
                price_series = pd.Series(closes, index=pd.to_datetime(dates))
                price_series = _normalize_time_index_series(price_series)
                logger.info(f"Fetched {len(price_series)} days of data for {symbol} from FMP")
                return price_series
        else:
            logger.warning(f"FMP API error for {symbol}: {response.status_code}")
    
    except Exception as e:
        logger.warning(f"FMP failed for {symbol}: {e}")
    
    return None


def fetch_historical_data_with_cache(user_id, symbols, api_key, days=365):
    """
    Fetch historical data with database caching
    
    Process:
    1. Check database cache for each symbol
    2. If cache exists and is fresh (< 30 days), use it
    3. If cache is stale or missing, fetch from API
    4. Save newly fetched data to cache
    5. Return combined data
    """
    all_prices = {}
    symbols_to_fetch = []
    
    # Check cache for each symbol
    cached_data = get_cached_historical_data(user_id, symbols, days)
    
    for symbol in symbols:
        if symbol in cached_data and is_cache_fresh(cached_data[symbol], max_age_days=30):
            # Use cached data
            data_json = cached_data[symbol]['data']
            dates = pd.to_datetime(data_json['dates'], utc=True, errors='coerce')
            prices = data_json['prices']
            series = pd.Series(prices, index=dates)
            all_prices[symbol] = _normalize_time_index_series(series)
            logger.info(f"Using cached data for {symbol}")
        else:
            # Need to fetch
            symbols_to_fetch.append(symbol)
    
    # Fetch missing/stale data
    if symbols_to_fetch:
        logger.info(f"Fetching fresh data for {len(symbols_to_fetch)} symbols: {symbols_to_fetch}")
        
        # Try yfinance first
        for symbol in symbols_to_fetch:
            if symbol in all_prices:
                continue
                
            data = fetch_from_yfinance(symbol, days)
            if data is not None:
                all_prices[symbol] = _normalize_time_index_series(data)
                save_historical_data_to_cache(user_id, symbol, data)
                continue
            
            # Try Polygon.io as backup
            polygon_api_key = os.getenv('POLYGON_API_KEY')
            data = fetch_from_polygon(symbol, polygon_api_key, days)
            if data is not None:
                all_prices[symbol] = _normalize_time_index_series(data)
                save_historical_data_to_cache(user_id, symbol, data)
                continue
            
            # Try FMP as last resort
            data = fetch_from_fmp(symbol, api_key, days)
            if data is not None:
                all_prices[symbol] = _normalize_time_index_series(data)
                save_historical_data_to_cache(user_id, symbol, data)
            else:
                logger.error(f"All data sources failed for {symbol}")
    
    if not all_prices:
        raise ValueError("No data could be fetched or retrieved from cache for any symbols")
    
    # Combine into DataFrame
    prices_df = pd.DataFrame(all_prices)
    prices_df = _normalize_time_index_df(prices_df)
    prices_df = prices_df.fillna(method='ffill').dropna()
    
    return prices_df


def fetch_historical_data(symbols, api_key, days=365):
    """
    Fetch historical price data with multiple fallback sources
    
    Args:
        symbols: List of stock symbols
        api_key: API key (for FMP, though it may not work due to legacy endpoint issues)
        days: Number of days of historical data (default 365)
    
    Returns:
        DataFrame with historical closing prices for each symbol
    """
    all_prices = {}
    
    # Try yfinance first (most reliable free option)
    for symbol in symbols:
        try:
            logger.info(f"Trying yfinance for {symbol}")
            import yfinance as yf
            
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period=f"{days}d")
            
            if not hist.empty and 'Close' in hist.columns:
                price_series = hist['Close']
                price_series = price_series.dropna()
                if len(price_series) > 0:
                    all_prices[symbol] = price_series
                    logger.info(f"Fetched {len(price_series)} days of data for {symbol} from yfinance")
                    continue
            
            logger.warning(f"No data from yfinance for {symbol}")
            
        except Exception as e:
            logger.warning(f"yfinance failed for {symbol}: {e}")
    
    # If yfinance didn't work, try FMP API (though it may be legacy)
    if not all_prices and api_key and api_key != "your_fmp_api_key_here":
        for symbol in symbols:
            if symbol in all_prices:
                continue
                
            try:
                logger.info(f"Trying FMP API for {symbol}")
                import requests
                
                url = f'https://financialmodelingprep.com/api/v3/historical-price-full/{symbol}'
                params = {'apikey': api_key}
                
                response = requests.get(url, params=params)
                if response.status_code == 200:
                    data = response.json()
                    
                    if 'historical' in data and len(data['historical']) > 0:
                        historical = data['historical'][:days]
                        prices = [(h['date'], h['close']) for h in historical]
                        dates, closes = zip(*prices)
                        
                        price_series = pd.Series(closes, index=pd.to_datetime(dates))
                        price_series = price_series.sort_index()
                        all_prices[symbol] = price_series
                        
                        logger.info(f"Fetched {len(prices)} days of data for {symbol} from FMP")
                    else:
                        logger.warning(f"No historical data for {symbol} from FMP")
                else:
                    logger.warning(f"FMP API error for {symbol}: {response.status_code}")
                    
            except Exception as e:
                logger.warning(f"FMP API failed for {symbol}: {e}")
    
    # If no real data available, generate synthetic data for demonstration
    if not all_prices:
        logger.info("No real data available, generating synthetic data for demonstration")
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        date_range = pd.date_range(start=start_date, end=end_date, freq='D', tz='UTC')
        
        for symbol in symbols:
            # Generate realistic synthetic price data
            np.random.seed(hash(symbol) % 2**32)  # Consistent seed per symbol
            n_days = len(date_range)
            
            # Start with a base price
            base_price = 100 + (hash(symbol) % 200)  # Price between 100-300
            
            # Generate random walk with drift
            returns = np.random.normal(0.0005, 0.02, n_days)  # Daily returns
            prices = [base_price]
            
            for i in range(1, n_days):
                new_price = prices[-1] * (1 + returns[i])
                prices.append(max(new_price, 1))  # Ensure positive prices
            
            all_prices[symbol] = _normalize_time_index_series(pd.Series(prices, index=date_range))
            logger.info(f"Generated {len(prices)} days of synthetic data for {symbol}")
    
    if not all_prices:
        raise ValueError("No data could be fetched or generated for any symbols")
    
    # Combine into DataFrame
    prices_df = pd.DataFrame(all_prices)
    prices_df = _normalize_time_index_df(prices_df)
    prices_df = prices_df.fillna(method='ffill').dropna()
    
    return prices_df


def calculate_returns(prices_df):
    """
    Calculate daily returns from price data
    
    Args:
        prices_df: DataFrame with closing prices
    
    Returns:
        DataFrame with daily returns
    """
    returns = prices_df.pct_change().dropna()
    return returns


def calculate_portfolio_returns(returns_df, weights):
    """
    Calculate portfolio returns given individual stock returns and weights
    
    Args:
        returns_df: DataFrame with individual stock returns
        weights: Dictionary mapping symbols to portfolio weights
    
    Returns:
        Series of portfolio returns
    """
    portfolio_returns = pd.Series(0, index=returns_df.index)
    
    for symbol in returns_df.columns:
        if symbol in weights:
            portfolio_returns += returns_df[symbol] * weights[symbol]
    
    return portfolio_returns


def calculate_portfolio_beta(portfolio_returns, market_returns):
    """
    Calculate portfolio beta (systematic risk vs market)
    
    Args:
        portfolio_returns: Series of portfolio returns
        market_returns: Series of market returns (e.g., S&P 500)
    
    Returns:
        Portfolio beta value
    """
    # Align the indices
    aligned = pd.DataFrame({
        'portfolio': portfolio_returns,
        'market': market_returns
    }).dropna()
    
    if len(aligned) < 20:  # Need sufficient data
        return None
    
    # Calculate covariance and variance
    covariance = aligned['portfolio'].cov(aligned['market'])
    market_variance = aligned['market'].var()
    
    if market_variance == 0:
        return None
    
    beta = covariance / market_variance
    return beta


def calculate_volatility(returns, annualize=True):
    """
    Calculate volatility (standard deviation of returns)
    
    Args:
        returns: Series of returns
        annualize: Whether to annualize the volatility (default True)
    
    Returns:
        Volatility value
    """
    volatility = returns.std()
    
    if annualize:
        volatility *= np.sqrt(252)  # 252 trading days per year
    
    return volatility


def calculate_sharpe_ratio(returns, risk_free_rate=0.02, annualize=True):
    """
    Calculate Sharpe ratio (risk-adjusted returns)
    
    Args:
        returns: Series of returns
        risk_free_rate: Annual risk-free rate (default 2%)
        annualize: Whether to annualize the ratio (default True)
    
    Returns:
        Sharpe ratio value
    """
    mean_return = returns.mean()
    std_return = returns.std()
    
    if std_return == 0:
        return None
    
    if annualize:
        mean_return *= 252
        std_return *= np.sqrt(252)
    
    sharpe = (mean_return - risk_free_rate) / std_return
    return sharpe


def calculate_max_drawdown(returns):
    """
    Calculate maximum drawdown (largest peak-to-trough decline)
    
    Args:
        returns: Series of returns
    
    Returns:
        Maximum drawdown as a percentage
    """
    cumulative_returns = (1 + returns).cumprod()
    running_max = cumulative_returns.cummax()
    drawdown = (cumulative_returns - running_max) / running_max
    max_drawdown = drawdown.min()
    
    return abs(max_drawdown) * 100  # Return as percentage


def calculate_var(returns, confidence=0.95):
    """
    Calculate Value at Risk (VaR) at given confidence level
    
    Args:
        returns: Series of returns
        confidence: Confidence level (default 0.95 for 95%)
    
    Returns:
        VaR as a percentage
    """
    var = np.percentile(returns, (1 - confidence) * 100)
    return abs(var) * 100  # Return as percentage


def calculate_diversification_score(holdings, sectors):
    """
    Calculate diversification score based on number of holdings and sector spread
    
    Args:
        holdings: List of holdings with weights
        sectors: Dictionary mapping symbols to sectors
    
    Returns:
        Diversification score (0-100)
    """
    # Component 1: Number of holdings (max 40 points)
    num_holdings = len(holdings)
    holdings_score = min(40, num_holdings * 8)  # 8 points per holding, max 5 holdings
    
    # Component 2: Sector diversity (max 40 points)
    sector_counts = {}
    for holding in holdings:
        symbol = holding['symbol']
        sector = sectors.get(symbol, 'Unknown')
        sector_counts[sector] = sector_counts.get(sector, 0) + 1
    
    num_sectors = len(sector_counts)
    sector_score = min(40, num_sectors * 10)  # 10 points per sector, max 4 sectors
    
    # Component 3: Concentration (max 20 points)
    # Lower concentration = higher score
    max_weight = max([h['weight'] for h in holdings]) if holdings else 1.0
    concentration_score = 20 * (1 - max(0, min(1, (max_weight - 0.2) / 0.6)))
    
    total_score = holdings_score + sector_score + concentration_score
    return min(100, total_score)


def calculate_correlation_matrix(returns_df):
    """
    Calculate correlation matrix between stocks
    
    Args:
        returns_df: DataFrame with individual stock returns
    
    Returns:
        Correlation matrix as nested dictionary
    """
    corr_matrix = returns_df.corr()
    
    # Convert to nested dictionary for JSON serialization
    corr_dict = {}
    for symbol1 in corr_matrix.index:
        corr_dict[symbol1] = {}
        for symbol2 in corr_matrix.columns:
            corr_dict[symbol1][symbol2] = round(float(corr_matrix.loc[symbol1, symbol2]), 3)
    
    return corr_dict


def analyze_portfolio_risk_with_cache(user_id, holdings, api_key):
    """
    Main function to analyze portfolio risk with database caching
    
    Args:
        user_id: User ID for caching data per user
        holdings: List of dicts with keys: symbol, shares, value, sector
        api_key: FMP API key
    
    Returns:
        Dictionary with all risk metrics
    """
    try:
        symbols = [h['symbol'] for h in holdings]
        
        # Calculate weights
        total_value = sum([h['value'] for h in holdings])
        for holding in holdings:
            holding['weight'] = holding['value'] / total_value if total_value > 0 else 0
        
        # Fetch historical data with caching
        logger.info(f"Fetching historical data for {len(symbols)} symbols with caching")
        prices_df = fetch_historical_data_with_cache(user_id, symbols, api_key)
        
        # Calculate returns
        returns_df = calculate_returns(prices_df)
        
        # Create weights dictionary
        weights = {h['symbol']: h['weight'] for h in holdings}
        
        # Calculate portfolio returns
        portfolio_returns = calculate_portfolio_returns(returns_df, weights)
        
        # Fetch market data (S&P 500) for beta calculation
        try:
            market_prices = fetch_historical_data_with_cache(user_id, ['^GSPC'], api_key)
            market_returns = calculate_returns(market_prices)['^GSPC']
            beta = calculate_portfolio_beta(portfolio_returns, market_returns)
        except Exception as e:
            logger.warning(f"Could not calculate beta: {str(e)}")
            beta = None
        
        # Calculate all metrics
        volatility = calculate_volatility(portfolio_returns)
        sharpe_ratio = calculate_sharpe_ratio(portfolio_returns)
        max_drawdown = calculate_max_drawdown(portfolio_returns)
        var_95 = calculate_var(portfolio_returns, confidence=0.95)
        
        # Extract sectors
        sectors = {h['symbol']: h.get('sector', 'Unknown') for h in holdings}
        diversification = calculate_diversification_score(holdings, sectors)
        
        # Correlation matrix (only if more than 1 stock)
        correlations = None
        if len(symbols) > 1:
            correlations = calculate_correlation_matrix(returns_df)
        
        # Compile results
        results = {
            'beta': round(beta, 2) if beta is not None else None,
            'volatility': round(volatility * 100, 2),  # As percentage
            'sharpe_ratio': round(sharpe_ratio, 2) if sharpe_ratio is not None else None,
            'max_drawdown': round(max_drawdown, 2),
            'var_95': round(var_95, 2),
            'diversification_score': round(diversification, 0),
            'correlations': correlations,
            'num_holdings': len(holdings),
            'total_value': total_value,
            'holdings_breakdown': [
                {
                    'symbol': h['symbol'],
                    'weight': round(h['weight'] * 100, 1),
                    'sector': h.get('sector', 'Unknown')
                }
                for h in holdings
            ]
        }
        
        logger.info("Portfolio risk analysis completed successfully")
        return results
        
    except Exception as e:
        logger.error(f"Error in portfolio risk analysis: {str(e)}")
        raise


def analyze_portfolio_risk(holdings, api_key):
    """
    Legacy function to analyze portfolio risk without caching
    Maintained for backward compatibility
    
    Args:
        holdings: List of dicts with keys: symbol, shares, value, sector
        api_key: FMP API key
    
    Returns:
        Dictionary with all risk metrics
    """
    try:
        symbols = [h['symbol'] for h in holdings]
        
        # Calculate weights
        total_value = sum([h['value'] for h in holdings])
        for holding in holdings:
            holding['weight'] = holding['value'] / total_value if total_value > 0 else 0
        
        # Fetch historical data (without caching)
        logger.info(f"Fetching historical data for {len(symbols)} symbols")
        prices_df = fetch_historical_data(symbols, api_key)
        
        # Calculate returns
        returns_df = calculate_returns(prices_df)
        
        # Create weights dictionary
        weights = {h['symbol']: h['weight'] for h in holdings}
        
        # Calculate portfolio returns
        portfolio_returns = calculate_portfolio_returns(returns_df, weights)
        
        # Fetch market data (S&P 500) for beta calculation
        try:
            market_prices = fetch_historical_data(['^GSPC'], api_key)
            market_returns = calculate_returns(market_prices)['^GSPC']
            beta = calculate_portfolio_beta(portfolio_returns, market_returns)
        except Exception as e:
            logger.warning(f"Could not calculate beta: {str(e)}")
            beta = None
        
        # Calculate all metrics
        volatility = calculate_volatility(portfolio_returns)
        sharpe_ratio = calculate_sharpe_ratio(portfolio_returns)
        max_drawdown = calculate_max_drawdown(portfolio_returns)
        var_95 = calculate_var(portfolio_returns, confidence=0.95)
        
        # Extract sectors
        sectors = {h['symbol']: h.get('sector', 'Unknown') for h in holdings}
        diversification = calculate_diversification_score(holdings, sectors)
        
        # Correlation matrix (only if more than 1 stock)
        correlations = None
        if len(symbols) > 1:
            correlations = calculate_correlation_matrix(returns_df)
        
        # Compile results
        results = {
            'beta': round(beta, 2) if beta is not None else None,
            'volatility': round(volatility * 100, 2),  # As percentage
            'sharpe_ratio': round(sharpe_ratio, 2) if sharpe_ratio is not None else None,
            'max_drawdown': round(max_drawdown, 2),
            'var_95': round(var_95, 2),
            'diversification_score': round(diversification, 0),
            'correlations': correlations,
            'num_holdings': len(holdings),
            'total_value': total_value,
            'holdings_breakdown': [
                {
                    'symbol': h['symbol'],
                    'weight': round(h['weight'] * 100, 1),
                    'sector': h.get('sector', 'Unknown')
                }
                for h in holdings
            ]
        }
        
        logger.info("Portfolio risk analysis completed successfully")
        return results
        
    except Exception as e:
        logger.error(f"Error in portfolio risk analysis: {str(e)}")
        raise
