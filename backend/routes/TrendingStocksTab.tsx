import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
}

const TrendingStocksTab: React.FC = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/stocks/trending')
      .then(res => {
        setStocks(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching trending stocks:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="trending-tab">
      <h2>🔥 Trending Stocks</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {stocks.map(stock => (
            <li key={stock.symbol}>
              <strong>{stock.symbol}</strong> - {stock.name} (${stock.price.toFixed(2)})
              <span style={{ color: stock.change >= 0 ? 'green' : 'red' }}>
                {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TrendingStocksTab;