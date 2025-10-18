import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from './button';
import { Input } from './input';
import { Card, CardContent, CardHeader, CardTitle } from './card';

interface YFinanceStockData {
  symbol: string;
  name: string;
  current_price: number;
  currency: string;
  exchange: string;
  market_cap: number;
  sector: string;
  industry: string;
  description: string;
  logo_url: string;
  website: string;
  employees: number;
  city: string;
  state: string;
  country: string;
  phone: string;
  ceo: string;
  founded: string;
  dividend_yield: number;
  pe_ratio: number;
  eps: number;
  beta: number;
  "52_week_high": number;
  "52_week_low": number;
  volume: number;
  avg_volume: number;
  market_state: string;
}

interface YFinanceHistoryData {
  symbol: string;
  period: string;
  interval: string;
  data: Array<{
    date: string;
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    adj_close: number;
  }>;
}

interface StockChartProps {
  symbol: string;
}

export default function StockChart({ symbol }: StockChartProps) {
  const [stockData, setStockData] = useState<YFinanceStockData | null>(null);
  const [historyData, setHistoryData] = useState<YFinanceHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Portfolio addition state
  const [showAddForm, setShowAddForm] = useState(false);
  const [shares, setShares] = useState('');
  const [price, setPrice] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchStockData();
  }, [symbol]);

  const fetchStockData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch stock details and history in parallel
      const [stockResponse, historyResponse] = await Promise.all([
        fetch(`/api/stocks/yfinance/${symbol}`),
        fetch(`/api/stocks/yfinance/${symbol}?history=true&period=1mo&interval=1d`)
      ]);
      
      if (!stockResponse.ok) {
        const errorData = await stockResponse.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to fetch stock data: ${stockResponse.status}`);
      }
      
      if (!historyResponse.ok) {
        const errorData = await historyResponse.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to fetch history data: ${historyResponse.status}`);
      }
      
      const stock = await stockResponse.json();
      const history = await historyResponse.json();
      
      // Check if we have any meaningful data
      if (!stock.current_price && (!history.data || history.data.length === 0)) {
        throw new Error("We don't have information on this stock");
      }
      
      setStockData(stock);
      setHistoryData(history);
      
      // Set current price for portfolio addition
      setPrice(stock.current_price?.toString() || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stock data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToPortfolio = async () => {
    if (!shares || !price || !stockData) return;

    const sharesNum = parseFloat(shares);
    const priceNum = parseFloat(price);

    if (isNaN(sharesNum) || sharesNum <= 0) {
      setAddError('Please enter a valid number of shares');
      return;
    }

    if (isNaN(priceNum) || priceNum <= 0) {
      setAddError('Please enter a valid price');
      return;
    }

    setIsAdding(true);
    setAddError(null);
    setAddSuccess(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please log in to add stocks to your portfolio');
      }

      const response = await fetch('/api/portfolio/stocks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          stock_symbol: stockData.symbol,
          stock_name: stockData.name,
          shares_owned: sharesNum,
          purchase_price: priceNum,
          current_price: stockData.current_price,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to add stock to portfolio');
      }

      setAddSuccess('Stock added to portfolio successfully!');
      setShares('');
      setPrice(stockData.current_price?.toString() || '');
      setShowAddForm(false);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add stock to portfolio');
    } finally {
      setIsAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading {symbol} data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400 text-center">
          <div className="text-lg font-medium mb-2">⚠️ {error}</div>
          <div className="text-sm text-slate-400">Try searching for a different stock symbol</div>
        </div>
      </div>
    );
  }

  if (!stockData || !historyData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400 text-center">
          <div className="text-lg font-medium mb-2">We don't have information on this stock</div>
          <div className="text-sm">Try searching for a different symbol</div>
        </div>
      </div>
    );
  }

  // Format historical data for the chart
  const chartData = (historyData.data || []).map(item => ({
    date: new Date(item.date).toLocaleDateString(),
    price: item.close,
    volume: item.volume
  }));

  const currentPrice = stockData.current_price || (chartData.length > 0 ? chartData[chartData.length - 1].price : 0);
  const previousClose = chartData.length >= 2 ? chartData[chartData.length - 2].price : currentPrice;
  const change = currentPrice - previousClose;
  const changePercent = previousClose ? (change / previousClose) * 100 : 0;

  return (
    <div className="w-full">
      {/* Stock Info Header */}
      <div className="mb-4">
        <h2 className="text-white text-2xl font-bold">{stockData.symbol}</h2>
        <p className="text-slate-400 text-sm mb-2">{stockData.name}</p>
        <div className="flex items-center gap-4">
          <span className="text-white text-3xl font-bold">${currentPrice.toFixed(2)}</span>
          <span className={`text-lg ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? '+' : ''}{change.toFixed(2)} ({changePercent.toFixed(2)}%)
          </span>
        </div>
        <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
          <span>Sector: {stockData.sector}</span>
          <span>•</span>
          <span>Market Cap: ${(stockData.market_cap / 1e9).toFixed(1)}B</span>
          <span>•</span>
          <span>P/E: {stockData.pe_ratio?.toFixed(1) || 'N/A'}</span>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: '#ffffff' }}
                axisLine={{ stroke: '#ffffff' }}
                tickLine={{ stroke: '#ffffff' }}
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis 
                domain={['dataMin - 5', 'dataMax + 5']}
                tick={{ fontSize: 12, fill: '#ffffff' }}
                axisLine={{ stroke: '#ffffff' }}
                tickLine={{ stroke: '#ffffff' }}
                tickFormatter={(value) => `$${value.toFixed(2)}`}
              />
              <Tooltip 
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-64 w-full flex items-center justify-center">
          <div className="text-slate-400 text-center">
            <div className="text-lg font-medium mb-2">No historical data available</div>
            <div className="text-sm">Only current price data is available for this stock</div>
          </div>
        </div>
      )}

      {/* Additional Info */}
      {stockData && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-slate-400">52W High:</span>
            <span className="text-white ml-2 font-medium">${stockData["52_week_high"]?.toFixed(2) || 'N/A'}</span>
          </div>
          <div>
            <span className="text-slate-400">52W Low:</span>
            <span className="text-white ml-2 font-medium">${stockData["52_week_low"]?.toFixed(2) || 'N/A'}</span>
          </div>
          <div>
            <span className="text-slate-400">Volume:</span>
            <span className="text-white ml-2 font-medium">{stockData.volume?.toLocaleString() || 'N/A'}</span>
          </div>
          <div>
            <span className="text-slate-400">Beta:</span>
            <span className="text-white ml-2 font-medium">{stockData.beta?.toFixed(2) || 'N/A'}</span>
          </div>
        </div>
      )}

      {/* Add to Portfolio Section */}
      {stockData && (
        <div className="mt-6">
          {!showAddForm ? (
            <Button
              onClick={() => setShowAddForm(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Add to Portfolio
            </Button>
          ) : (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">Add {stockData.symbol} to Portfolio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-400 text-sm mb-1 block">Number of Shares</label>
                    <Input
                      type="number"
                      placeholder="Enter shares"
                      value={shares}
                      onChange={(e) => setShares(e.target.value)}
                      className="bg-slate-900/50 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 text-sm mb-1 block">Purchase Price per Share</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter price"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="bg-slate-900/50 border-slate-700 text-white"
                    />
                  </div>
                </div>
                
                {addError && (
                  <div className="text-red-400 text-sm">{addError}</div>
                )}
                
                {addSuccess && (
                  <div className="text-green-400 text-sm">{addSuccess}</div>
                )}
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddToPortfolio}
                    disabled={isAdding || !shares || !price}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isAdding ? 'Adding...' : 'Add to Portfolio'}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowAddForm(false);
                      setAddError(null);
                      setAddSuccess(null);
                    }}
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
