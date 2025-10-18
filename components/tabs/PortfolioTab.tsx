import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';


interface StockHolding {
  id: number;
  stock_symbol: string;
  stock_name: string;
  shares_owned: number;
  purchase_price: number;
  current_price: number;
  purchase_date: string;
  created_at: string;
  updated_at: string;
}

interface PortfolioSummary {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  total_holdings: number;
  total_value: number;
  total_gain_loss: number;
  total_invested: number;
  holdings: StockHolding[];
}

// This will be calculated from real data


interface PortfolioTabProps {
  refreshTrigger?: number;
}

export function PortfolioTab({ refreshTrigger }: PortfolioTabProps = {}) {
  const [holdings, setHoldings] = useState<StockHolding[]>([]);
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch portfolio data on component mount or when refreshTrigger changes
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchPortfolioData();
    } else {
      setLoading(false);
      setError('Please log in to view your portfolio');
    }
  }, [refreshTrigger]);

  const fetchPortfolioData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to view your portfolio');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/portfolio/summary', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Please log in to view your portfolio');
        } else {
          throw new Error('Failed to fetch portfolio data');
        }
        return;
      }

      const data = await response.json();
      setPortfolioSummary(data);
      setHoldings(data.holdings || []);
    } catch (err) {
      console.error('Portfolio fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch portfolio data');
    } finally {
      setLoading(false);
    }
  };

  const removeStock = async (stockId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to manage your portfolio');
        return;
      }

      const response = await fetch(`/api/portfolio/stocks`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ stock_id: stockId }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove stock from portfolio');
      }

      // Refresh portfolio data
      await fetchPortfolioData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove stock');
    }
  };


  // Calculate portfolio metrics from real data
  const calculatePortfolioMetrics = () => {
    if (!portfolioSummary) {
      return {
        totalValue: '$0.00',
        totalGain: '$0.00',
        totalGainPercent: '0.0%',
        diversificationScore: 0,
        riskScore: 0
      };
    }

    // Handle both string and number values from the API
    const totalValue = typeof portfolioSummary.total_value === 'string' 
      ? parseFloat(portfolioSummary.total_value) 
      : portfolioSummary.total_value;
    const totalGain = typeof portfolioSummary.total_gain_loss === 'string' 
      ? parseFloat(portfolioSummary.total_gain_loss) 
      : portfolioSummary.total_gain_loss;
    const totalInvested = typeof portfolioSummary.total_invested === 'string' 
      ? parseFloat(portfolioSummary.total_invested) 
      : portfolioSummary.total_invested;
    
    const totalGainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

    return {
      totalValue: `$${(totalValue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      totalGain: `${(totalGain ?? 0) >= 0 ? '+' : ''}$${(totalGain ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      totalGainPercent: `${(totalGainPercent ?? 0) >= 0 ? '+' : ''}${(totalGainPercent ?? 0).toFixed(1)}%`,
      diversificationScore: Math.min(100, Math.max(0, holdings.length * 20)), // Simple diversification score
      riskScore: Math.min(100, Math.max(0, 50 + ((totalGainPercent ?? 0) * 2))) // Simple risk score
    };
  };

  const metrics = calculatePortfolioMetrics();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-white">Loading portfolio...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500 text-center">
          <div className="text-lg font-medium mb-2">⚠️ {error}</div>
          <Button onClick={fetchPortfolioData} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

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
            <div className="text-white text-2xl">{metrics.totalValue}</div>
            <p className="text-xs text-green-400">{metrics.totalGain} ({metrics.totalGainPercent})</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-blue-400">Holdings</CardTitle>
            <span className="text-blue-400 text-lg">📈</span>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">{holdings.length}</div>
            <p className="text-xs text-blue-400">Stocks in portfolio</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-purple-400">Diversification</CardTitle>
            <span className="text-purple-400 text-lg">🎯</span>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">{metrics.diversificationScore}/100</div>
            <p className="text-xs text-purple-400">Portfolio diversity</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-orange-400">Risk Score</CardTitle>
            <span className="text-orange-400 text-lg">⚠️</span>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">{metrics.riskScore}/100</div>
            <p className="text-xs text-orange-400">Portfolio risk level</p>
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
                onClick={() => window.location.href = '#stocks'}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <span className="mr-2">📈</span>
                Go to Stocks
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {holdings.map((holding) => {
                const currentValue = (holding.shares_owned ?? 0) * (holding.current_price ?? 0);
                const purchaseValue = (holding.shares_owned ?? 0) * (holding.purchase_price ?? 0);
                const profitLoss = currentValue - purchaseValue;
                const profitLossPercent = purchaseValue > 0 ? (profitLoss / purchaseValue) * 100 : 0;
                const totalValue = typeof portfolioSummary?.total_value === 'string' 
                  ? parseFloat(portfolioSummary.total_value) 
                  : (portfolioSummary?.total_value ?? 0);
                const weight = totalValue > 0 ? (currentValue / totalValue) * 100 : 0;

                return (
                  <div key={holding.id} className="p-4 rounded-lg bg-slate-900/50 hover:bg-slate-900 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium text-lg">{holding.stock_symbol}</span>
                        <span className="text-slate-400 text-sm">{holding.stock_name}</span>
                      </div>
                      <Button
                        onClick={() => removeStock(holding.id)}
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
                        <div className="text-white font-medium">{holding.shares_owned ?? 0}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-xs mb-1">Current Price</div>
                        <div className="text-white font-medium">${(holding.current_price ?? 0).toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-xs mb-1">Buy Price</div>
                        <div className="text-white font-medium">${(holding.purchase_price ?? 0).toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-xs mb-1">Current Value</div>
                        <div className="text-white font-medium">${(currentValue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-slate-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div>
                            <div className="text-slate-400 text-xs mb-1">P&L</div>
                            <div className={`font-medium ${(profitLoss ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {(profitLoss ?? 0) >= 0 ? '+' : ''}${(profitLoss ?? 0).toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-400 text-xs mb-1">P&L %</div>
                            <div className={`font-medium ${(profitLossPercent ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {(profitLossPercent ?? 0) >= 0 ? '+' : ''}{(profitLossPercent ?? 0).toFixed(1)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-400 text-xs mb-1">Weight</div>
                            <div className="text-slate-300 text-sm">{(weight ?? 0).toFixed(1)}%</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-slate-400 text-xs mb-1">Purchase Date</div>
                          <div className="text-slate-300 text-sm">{new Date(holding.purchase_date).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {holdings.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <span className="text-4xl mb-2 block">📈</span>
                  <p>No holdings in portfolio yet, add them in the stocks section</p>
                  <p className="text-sm">Go to the Stocks tab to search and add stocks to your portfolio</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Portfolio Summary */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <span className="text-purple-400 text-lg">📊</span>
              Portfolio Summary
            </CardTitle>
            <CardDescription className="text-slate-400">Your portfolio overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-slate-900/50">
                  <div className="text-slate-400 text-sm mb-1">Total Holdings</div>
                  <div className="text-white text-2xl font-bold">{holdings.length}</div>
                  <div className="text-slate-500 text-xs">Different stocks</div>
                </div>
                <div className="p-4 rounded-lg bg-slate-900/50">
                  <div className="text-slate-400 text-sm mb-1">Average P&L</div>
                  <div className={`text-2xl font-bold ${(portfolioSummary?.total_gain_loss ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {(portfolioSummary?.total_gain_loss ?? 0) >= 0 ? '+' : ''}{((parseFloat((portfolioSummary?.total_invested ?? 0).toString()) > 0 ? (parseFloat((portfolioSummary?.total_gain_loss ?? 0).toString()) / parseFloat((portfolioSummary?.total_invested ?? 1).toString())) * 100 : 0)).toFixed(1)}%
                  </div>
                  <div className="text-slate-500 text-xs">Overall performance</div>
                </div>
              </div>
              
              {holdings.length > 0 && (
                <div className="p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-blue-400 text-lg">💡</span>
                    <span className="text-blue-400 font-medium">Quick Tip</span>
                  </div>
                  <p className="text-slate-200 text-sm">
                    {holdings.length === 1 
                      ? "Consider diversifying your portfolio by adding more stocks from different sectors."
                      : `Your portfolio has ${holdings.length} holdings. Keep monitoring performance and consider rebalancing when needed.`
                    }
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Actions */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <span className="text-blue-400 text-lg">⚡</span>
            Portfolio Actions
          </CardTitle>
          <CardDescription className="text-slate-400">Manage your portfolio holdings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 rounded-lg bg-slate-900/50">
              <div className="text-white font-medium mb-1">Add Stocks</div>
              <div className="text-slate-400 text-sm mb-3">Search and add new stocks to your portfolio</div>
              <Button 
                onClick={() => window.location.href = '#stocks'}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <span className="mr-2">📈</span>
                Go to Stocks
              </Button>
            </div>
            
            <div className="p-4 rounded-lg bg-slate-900/50">
              <div className="text-white font-medium mb-1">Refresh Data</div>
              <div className="text-slate-400 text-sm mb-3">Update current prices and portfolio metrics</div>
              <Button 
                onClick={fetchPortfolioData}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <span className="mr-2">🔄</span>
                Refresh
              </Button>
            </div>
            
            <div className="p-4 rounded-lg bg-slate-900/50">
              <div className="text-white font-medium mb-1">Portfolio Health</div>
              <div className="text-slate-400 text-sm mb-3">
                {holdings.length === 0 
                  ? "No holdings to analyze" 
                  : `${holdings.length} holdings, ${metrics.diversificationScore}% diversified`
                }
              </div>
              <div className={`text-lg font-bold ${(portfolioSummary?.total_gain_loss ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {(portfolioSummary?.total_gain_loss ?? 0) >= 0 ? '+' : ''}{((parseFloat((portfolioSummary?.total_invested ?? 0).toString()) > 0 ? (parseFloat((portfolioSummary?.total_gain_loss ?? 0).toString()) / parseFloat((portfolioSummary?.total_invested ?? 1).toString())) * 100 : 0)).toFixed(1)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Tips */}
      <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <span className="text-purple-400 text-lg">💡</span>
            Portfolio Tips
          </CardTitle>
          <CardDescription className="text-slate-400">Helpful insights for managing your investments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {holdings.length === 0 ? (
              <div className="p-4 rounded-lg bg-slate-900/50">
                <h4 className="text-white font-medium mb-2">🚀 Getting Started</h4>
                <p className="text-slate-300 text-sm mb-3">
                  Start building your portfolio by searching for stocks in the Stocks tab. Look for companies you believe in and understand their business model.
                </p>
                <Button 
                  onClick={() => window.location.href = '#stocks'}
                  variant="outline" 
                  size="sm" 
                  className="border-slate-600 text-slate-400"
                >
                  Start Investing
                </Button>
              </div>
            ) : (
              <>
                <div className="p-4 rounded-lg bg-slate-900/50">
                  <h4 className="text-white font-medium mb-2">📊 Diversification</h4>
                  <p className="text-slate-300 text-sm mb-3">
                    {holdings.length < 3 
                      ? "Consider adding more stocks to diversify your portfolio and reduce risk."
                      : `Great! You have ${holdings.length} different stocks. Consider adding stocks from different sectors for better diversification.`
                    }
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-slate-900/50">
                  <h4 className="text-white font-medium mb-2">📈 Performance Tracking</h4>
                  <p className="text-slate-300 text-sm mb-3">
                    Monitor your portfolio regularly and consider rebalancing when individual positions become too large relative to your total portfolio.
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
