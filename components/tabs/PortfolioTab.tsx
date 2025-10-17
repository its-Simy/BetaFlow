import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

// Mock stock data for adding new stocks
const availableStocks = [
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: '$142.50', change: '+1.2%' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: '$155.30', change: '+0.8%' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', price: '$178.45', change: '-0.5%' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', price: '$162.20', change: '+0.3%' },
  { symbol: 'PG', name: 'Procter & Gamble', price: '$156.80', change: '+0.1%' },
  { symbol: 'KO', name: 'Coca-Cola Co.', price: '$58.90', change: '-0.2%' },
  { symbol: 'WMT', name: 'Walmart Inc.', price: '$164.75', change: '+0.7%' },
  { symbol: 'V', name: 'Visa Inc.', price: '$275.40', change: '+1.1%' },
];

interface StockHolding {
  symbol: string;
  name: string;
  shares: number;
  price: string;
  buyPrice: number;
  value: string;
  change: string;
  weight: string;
  profitLoss: number;
  profitLossPercent: number;
}

const portfolioMetrics = {
  totalValue: '$43,504',
  totalGain: '+$2,847',
  totalGainPercent: '+7.0%',
  dayChange: '+$156',
  dayChangePercent: '+0.36%',
  diversificationScore: 78,
  riskScore: 65,
  correlationToSP500: 0.82
};

const sectorAllocation = [
  { sector: 'Technology', percentage: 65, value: '$28,277', color: 'bg-blue-500' },
  { sector: 'Consumer Discretionary', percentage: 20, value: '$8,701', color: 'bg-green-500' },
  { sector: 'Communication Services', percentage: 10, value: '$4,350', color: 'bg-purple-500' },
  { sector: 'Cash', percentage: 5, value: '$2,176', color: 'bg-gray-500' },
];

const riskAnalysis = [
  { metric: 'Beta', value: '1.24', description: 'Higher volatility than market' },
  { metric: 'Sharpe Ratio', value: '1.85', description: 'Good risk-adjusted returns' },
  { metric: 'Max Drawdown', value: '-12.3%', description: 'Moderate downside risk' },
  { metric: 'VaR (95%)', value: '-3.2%', description: 'Daily loss probability' },
];

