import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';

interface MarketIndicator {
  name: string;
  value: string;
  change: string;
  positive: boolean;
}

interface Insights {
  topGainer: string;
  topLoser: string;
  marketSentiment: {
    sentiment: string;
    description: string;
    strength: number;
  };
  activeTraders: {
    count: number;
    trend: 'up' | 'down' | 'stable';
    percentage: number;
  };
  volume: {
    total: number;
    average: number;
    trend: 'high' | 'normal' | 'low';
  };
}

interface SummaryCardsProps {
  apiUrl?: string;
}

const SummaryCards = ({ apiUrl = 'http://localhost:5055/api/summary-cards' }: SummaryCardsProps) => {
  const [marketIndicators, setMarketIndicators] = useState<MarketIndicator[]>([]);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => {
    const fetchSummaryCards = async () => {
      try {
        const res = await fetch(apiUrl);
        const data = await res.json();
        setMarketIndicators(data.indicators);
        setInsights(data.insights);
        setLastUpdated(new Date().toLocaleTimeString());
      } catch (err) {
        console.error('Failed to fetch summary cards:', err);
        setInsights({
          topGainer: 'N/A',
          topLoser: 'N/A',
          marketSentiment: {
            sentiment: 'Unknown',
            description: 'Data unavailable',
            strength: 0,
          },
          activeTraders: {
            count: 0,
            trend: 'stable',
            percentage: 0,
          },
          volume: {
            total: 0,
            average: 0,
            trend: 'normal',
          },
        });
      }
    };

    fetchSummaryCards();
  }, [apiUrl]);

  return (
    <div className="space-y-6">
      {/* Market Overview Section */}
      <div>
        <h2 className="text-white text-xl font-semibold flex items-center gap-2">📈 Market Overview</h2>
        {lastUpdated && (
          <p className="text-slate-400 text-sm">Last updated: {lastUpdated}</p>
        )}
      </div>

      {/* Stock Indicators Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {marketIndicators.map((indicator) => (
          <Card key={indicator.name} className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm text-slate-300">{indicator.name}</CardTitle>
              <span className={`text-lg ${indicator.positive ? 'text-green-500' : 'text-red-500'}`}>
                {indicator.positive ? '📈' : '📉'}
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-white text-2xl">{indicator.value}</div>
              <p className={`text-xs ${indicator.positive ? 'text-green-500' : 'text-red-500'}`}>
                {indicator.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Insights Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {/* Top Gainer */}
        <Card className="bg-green-500/10 border-green-500/30 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-green-400">Top Gainer</CardTitle>
            <span className="text-green-400 text-lg">📈</span>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl font-semibold">
              {insights?.topGainer.split(' ')[0] || 'N/A'}
            </div>
            <p className="text-xs text-green-400">
              {insights?.topGainer || 'Loading...'}
            </p>
          </CardContent>
        </Card>

        {/* Top Loser */}
        <Card className="bg-red-500/10 border-red-500/30 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-red-400">Top Loser</CardTitle>
            <span className="text-red-400 text-lg">📉</span>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl font-semibold">
              {insights?.topLoser.split(' ')[0] || 'N/A'}
            </div>
            <p className="text-xs text-red-400">
              {insights?.topLoser || 'Loading...'}
            </p>
          </CardContent>
        </Card>

        {/* Market Sentiment */}
        <Card className="bg-sky-500/10 border-sky-500/30 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-sky-400">Market Sentiment</CardTitle>
            <span className="text-sky-400 text-lg">📊</span>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl font-semibold">
              {insights?.marketSentiment?.sentiment || 'Loading...'}
            </div>
            <p className="text-xs text-sky-400">
              {insights?.marketSentiment?.description || 'Fetching data...'}
            </p>
          </CardContent>
        </Card>

        {/* Active Traders */}
        <Card className="bg-blue-500/10 border-blue-500/30 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-blue-400">Active Traders</CardTitle>
            <span className="text-blue-400 text-lg">👥</span>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl font-semibold">
              {insights?.activeTraders?.count
                ? `${(insights.activeTraders.count / 1000).toFixed(1)}K`
                : '0'}
            </div>
            <p className={`text-xs ${
              insights?.activeTraders?.trend === 'up'
                ? 'text-green-400'
                : insights?.activeTraders?.trend === 'down'
                ? 'text-red-400'
                : 'text-blue-400'
            }`}>
              {insights?.activeTraders?.trend === 'up' ? '+' : ''}
              {insights?.activeTraders?.percentage || 0}% from yesterday
            </p>
          </CardContent>
        </Card>

        {/* Trading Volume */}
        <Card className="bg-yellow-500/10 border-yellow-500/30 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-yellow-400">Trading Volume</CardTitle>
            <span className="text-yellow-400 text-lg">📦</span>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl font-semibold">
              {insights?.volume
                ? `$${(insights.volume.total / 1_000_000_000).toFixed(1)}B`
                : '$0B'}
            </div>
            <p className={`text-xs ${
              insights?.volume?.trend === 'high'
                ? 'text-green-400'
                : insights?.volume?.trend === 'low'
                ? 'text-red-400'
                : 'text-yellow-400'
            }`}>
              {insights?.volume?.trend === 'high'
                ? 'High volume'
                : insights?.volume?.trend === 'low'
                ? 'Low volume'
                : 'Normal volume'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SummaryCards;