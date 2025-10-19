# Finance Optimizer Service

Portfolio risk analysis microservice using Financial Modeling Prep (FMP) API for historical data.

## Setup

1. Install Python dependencies:
```bash
cd finance-optimizer
pip3 install -r requirements.txt
```

2. Add your FMP API key to your root `.env` file:
```
FMP_API_KEY=your_actual_fmp_api_key_here
```

**Note:** FMP free tier provides 250 API calls per day with access to historical EOD data.

## Running the Service

```bash
python3 run.py
```

The service will start on `http://localhost:5004`

## API Endpoints

### Health Check
```
GET /health
```

### Analyze Portfolio Risk
```
POST /analyze-risk
Content-Type: application/json

{
  "holdings": [
    {
      "symbol": "AAPL",
      "shares": 10,
      "value": 1700.00,
      "sector": "Technology"
    }
  ]
}
```

**Response:**
```json
{
  "beta": 1.05,
  "volatility": 18.5,
  "sharpe_ratio": 1.2,
  "max_drawdown": 15.3,
  "var_95": 2.5,
  "diversification_score": 65,
  "num_holdings": 1,
  "total_value": 1700.00,
  "holdings_breakdown": [...]
}
```

### Clear Cache
```
POST /clear-cache
```

## Risk Metrics Explained

- **Beta**: Measures market risk (1.0 = same as market, >1.0 = more volatile)
- **Volatility**: Annual standard deviation of returns (as percentage)
- **Sharpe Ratio**: Risk-adjusted returns (higher is better, >1.0 is good)
- **Max Drawdown**: Largest peak-to-trough decline (as percentage)
- **VaR (95%)**: Maximum expected loss with 95% confidence (as percentage)
- **Diversification Score**: 0-100 score based on holdings, sectors, and concentration

## Caching

Results are cached for 24 hours based on portfolio composition to reduce API calls.