export function PortfolioTab() {
  const [holdings, setHoldings] = useState<StockHolding[]>([
    { symbol: 'AAPL', name: 'Apple Inc.', shares: 50, price: '$189.98', buyPrice: 175.50, value: '$9,499', change: '+2.1%', weight: '25.3%', profitLoss: 724, profitLossPercent: 8.2 },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', shares: 20, price: '$875.28', buyPrice: 820.00, value: '$17,506', change: '+5.4%', weight: '46.6%', profitLoss: 1106, profitLossPercent: 6.7 },
    { symbol: 'TSLA', name: 'Tesla Inc.', shares: 30, price: '$242.84', buyPrice: 220.00, value: '$7,285', change: '+3.2%', weight: '19.4%', profitLoss: 685, profitLossPercent: 10.4 },
    { symbol: 'MSFT', name: 'Microsoft Corp.', shares: 15, price: '$378.91', buyPrice: 365.00, value: '$5,684', change: '+1.8%', weight: '15.1%', profitLoss: 209, profitLossPercent: 3.8 },
    { symbol: 'META', name: 'Meta Platforms', shares: 10, price: '$352.96', buyPrice: 380.00, value: '$3,530', change: '-1.2%', weight: '9.4%', profitLoss: -271, profitLossPercent: -7.1 },
  ]);
  
  const [showAddStock, setShowAddStock] = useState(false);
  const [selectedStock, setSelectedStock] = useState('');
  const [sharesToAdd, setSharesToAdd] = useState('');
  const [buyPrice, setBuyPrice] = useState('');

  const removeStock = (symbol: string) => {
    setHoldings(holdings.filter(holding => holding.symbol !== symbol));
  };

  const addStock = () => {
    if (!selectedStock || !sharesToAdd || !buyPrice) return;
    
    const stock = availableStocks.find(s => s.symbol === selectedStock);
    if (!stock) return;
    
    const shares = parseInt(sharesToAdd);
    const currentPrice = parseFloat(stock.price.replace('$', ''));
    const buyPriceNum = parseFloat(buyPrice);
    const currentValue = shares * currentPrice;
    const buyValue = shares * buyPriceNum;
    const profitLoss = currentValue - buyValue;
    const profitLossPercent = ((currentValue - buyValue) / buyValue) * 100;
    
    const newHolding: StockHolding = {
      symbol: stock.symbol,
      name: stock.name,
      shares: shares,
      price: stock.price,
      buyPrice: buyPriceNum,
      value: `$${currentValue.toLocaleString()}`,
      change: stock.change,
      weight: '0%', // Will be calculated based on total portfolio value
      profitLoss: profitLoss,
      profitLossPercent: profitLossPercent
    };
    
    setHoldings([...holdings, newHolding]);
    setSelectedStock('');
    setSharesToAdd('');
    setBuyPrice('');
    setShowAddStock(false);
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-green-400">Total Value</CardTitle>
            <span className="text-green-400 text-lg">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">{portfolioMetrics.totalValue}</div>
            <p className="text-xs text-green-400">{portfolioMetrics.totalGain} ({portfolioMetrics.totalGainPercent})</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-blue-400">Day Change</CardTitle>
            <span className="text-blue-400 text-lg">📈</span>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">{portfolioMetrics.dayChange}</div>
            <p className="text-xs text-blue-400">{portfolioMetrics.dayChangePercent}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-purple-400">Diversification</CardTitle>
            <span className="text-purple-400 text-lg">🎯</span>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">{portfolioMetrics.diversificationScore}/100</div>
            <p className="text-xs text-purple-400">Good diversification</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-orange-400">Risk Score</CardTitle>
            <span className="text-orange-400 text-lg">⚠️</span>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">{portfolioMetrics.riskScore}/100</div>
            <p className="text-xs text-orange-400">Moderate risk</p>
          </CardContent>
        </Card>
      </div>

      {/* Holdings and Sector Allocation */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Holdings */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <span className="text-blue-400 text-lg">📊</span>
                  Portfolio Holdings
                </CardTitle>
                <CardDescription className="text-slate-400">Your current positions</CardDescription>
              </div>
              <Button 
                onClick={() => setShowAddStock(!showAddStock)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <span className="mr-2">➕</span>
                Add Stock
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Add Stock Form */}
            {showAddStock && (
              <div className="mb-6 p-4 rounded-lg bg-slate-900/50 border border-slate-600">
                <h4 className="text-white font-medium mb-4">Add New Stock</h4>
                <div className="grid gap-4 md:grid-cols-4">
                  <div>
                    <label className="text-slate-400 text-sm mb-2 block">Select Stock</label>
                    <select
                      value={selectedStock}
                      onChange={(e) => setSelectedStock(e.target.value)}
                      className="w-full p-2 rounded-md bg-slate-800 border border-slate-600 text-white"
                    >
                      <option value="">Choose a stock...</option>
                      {availableStocks.map((stock) => (
                        <option key={stock.symbol} value={stock.symbol}>
                          {stock.symbol} - {stock.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 text-sm mb-2 block">Number of Shares</label>
                    <Input
                      type="number"
                      placeholder="Enter shares"
                      value={sharesToAdd}
                      onChange={(e) => setSharesToAdd(e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 text-sm mb-2 block">Buy Price ($)</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter buy price"
                      value={buyPrice}
                      onChange={(e) => setBuyPrice(e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={addStock}
                      disabled={!selectedStock || !sharesToAdd || !buyPrice}
                      className="bg-green-600 hover:bg-green-700 w-full"
                    >
                      Add to Portfolio
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {holdings.map((holding) => (
                <div key={holding.symbol} className="p-4 rounded-lg bg-slate-900/50 hover:bg-slate-900 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-lg">{holding.symbol}</span>
                      <span className="text-slate-400 text-sm">{holding.name}</span>
                    </div>
                    <Button
                      onClick={() => removeStock(holding.symbol)}
                      variant="outline"
                      size="sm"
                      className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-400"
                    >
                      <span className="mr-1">🗑️</span>
                      Remove
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-slate-400 text-xs mb-1">Shares</div>
                      <div className="text-white font-medium">{holding.shares}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-xs mb-1">Current Price</div>
                      <div className="text-white font-medium">{holding.price}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-xs mb-1">Buy Price</div>
                      <div className="text-white font-medium">${holding.buyPrice.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-xs mb-1">Current Value</div>
                      <div className="text-white font-medium">{holding.value}</div>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="text-slate-400 text-xs mb-1">P&L</div>
                          <div className={`font-medium ${holding.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {holding.profitLoss >= 0 ? '+' : ''}${holding.profitLoss.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-xs mb-1">P&L %</div>
                          <div className={`font-medium ${holding.profitLossPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {holding.profitLossPercent >= 0 ? '+' : ''}{holding.profitLossPercent.toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-xs mb-1">Daily Change</div>
                          <Badge className={holding.change.startsWith('+') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                            {holding.change}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-slate-400 text-xs mb-1">Weight</div>
                        <div className="text-slate-300 text-sm">{holding.weight}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {holdings.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <span className="text-4xl mb-2 block">📈</span>
                  <p>No stocks in your portfolio yet</p>
                  <p className="text-sm">Click "Add Stock" to get started</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sector Allocation */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <span className="text-purple-400 text-lg">🎯</span>
              Sector Allocation
            </CardTitle>
            <CardDescription className="text-slate-400">Portfolio diversification by sector</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sectorAllocation.map((sector) => (
                <div key={sector.sector} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm">{sector.sector}</span>
                    <span className="text-slate-400 text-sm">{sector.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${sector.color}`}
                      style={{ width: `${sector.percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-slate-500 text-xs">{sector.value}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Analysis */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <span className="text-red-400 text-lg">⚠️</span>
            Risk Analysis
          </CardTitle>
          <CardDescription className="text-slate-400">Portfolio risk metrics and exposure</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {riskAnalysis.map((risk) => (
              <div key={risk.metric} className="p-4 rounded-lg bg-slate-900/50">
                <div className="text-white font-medium mb-1">{risk.metric}</div>
                <div className="text-2xl font-bold text-blue-400 mb-2">{risk.value}</div>
                <div className="text-slate-400 text-sm">{risk.description}</div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-400 text-lg">🤖</span>
              <span className="text-blue-400 font-medium">AI Portfolio Insights</span>
            </div>
            <p className="text-slate-200 text-sm mb-3">
              Your portfolio shows strong technology concentration (65%) with good diversification across sectors. 
              The high beta (1.24) indicates higher volatility but also higher growth potential.
            </p>
            <div className="flex gap-2">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <span className="mr-2">📊</span>
                Rebalance Portfolio
              </Button>
              <Button variant="outline" className="border-slate-600 text-slate-400">
                <span className="mr-2">🎯</span>
                Optimize Risk
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <span className="text-purple-400 text-lg">🤖</span>
            AI Portfolio Recommendations
          </CardTitle>
          <CardDescription className="text-slate-400">Personalized insights powered by Gemini AI</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-slate-900/50">
              <h4 className="text-white font-medium mb-2">💡 Diversification Opportunity</h4>
              <p className="text-slate-300 text-sm mb-3">
                Consider adding healthcare or utilities stocks to reduce technology concentration and improve sector diversification.
              </p>
              <Button variant="outline" size="sm" className="border-slate-600 text-slate-400">
                View Recommendations
              </Button>
            </div>
            
            <div className="p-4 rounded-lg bg-slate-900/50">
              <h4 className="text-white font-medium mb-2">📈 Growth Potential</h4>
              <p className="text-slate-300 text-sm mb-3">
                Your NVIDIA position (46.6% weight) shows strong momentum. Consider taking partial profits to rebalance.
              </p>
              <Button variant="outline" size="sm" className="border-slate-600 text-slate-400">
                Analyze Position
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
