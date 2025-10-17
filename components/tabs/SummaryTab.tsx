import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

const marketIndicators = [
  { name: 'S&P 500', value: '4,783.45', change: '+1.2%', positive: true },
  { name: 'DOW JONES', value: '37,545.33', change: '+0.8%', positive: true },
  { name: 'NASDAQ', value: '15,055.65', change: '-0.3%', positive: false },
  { name: 'VIX', value: '13.2', change: '-2.1%', positive: true },
];

const trendingStocks = [
  { ticker: 'NVDA', name: 'NVIDIA', price: '$875.28', change: '+5.4%', sentiment: 'Strong Buy', volume: '45M' },
  { ticker: 'TSLA', name: 'Tesla Inc.', price: '$242.84', change: '+3.2%', sentiment: 'Buy', volume: '112M' },
  { ticker: 'AAPL', name: 'Apple Inc.', price: '$189.98', change: '+1.8%', sentiment: 'Hold', volume: '52M' },
  { ticker: 'MSFT', name: 'Microsoft', price: '$378.91', change: '+2.1%', sentiment: 'Buy', volume: '28M' },
  { ticker: 'META', name: 'Meta Platforms', price: '$352.96', change: '-1.2%', sentiment: 'Hold', volume: '18M' },
];

const aiInsights = [
  'Tech sector showing strong momentum with AI-driven growth',
  'Federal Reserve signals potential rate stabilization',
  'Energy sector experiencing volatility due to geopolitical tensions',
  'Healthcare stocks undervalued based on Q4 earnings reports',
];

export function SummaryTab() {
  return (
    <div className="space-y-6">
      {/* Market Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {marketIndicators.map((indicator) => (
          <Card key={indicator.name} className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm text-slate-300">{indicator.name}</CardTitle>
              {indicator.positive ? (
                <span className="text-green-500 text-lg">📈</span>
              ) : (
                <span className="text-red-500 text-lg">📉</span>
              )}
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

      {/* Trending Stocks and AI Insights */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Trending Stocks */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <span className="text-blue-400 text-lg">📊</span>
              Trending Stocks
            </CardTitle>
            <CardDescription className="text-slate-400">Most active stocks today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trendingStocks.map((stock) => (
                <div key={stock.ticker} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 hover:bg-slate-900 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white">{stock.ticker}</span>
                      <span className="text-slate-400 text-sm">{stock.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-slate-300 text-sm">{stock.price}</span>
                      <Badge variant="outline" className={stock.change.startsWith('+') ? 'text-green-500 border-green-500/50' : 'text-red-500 border-red-500/50'}>
                        {stock.change}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={
                      stock.sentiment === 'Strong Buy' ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' :
                      stock.sentiment === 'Buy' ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' :
                      'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                    }>
                      {stock.sentiment}
                    </Badge>
                    <p className="text-slate-500 text-xs mt-1">Vol: {stock.volume}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Market Insights */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <span className="text-purple-400 text-lg">🤖</span>
              AI Market Insights
            </CardTitle>
            <CardDescription className="text-slate-400">Real-time sentiment analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {aiInsights.map((insight, index) => (
                <div key={index} className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-slate-200 text-sm">{insight}</p>
                </div>
              ))}
              <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-purple-400 text-lg">💰</span>
                  <span className="text-purple-400 text-sm">Portfolio Recommendation</span>
                </div>
                <p className="text-slate-200 text-sm">
                  Consider rebalancing towards defensive sectors. Market volatility expected to increase next week.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-green-400">Market Sentiment</CardTitle>
            <span className="text-green-400 text-lg">📈</span>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">Bullish</div>
            <p className="text-xs text-green-400">68% positive indicators</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-blue-400">Active Traders</CardTitle>
            <span className="text-blue-400 text-lg">👥</span>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">2.4M</div>
            <p className="text-xs text-blue-400">+12% from yesterday</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-purple-400">Trading Volume</CardTitle>
            <span className="text-purple-400 text-lg">📊</span>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">$847B</div>
            <p className="text-xs text-purple-400">Above average volume</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
