import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';

const availableStocks = [
  { 
    symbol: 'AAPL', 
    name: 'Apple Inc.', 
    price: '$189.98', 
    change: '+1.8%', 
    volume: '52M', 
    marketCap: '$2.9T',
    pe: 28.5,
    sector: 'Technology',
    recommendation: 'Buy',
    sentiment: 'positive'
  },
  { 
    symbol: 'NVDA', 
    name: 'NVIDIA Corp.', 
    price: '$875.28', 
    change: '+5.4%', 
    volume: '45M', 
    marketCap: '$2.1T',
    pe: 65.2,
    sector: 'Technology',
    recommendation: 'Strong Buy',
    sentiment: 'positive'
  },
  { 
    symbol: 'TSLA', 
    name: 'Tesla Inc.', 
    price: '$242.84', 
    change: '+3.2%', 
    volume: '112M', 
    marketCap: '$770B',
    pe: 45.8,
    sector: 'Consumer Discretionary',
    recommendation: 'Hold',
    sentiment: 'neutral'
  },
  { 
    symbol: 'MSFT', 
    name: 'Microsoft Corp.', 
    price: '$378.91', 
    change: '+2.1%', 
    volume: '28M', 
    marketCap: '$2.8T',
    pe: 32.1,
    sector: 'Technology',
    recommendation: 'Buy',
    sentiment: 'positive'
  },
  { 
    symbol: 'META', 
    name: 'Meta Platforms', 
    price: '$352.96', 
    change: '-1.2%', 
    volume: '18M', 
    marketCap: '$900B',
    pe: 24.7,
    sector: 'Communication Services',
    recommendation: 'Hold',
    sentiment: 'neutral'
  },
  { 
    symbol: 'GOOGL', 
    name: 'Alphabet Inc.', 
    price: '$142.15', 
    change: '+0.8%', 
    volume: '22M', 
    marketCap: '$1.8T',
    pe: 26.3,
    sector: 'Communication Services',
    recommendation: 'Buy',
    sentiment: 'positive'
  },
  { 
    symbol: 'AMZN', 
    name: 'Amazon.com Inc.', 
    price: '$155.42', 
    change: '+1.5%', 
    volume: '35M', 
    marketCap: '$1.6T',
    pe: 52.1,
    sector: 'Consumer Discretionary',
    recommendation: 'Buy',
    sentiment: 'positive'
  },
  { 
    symbol: 'JNJ', 
    name: 'Johnson & Johnson', 
    price: '$158.73', 
    change: '+0.3%', 
    volume: '8M', 
    marketCap: '$420B',
    pe: 15.2,
    sector: 'Healthcare',
    recommendation: 'Buy',
    sentiment: 'positive'
  }
];

const sectors = ['All', 'Technology', 'Healthcare', 'Consumer Discretionary', 'Communication Services', 'Energy', 'Financials'];

export function StocksTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('All');
  const [sortBy, setSortBy] = useState('marketCap');

  const filteredStocks = availableStocks.filter(stock => {
    const matchesSearch = stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         stock.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSector = selectedSector === 'All' || stock.sector === selectedSector;
    return matchesSearch && matchesSector;
  });

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'Strong Buy': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'Buy': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'Hold': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'Sell': return 'bg-red-500/20 text-red-400 border-red-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-500/20 text-green-400';
      case 'negative': return 'bg-red-500/20 text-red-400';
      default: return 'bg-yellow-500/20 text-yellow-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <span className="text-orange-400 text-xl">📊</span>
            Available Stocks
          </CardTitle>
          <CardDescription className="text-slate-400">Search and analyze stocks with AI insights</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Search by symbol or company name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
            />
            <Button className="bg-orange-600 hover:bg-orange-700">
              <span className="mr-2">🔍</span>
              Search
            </Button>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {sectors.map((sector) => (
              <Button
                key={sector}
                variant={selectedSector === sector ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSector(sector)}
                className={selectedSector === sector ? "bg-orange-600 hover:bg-orange-700" : "border-slate-600 text-slate-400"}
              >
                {sector}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Market Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-green-400">Gainers</CardTitle>
            <span className="text-green-400 text-lg">📈</span>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">+2.1%</div>
            <p className="text-xs text-green-400">Average gain</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-pink-500/10 border-red-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-red-400">Losers</CardTitle>
            <span className="text-red-400 text-lg">📉</span>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">-0.8%</div>
            <p className="text-xs text-red-400">Average loss</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-blue-400">Volume</CardTitle>
            <span className="text-blue-400 text-lg">📊</span>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">42M</div>
            <p className="text-xs text-blue-400">Average volume</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-purple-400">AI Sentiment</CardTitle>
            <span className="text-purple-400 text-lg">🤖</span>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">Bullish</div>
            <p className="text-xs text-purple-400">75% positive</p>
          </CardContent>
        </Card>
      </div>

      {/* Stocks List */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <span className="text-blue-400 text-lg">📋</span>
            Stock Analysis ({filteredStocks.length} stocks)
          </CardTitle>
          <CardDescription className="text-slate-400">Real-time data with AI-powered insights</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredStocks.map((stock) => (
              <div key={stock.symbol} className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 hover:bg-slate-900 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-white font-medium text-lg">{stock.symbol}</span>
                      <p className="text-slate-400 text-sm">{stock.name}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-white font-medium">{stock.price}</p>
                      <Badge className={
                        stock.change.startsWith('+') 
                          ? 'bg-green-500/20 text-green-400 border-green-500/50' 
                          : 'bg-red-500/20 text-red-400 border-red-500/50'
                      }>
                        {stock.change}
                      </Badge>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-400 text-sm">P/E: {stock.pe}</p>
                      <p className="text-slate-400 text-sm">Vol: {stock.volume}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <Badge className={getRecommendationColor(stock.recommendation)}>
                      {stock.recommendation}
                    </Badge>
                    <Badge className={getSentimentColor(stock.sentiment)}>
                      {stock.sentiment}
                    </Badge>
                    <p className="text-slate-500 text-xs mt-1">{stock.marketCap}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <span className="mr-1">📊</span>
                      Analyze
                    </Button>
                    <Button size="sm" variant="outline" className="border-slate-600 text-slate-400">
                      <span className="mr-1">🤖</span>
                      AI Insights
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Stock Recommendations */}
      <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <span className="text-purple-400 text-lg">🤖</span>
            AI Stock Recommendations
          </CardTitle>
          <CardDescription className="text-slate-400">Personalized recommendations powered by Gemini AI</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg bg-slate-900/50">
              <h4 className="text-white font-medium mb-2">🔥 Hot Picks</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">NVDA - NVIDIA Corp.</span>
                  <Badge className="bg-green-500/20 text-green-400">Strong Buy</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">AAPL - Apple Inc.</span>
                  <Badge className="bg-blue-500/20 text-blue-400">Buy</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">MSFT - Microsoft Corp.</span>
                  <Badge className="bg-blue-500/20 text-blue-400">Buy</Badge>
                </div>
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-slate-900/50">
              <h4 className="text-white font-medium mb-2">💎 Value Plays</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">JNJ - Johnson & Johnson</span>
                  <Badge className="bg-blue-500/20 text-blue-400">Buy</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">META - Meta Platforms</span>
                  <Badge className="bg-yellow-500/20 text-yellow-400">Hold</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">GOOGL - Alphabet Inc.</span>
                  <Badge className="bg-blue-500/20 text-blue-400">Buy</Badge>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-400 text-lg">💡</span>
              <span className="text-blue-400 font-medium">AI Market Insight</span>
            </div>
            <p className="text-slate-200 text-sm">
              Technology sector continues to show strong momentum with AI-related stocks leading gains. 
              Consider diversifying into healthcare and utilities for better risk-adjusted returns.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
