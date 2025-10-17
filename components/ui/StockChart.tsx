import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
    </div>
  );
}
