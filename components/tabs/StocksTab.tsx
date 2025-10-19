import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import StockChart from '../ui/StockChart';
import { useSymbolsSearch } from '../../lib/swr-hooks'; // 🔑 Polygon search

// --- Types used by the optional StockRow (left intact) ---
interface ApiStockData {
  symbol: string;
  current: { c: number; h: number; l: number; o: number; v: number } | null;
  historical: Array<{ t: number; c: number; h: number; l: number; o: number; v: number }>;
  timestamp: string;
}

type AvailableStock = {
  symbol: string;
  name: string;
  price: string;
  change: string;
  volume: string;
  marketCap: string;
  pe: number;
  sector: string;
  recommendation: string;
  sentiment: string;
};

// --- Small helpers / styles ---
const getRecommendationColor = (_recommendation: string) =>
  'bg-transparent text-slate-300 border-transparent';

const getSentimentColor = (sentiment: string) => {
  switch (sentiment) {
    case 'positive': return 'bg-transparent text-green-400 border-transparent';
    case 'negative': return 'bg-transparent text-red-400 border-transparent';
    default: return 'bg-transparent text-slate-400 border-transparent';
  }
};

function formatSignedPercent(value: number): string {
  if (value > 0) return `+${value.toFixed(1)}%`;
  if (value < 0) return `${value.toFixed(1)}%`;
  return '0.0%';
}

// Helper functions for data source indicators
function getSourceColor(source: string) {
  switch (source) {
    case 'polygon': return 'text-blue-400 bg-blue-900/30';
    case 'static': return 'text-orange-400 bg-orange-900/30';
    default: return 'text-gray-400 bg-gray-900/30';
  }
}

function getSourceIcon(source: string) {
  switch (source) {
    case 'polygon': return '📡';
    case 'static': return '📋';
    default: return '❓';
  }
}

