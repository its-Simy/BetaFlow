import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../ui/card';

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  source: string;
  lastUpdated: string;
}

const fallbackStocks: Stock[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 175.12, change: 1.23, source: 'Dummy Data', lastUpdated: new Date().toISOString() },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 312.45, change: -0.87, source: 'Dummy Data', lastUpdated: new Date().toISOString() },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 489.30, change: 2.15, source: 'Dummy Data', lastUpdated: new Date().toISOString() },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 245.67, change: -1.02, source: 'Dummy Data', lastUpdated: new Date().toISOString() },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 132.89, change: 0.56, source: 'Dummy Data', lastUpdated: new Date().toISOString() },
];

const TrendingStocksTab: React.FC = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await axios.get('/api/stocks/trending');
        if (Array.isArray(res.data) && res.data.length > 0) {
          setStocks(res.data.slice(0, 5));
        } else {
          console.warn('Unexpected response format or empty array:', res.data);
          setStocks(fallbackStocks);
        }
      } catch (err) {
        console.error('Error fetching trending stocks:', err);
        setStocks(fallbackStocks);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
    const interval = setInterval(fetchTrending, 60000); // Refresh every 60s
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <span className="text-green-400 text-lg">📊</span>
          Trending Stocks
        </CardTitle>
        <CardDescription className="text-slate-400">
          Top 5 movers based on volume and momentum
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-slate-300">Loading...</p>
        ) : (
          <div className="space-y-4">
            {stocks.map((stock) => (
              <div
                key={stock.symbol}
                className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex flex-col gap-2"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <strong className="text-white">{stock.symbol}</strong>{' '}
                    <span className="text-slate-300">- {stock.name}</span>
                  </div>
                  <div className="flex gap-4 items-center">
                    <span className="text-white">${stock.price.toFixed(2)}</span>
                    <span
                      className={`font-medium ${
                        stock.change >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {stock.change >= 0 ? '+' : ''}
                      {stock.change.toFixed(2)}%
                    </span>
                  </div>
                </div>
                <div className="text-xs text-slate-400 flex justify-between">
                  <span>Source: {stock.source}</span>
                  <span>Updated: {new Date(stock.lastUpdated).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrendingStocksTab;