import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from './button';
import { Input } from './input';
import { Card, CardContent, CardHeader, CardTitle } from './card';

interface StockData {
  symbol: string;
  current: {
    c: number; // close price
    h: number; // high
    l: number; // low
    o: number; // open
    v: number; // volume
  } | null;
  historical: Array<{
    t: number; // timestamp
    c: number; // close
    h: number; // high
    l: number; // low
    o: number; // open
    v: number; // volume
  }>;
  timestamp: string;
}

interface StockChartProps {
  symbol: string;
}

export default function StockChart({ symbol }: StockChartProps) {
  const [data, setData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Add to Portfolio form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [shares, setShares] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchStockData();
  }, [symbol]);

  const fetchStockData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/stocks/${symbol}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to fetch data: ${response.status}`);
      }
      
      const stockData = await response.json();
      
      // Check if we have any meaningful data
      if (!stockData.current && (!stockData.historical || stockData.historical.length === 0)) {
        throw new Error("We don't have information on this stock");
      }
      
      setData(stockData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stock data');
    } finally {
      setLoading(false);
    }
  };

  // Form reset function
  const resetForm = () => {
    setShares('');
    setPurchasePrice('');
    setShowAddForm(false);
    setIsAdding(false);
  };

  // Real API handlers
  const handleAddToPortfolio = async () => {
    if (!shares || !purchasePrice) {
      alert('Please fill in both fields');
      return;
    }

    setIsAdding(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to add stocks to your portfolio');
        return;
      }

      // Get stock name from the data if available
      const stockName = data?.symbol || symbol;
      
      const response = await fetch('/api/portfolio/stocks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          stock_symbol: symbol,
          stock_name: stockName,
          shares_owned: parseFloat(shares),
          purchase_price: parseFloat(purchasePrice),
          current_price: currentPrice
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add stock to portfolio');
      }

      const result = await response.json();
      alert(`Stock added successfully!\n${shares} shares of ${symbol} at $${purchasePrice} per share`);
      resetForm();
    } catch (error) {
      console.error('Error adding stock to portfolio:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to add stock to portfolio'}`);
    } finally {
      setIsAdding(false);
    }
  };

  const handleCancel = () => {
    resetForm();
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

  if (!data) {
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
  const chartData = (data.historical || []).map(item => ({
    date: new Date(item.t).toLocaleDateString(),
    price: item.c,
    volume: item.v
  }));

  const currentPrice = data.current?.c || (chartData.length > 0 ? chartData[chartData.length - 1].price : 0);
  const previousClose = chartData.length >= 2 ? chartData[chartData.length - 2].price : currentPrice;
  const change = currentPrice - previousClose;
  const changePercent = previousClose ? (change / previousClose) * 100 : 0;

  return (
    <div className="w-full">
      {/* Stock Info Header */}
      <div className="mb-4">
        <h2 className="text-white text-2xl font-bold">{data.symbol}</h2>
        <div className="flex items-center gap-4">
          <span className="text-white text-3xl font-bold">${currentPrice.toFixed(2)}</span>
          <span className={`text-lg ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? '+' : ''}{change.toFixed(2)} ({changePercent.toFixed(2)}%)
          </span>
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
      {data.current && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-slate-400">Open:</span>
            <span className="text-white ml-2 font-medium">${data.current.o.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-slate-400">High:</span>
            <span className="text-white ml-2 font-medium">${data.current.h.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-slate-400">Low:</span>
            <span className="text-white ml-2 font-medium">${data.current.l.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-slate-400">Volume:</span>
            <span className="text-white ml-2 font-medium">{data.current.v.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Add to Portfolio Button */}
      <div className="mt-6">
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <span className="mr-2">+</span>
          Add to Portfolio
        </Button>
      </div>

      {/* Add to Portfolio Form */}
      {showAddForm && (
        <Card className="mt-4 bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Add to Your Portfolio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-slate-400 text-sm mb-2">
                Number of Shares
              </label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="e.g., 10"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            
            <div>
              <label className="block text-slate-400 text-sm mb-2">
                Purchase Price per Share
              </label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="e.g., 150.00"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
              />
              {currentPrice > 0 && (
                <p className="text-slate-500 text-xs mt-1">
                  Current price: ${currentPrice.toFixed(2)}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleAddToPortfolio}
                disabled={isAdding}
                className="bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAdding ? 'Adding...' : 'Add to Portfolio'}
              </Button>
              <Button
                onClick={handleCancel}
                disabled={isAdding}
                variant="outline"
                className="border-slate-600 text-slate-400 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