// --- Optional row component kept for future list usage ---
function StockRow({
  stock, selectedStock, setSelectedStock
}: { stock: AvailableStock; selectedStock: string | null; setSelectedStock: (s: string | null) => void; }) {
  const [apiData, setApiData] = useState<ApiStockData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [dataSource, setDataSource] = useState<string>('unknown');

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/stocks/${stock.symbol}`);
        if (!res.ok) throw new Error(`Failed: ${res.status}`);
        const data: ApiStockData = await res.json();
        if (isMounted) {
          setApiData(data);
          setDataSource((data as any).source || 'unknown');
        }
      } catch {
        if (isMounted) setApiData(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [stock.symbol]);

  const currentPrice = apiData?.current?.c ?? null;
  const chartData = apiData?.historical?.map((i) => ({ t: i.t, c: i.c })) ?? [];
  const prevClose = chartData.length >= 2 ? chartData[chartData.length - 2].c : currentPrice ?? 0;
  const effectiveCurrent = currentPrice ?? (chartData.length ? chartData[chartData.length - 1].c : 0);
  const change = effectiveCurrent - prevClose;
  const changePercent = prevClose ? (change / prevClose) * 100 : 0;

  const sentimentLabel = change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral';
  const sentimentClass = getSentimentColor(sentimentLabel);


  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 hover:bg-slate-900 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <div>
            <span className="text-white font-medium text-lg">{stock.symbol}</span>
            <p className="text-slate-400 text-sm">{stock.name}</p>
          </div>
          <div className="text-center">
            <p className="text-white font-medium">
              {loading ? stock.price : `$${effectiveCurrent.toFixed(2)}`}
            </p>
            <p className={change > 0 ? 'text-green-400' : change < 0 ? 'text-red-400' : 'text-slate-400'}>
              {loading ? stock.change : formatSignedPercent(changePercent)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-slate-400 text-sm">P/E: {stock.pe}</p>
            <p className="text-slate-400 text-sm">Vol: {stock.volume}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <Badge className={getRecommendationColor(stock.recommendation)}>{stock.recommendation}</Badge>
          <Badge className={sentimentClass}>{sentimentLabel}</Badge>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-slate-500">Data:</span>
            <Badge className={`text-xs px-2 py-0.5 ${getSourceColor(dataSource)}`}>
              {getSourceIcon(dataSource)} {dataSource}
            </Badge>
          </div>
          <p className="text-slate-500 text-xs mt-1">{stock.marketCap}</p>
        </div>
        <div className="flex flex-col gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-slate-500 text-slate-300 rounded-full"
            onClick={() => setSelectedStock(selectedStock === stock.symbol ? null : stock.symbol)}
          >
            <span className="mr-1">📊</span>
            {selectedStock === stock.symbol ? 'Hide Chart' : 'View Chart'}
          </Button>
          <Button size="sm" variant="outline" className="border-slate-500 text-slate-300 rounded-full">
            <span className="mr-1">🤖</span>
            AI Insights
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- Static showcase cards (unchanged) ---
const availableStocks: AvailableStock[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: '$189.98', change: '+1.8%', volume: '52M', marketCap: '$2.9T', pe: 28.5, sector: 'Technology', recommendation: 'Buy', sentiment: 'positive' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: '$875.28', change: '+5.4%', volume: '45M', marketCap: '$2.1T', pe: 65.2, sector: 'Technology', recommendation: 'Strong Buy', sentiment: 'positive' },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: '$242.84', change: '+3.2%', volume: '112M', marketCap: '$770B', pe: 45.8, sector: 'Consumer Discretionary', recommendation: 'Hold', sentiment: 'neutral' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: '$378.91', change: '+2.1%', volume: '28M', marketCap: '$2.8T', pe: 32.1, sector: 'Technology', recommendation: 'Buy', sentiment: 'positive' },
  { symbol: 'META', name: 'Meta Platforms', price: '$352.96', change: '-1.2%', volume: '18M', marketCap: '$900B', pe: 24.7, sector: 'Communication Services', recommendation: 'Hold', sentiment: 'neutral' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: '$142.15', change: '+0.8%', volume: '22M', marketCap: '$1.8T', pe: 26.3, sector: 'Communication Services', recommendation: 'Buy', sentiment: 'positive' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: '$155.42', change: '+1.5%', volume: '35M', marketCap: '$1.6T', pe: 52.1, sector: 'Consumer Discretionary', recommendation: 'Buy', sentiment: 'positive' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', price: '$158.73', change: '+0.3%', volume: '8M', marketCap: '$420B', pe: 15.2, sector: 'Healthcare', recommendation: 'Buy', sentiment: 'positive' }
];

const sectors = ['All', 'Technology', 'Healthcare', 'Consumer Discretionary', 'Communication Services', 'Energy', 'Financials'];

export function StocksTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('All');
  const [sortBy, setSortBy] = useState('marketCap'); // currently unused
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [activeSymbol, setActiveSymbol] = useState<string | null>(null);

  // 🔎 Multi-source search with comprehensive fallbacks
  const { results: apiSearchResults, isLoading: searching, isError } = useSymbolsSearch(searchQuery);
  
  // Fallback search using static data when API fails
  const fallbackSearchResults = searchQuery ? availableStocks.filter(stock => 
    stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).map(stock => ({ symbol: stock.symbol, name: stock.name, source: 'static' })) : [];
  
  // Use API results if available, otherwise use fallback
  const searchResults = isError || !apiSearchResults.length ? fallbackSearchResults : apiSearchResults;

  // 🎯 Exact-match preference: if the user typed a full ticker, show only that result
  const upper = searchQuery.trim().toUpperCase();
  const looksLikeTicker = /^[A-Z\.]{1,6}$/.test(upper);
  const exact = looksLikeTicker ? searchResults.find(r => r.symbol === upper) : undefined;
  const displayResults = exact ? [exact] : searchResults;

  // Static cards filter (kept)
  const filteredStocks = availableStocks.filter(stock => {
    const matchesSearch = !searchQuery ||
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         stock.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSector = selectedSector === 'All' || stock.sector === selectedSector;
    return matchesSearch && matchesSector;
  });

  // ⌨️ Enter to open chart on the best match
  const handleEnterToOpen = () => {
    if (exact) {
      setActiveSymbol(upper);
      setSelectedStock(upper);
    } else if (displayResults[0]) {
      setActiveSymbol(displayResults[0].symbol);
      setSelectedStock(displayResults[0].symbol);
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleEnterToOpen(); // ✅ Enter submits search
              }}
              className="flex-1 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
            />
            <Button
              className=" searchButton bg-orange-600 hover:bg-orange-700"
              onClick={handleEnterToOpen}
            >
              <span className="mr-2">🔍</span>
              Search
            </Button>
          </div>

          {/* Results panel */}
          {searchQuery && (
            <div className="mb-4 rounded-lg border border-slate-700 bg-slate-900/50">
              <div className="p-3 border-b border-slate-700 text-slate-400 text-xs">
                Search Results {isError && <span className="text-yellow-400">(using local data)</span>}
              </div>
              <div className="max-h-64 overflow-auto">
                {searching && <div className="p-3 text-slate-400 text-sm">Searching…</div>}
                {!searching && displayResults.length === 0 && (
                  <div className="p-3 text-slate-400 text-sm">No results</div>
                )}
                {!searching && displayResults.map((r) => (
                  <div
                    key={r.symbol}
                    className="flex items-center justify-between p-3 hover:bg-slate-800/50 cursor-pointer"
                    onClick={() => {
                      setActiveSymbol(r.symbol);
                      setSelectedStock(r.symbol);
                    }}
                  >
                    <div>
                      <div className="text-white font-medium">{r.symbol}</div>
                      <div className="text-slate-400 text-xs">{r.name}</div>
                      {(r as any).source && (
                        <div className="flex items-center gap-1 mt-1">
                          <Badge className={`text-xs px-2 py-0.5 ${getSourceColor((r as any).source)}`}>
                            {getSourceIcon((r as any).source)} {(r as any).source}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
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

      {/* Market overview cards (kept) */}
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

      {/* Empty state */}
      {!activeSymbol && (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
              <span className="text-blue-400 text-lg">🏁</span>
              Search a stock to get started
          </CardTitle>
            <CardDescription className="text-slate-400">Enter a ticker like AAPL, MSFT, NVDA to view price and chart</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="text-slate-300 text-sm">
              No data loaded yet. Use the search box above and choose a result or press Enter.
          </div>
        </CardContent>
      </Card>
      )}

      {/* Chart */}
      {(activeSymbol || selectedStock) && (
        <Card className="text-white bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <span className="text-white-400 text-lg">📈</span>
              {(activeSymbol || selectedStock) as string} Real-time Chart
            </CardTitle>
            <CardDescription className="text-slate-400">Live price data and 30-day historical chart (free-tier delayed)</CardDescription>
          </CardHeader>
          <CardContent>
            <StockChart symbol={(activeSymbol || selectedStock) as string} />
          </CardContent>
        </Card>
      )}

      {/* AI suggestions (kept) */}
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
