# Stock Service

A Python Flask microservice that provides real-time and historical stock data using yfinance.

## Features

- **Real-time Stock Data**: Current prices, quotes, and market information
- **Historical Data**: Price history with customizable periods and intervals
- **Stock Search**: Search for stocks by symbol
- **Batch Operations**: Get data for multiple stocks at once
- **RESTful API**: Clean JSON API endpoints

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Set environment variables (optional):
```bash
export PORT=5002
export FLASK_ENV=development
```

## Running the Service

### Development Mode
```bash
python run.py
```

### Direct Flask
```bash
python app.py
```

The service will start on `http://localhost:5002` by default.

## API Endpoints

### Health Check
- **GET** `/health` - Service health status

### Stock Search
- **GET** `/stocks/search?q=SYMBOL` - Search for a stock by symbol

### Stock Details
- **GET** `/stocks/SYMBOL` - Get detailed information for a stock

### Stock History
- **GET** `/stocks/SYMBOL/history` - Get historical price data
  - Query parameters:
    - `period`: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max (default: 1mo)
    - `interval`: 1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo (default: 1d)

### Stock Quote
- **GET** `/stocks/SYMBOL/quote` - Get real-time quote with change data

### Batch Stocks
- **POST** `/stocks/batch` - Get data for multiple stocks
  - Body: `{"symbols": ["AAPL", "GOOGL", "MSFT"]}`

## Testing

Run the test suite:
```bash
python test_service.py
```

## Example Usage

### Get Apple Stock Details
```bash
curl "http://localhost:5002/stocks/AAPL"
```

### Get Apple Stock History (1 month, daily)
```bash
curl "http://localhost:5002/stocks/AAPL/history?period=1mo&interval=1d"
```

### Get Real-time Quote
```bash
curl "http://localhost:5002/stocks/AAPL/quote"
```

### Batch Request
```bash
curl -X POST "http://localhost:5002/stocks/batch" \
  -H "Content-Type: application/json" \
  -d '{"symbols": ["AAPL", "GOOGL", "MSFT"]}'
```

## Data Sources

This service uses [yfinance](https://github.com/ranaroussi/yfinance) which pulls data from Yahoo Finance. The data includes:

- Real-time and historical stock prices
- Company information and fundamentals
- Market data and statistics
- Financial metrics and ratios

## Error Handling

The service includes comprehensive error handling:
- Invalid stock symbols return 404
- Network errors return 500
- Missing parameters return 400
- All errors include descriptive messages

## Integration

This service is designed to integrate with the BetaFlow Next.js application. The Next.js backend can proxy requests to this service for stock data.
