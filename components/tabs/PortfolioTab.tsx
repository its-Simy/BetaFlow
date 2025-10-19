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


interface RiskAnalysisData {
  beta?: number;
  volatility: number;
  sharpe_ratio?: number;
  max_drawdown: number;
  var_95: number;
  diversification_score: number;
  correlations?: Record<string, Record<string, number>>;
  num_holdings: number;
  total_value: number;
  holdings_breakdown: Array<{
  symbol: string;
    weight: number;
    sector: string;
  }>;
  cached?: boolean;
}

interface PortfolioTabProps {
  refreshTrigger?: number;
}

export function PortfolioTab({ refreshTrigger }: PortfolioTabProps = {}) {
  const [holdings, setHoldings] = useState<StockHolding[]>([]);
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Risk Analysis state
  const [riskAnalysis, setRiskAnalysis] = useState<RiskAnalysisData | null>(null);
  const [riskLoading, setRiskLoading] = useState(false);
  const [riskError, setRiskError] = useState<string | null>(null);
  const [showRiskAnalysis, setShowRiskAnalysis] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Fetch portfolio data on component mount or when refreshTrigger changes
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    
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
      console.log('Portfolio data received:', data);
      console.log('Holdings array:', data.holdings);
      console.log('Holdings length:', data.holdings?.length || 0);
      
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

  // Risk Analysis function
  const analyzeRisk = async () => {
    try {
      console.log('Starting risk analysis...');
      console.log('Current holdings state:', holdings);
      console.log('Holdings length:', holdings?.length || 0);
      
      setRiskLoading(true);
      setRiskError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, user not logged in');
        setRiskError('🔐 Please log in to analyze portfolio risk. Click the "Login" button in the top right corner to access this feature.');
        return;
      }

      if (!holdings || holdings.length === 0) {
        console.log('No holdings found for risk analysis. Holdings:', holdings);
        setRiskError('No holdings found. Add stocks to your portfolio first.');
        return;
      }

      // Prepare holdings data for risk analysis
      const holdingsData = holdings.map(holding => ({
        symbol: holding.stock_symbol,
        shares: holding.shares_owned,
        value: holding.shares_owned * holding.current_price,
        sector: 'Unknown' // We'll need to get this from stock data
      }));

      console.log('Sending risk analysis request with holdings:', holdingsData);

      const response = await fetch('/api/portfolio/risk-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ holdings: holdingsData }),
      });

      console.log('Risk analysis response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Risk analysis error response:', errorData);
        
        if (response.status === 401) {
          setRiskError('🔐 Your session has expired. Please log in again by clicking the "Login" button.');
        } else {
          setRiskError(errorData.message || '❌ Failed to analyze portfolio risk. Please try again.');
        }
        return;
      }

      const riskData = await response.json();
      console.log('Risk analysis success:', riskData);
      setRiskAnalysis(riskData);
      setShowRiskAnalysis(true);
    } catch (err) {
      console.error('Risk analysis error:', err);
      setRiskError(err instanceof Error ? err.message : 'Failed to analyze portfolio risk');
    } finally {
      setRiskLoading(false);
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

    const totalValue = parseFloat(portfolioSummary.total_value.toString());
    const totalGain = parseFloat(portfolioSummary.total_gain_loss.toString());
    const totalInvested = parseFloat(portfolioSummary.total_invested.toString());
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
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
              {holdings.map((holding) => {
                const currentValue = (holding.shares_owned ?? 0) * (holding.current_price ?? 0);
                const purchaseValue = (holding.shares_owned ?? 0) * (holding.purchase_price ?? 0);
                const profitLoss = currentValue - purchaseValue;
                const profitLossPercent = purchaseValue > 0 ? (profitLoss / purchaseValue) * 100 : 0;
                const totalValue = parseFloat((portfolioSummary?.total_value ?? 0).toString());
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

      {/* Risk Analysis Section */}
      <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <span className="text-orange-400 text-lg">⚠️</span>
                Risk Analysis
                {riskAnalysis && (
                  <Badge variant="outline" className="ml-2 border-orange-400/50 text-orange-400">
                    {riskAnalysis.cached ? 'Cached' : 'Live'}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-slate-400">
                Advanced portfolio risk metrics and analysis
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {showRiskAnalysis && riskAnalysis && (
                <Button 
                  onClick={() => setShowRiskAnalysis(false)}
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-400 hover:bg-slate-800"
                >
                  Hide Analysis
                </Button>
              )}
              <Button 
                onClick={analyzeRisk}
                disabled={riskLoading || holdings.length === 0}
                className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
              >
                {riskLoading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <span className="mr-2">📊</span>
                    Analyze Risk
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {riskError && (
            <div className="p-4 rounded-lg bg-red-900/20 border border-red-500/30 mb-4">
              <div className="text-red-400 font-medium mb-1">⚠️ Analysis Error</div>
              <div className="text-red-300 text-sm">{riskError}</div>
            </div>
          )}

          {!isLoggedIn && (
            <div className="text-center py-8 text-slate-400">
              <span className="text-4xl mb-2 block">🔐</span>
              <p className="text-lg font-medium mb-2">Please log in to analyze portfolio risk</p>
              <p className="text-sm">Click the "Login" button in the top right corner to access this feature</p>
            </div>
          )}

          {isLoggedIn && holdings.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <span className="text-4xl mb-2 block">📊</span>
              <p>Add stocks to your portfolio to analyze risk</p>
            </div>
          )}

          {showRiskAnalysis && riskAnalysis && (
            <div className="space-y-6">
              {/* Risk Summary Banner */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-slate-600/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-white font-semibold text-lg">Portfolio Risk Summary</h3>
                    <p className="text-slate-400 text-sm">
                      Analysis of {riskAnalysis.num_holdings} holdings worth ${riskAnalysis.total_value.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{riskAnalysis.diversification_score}/100</div>
                      <div className="text-xs text-slate-400">Diversification</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${
                        riskAnalysis.volatility > 25 ? 'text-red-400' : 
                        riskAnalysis.volatility > 15 ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {riskAnalysis.volatility}%
                      </div>
                      <div className="text-xs text-slate-400">Volatility</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Portfolio Beta */}
                {riskAnalysis.beta !== null && riskAnalysis.beta !== undefined && (
                  <div className="p-4 rounded-lg bg-slate-900/50 hover:bg-slate-900/70 transition-colors border border-slate-700/50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📈</span>
                        <h4 className="text-white font-medium">Portfolio Beta</h4>
                      </div>
                      <span className={`text-lg font-bold px-2 py-1 rounded ${
                        riskAnalysis.beta > 1.2 ? 'bg-red-500/20 text-red-400' : 
                        riskAnalysis.beta > 0.8 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'
                      }`}>
                        {riskAnalysis.beta}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm mb-2">
                      {riskAnalysis.beta > 1.2 ? 'Higher risk than market' : 
                       riskAnalysis.beta > 0.8 ? 'Similar to market risk' : 'Lower risk than market'}
                    </p>
                    <div className="text-xs text-slate-500">
                      Market sensitivity (1.0 = S&P 500)
                    </div>
                  </div>
                )}

                {/* Volatility */}
                <div className="p-4 rounded-lg bg-slate-900/50 hover:bg-slate-900/70 transition-colors border border-slate-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📊</span>
                      <h4 className="text-white font-medium">Volatility</h4>
                    </div>
                    <span className={`text-lg font-bold px-2 py-1 rounded ${
                      riskAnalysis.volatility > 25 ? 'bg-red-500/20 text-red-400' : 
                      riskAnalysis.volatility > 15 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'
                    }`}>
                      {riskAnalysis.volatility}%
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm mb-2">
                    {riskAnalysis.volatility > 25 ? 'High price fluctuation risk' : 
                     riskAnalysis.volatility > 15 ? 'Moderate price fluctuation' : 'Low price fluctuation risk'}
                  </p>
                  <div className="text-xs text-slate-500">
                    Annual price movement standard deviation
                  </div>
                </div>

                {/* Sharpe Ratio */}
                {riskAnalysis.sharpe_ratio !== null && riskAnalysis.sharpe_ratio !== undefined && (
                  <div className="p-4 rounded-lg bg-slate-900/50 hover:bg-slate-900/70 transition-colors border border-slate-700/50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">⚖️</span>
                        <h4 className="text-white font-medium">Sharpe Ratio</h4>
                      </div>
                      <span className={`text-lg font-bold px-2 py-1 rounded ${
                        riskAnalysis.sharpe_ratio > 1.5 ? 'bg-green-500/20 text-green-400' : 
                        riskAnalysis.sharpe_ratio > 1.0 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {riskAnalysis.sharpe_ratio}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm mb-2">
                      {riskAnalysis.sharpe_ratio > 1.5 ? 'Excellent risk-adjusted returns' : 
                       riskAnalysis.sharpe_ratio > 1.0 ? 'Good risk-adjusted returns' : 'Poor risk-adjusted returns'}
                    </p>
                    <div className="text-xs text-slate-500">
                      Return per unit of risk taken
                    </div>
                  </div>
                )}

                {/* Max Drawdown */}
                <div className="p-4 rounded-lg bg-slate-900/50 hover:bg-slate-900/70 transition-colors border border-slate-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📉</span>
                      <h4 className="text-white font-medium">Max Drawdown</h4>
                    </div>
                    <span className={`text-lg font-bold px-2 py-1 rounded ${
                      riskAnalysis.max_drawdown > 20 ? 'bg-red-500/20 text-red-400' : 
                      riskAnalysis.max_drawdown > 10 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'
                    }`}>
                      {riskAnalysis.max_drawdown}%
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm mb-2">
                    {riskAnalysis.max_drawdown > 20 ? 'High maximum loss risk' : 
                     riskAnalysis.max_drawdown > 10 ? 'Moderate maximum loss risk' : 'Low maximum loss risk'}
                  </p>
                  <div className="text-xs text-slate-500">
                    Largest peak-to-trough decline
                  </div>
                </div>

                {/* Value at Risk */}
                <div className="p-4 rounded-lg bg-slate-900/50 hover:bg-slate-900/70 transition-colors border border-slate-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⚠️</span>
                      <h4 className="text-white font-medium">VaR (95%)</h4>
                    </div>
                    <span className="text-lg font-bold px-2 py-1 rounded bg-red-500/20 text-red-400">
                      {riskAnalysis.var_95}%
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm mb-2">
                    Maximum expected daily loss
                  </p>
                  <div className="text-xs text-slate-500">
                    95% confidence level
                  </div>
                </div>

                {/* Diversification Score */}
                <div className="p-4 rounded-lg bg-slate-900/50 hover:bg-slate-900/70 transition-colors border border-slate-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🎯</span>
                      <h4 className="text-white font-medium">Diversification</h4>
                    </div>
                    <span className={`text-lg font-bold px-2 py-1 rounded ${
                      riskAnalysis.diversification_score > 70 ? 'bg-green-500/20 text-green-400' : 
                      riskAnalysis.diversification_score > 40 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {riskAnalysis.diversification_score}/100
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm mb-2">
                    {riskAnalysis.diversification_score > 70 ? 'Well diversified portfolio' : 
                     riskAnalysis.diversification_score > 40 ? 'Moderately diversified' : 'Poor diversification'}
                  </p>
                  <div className="text-xs text-slate-500">
                    Portfolio spread and concentration
                  </div>
                </div>
              </div>

              {/* Holdings Breakdown */}
              <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700/50">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">📊</span>
                  <h4 className="text-white font-medium">Portfolio Composition</h4>
                </div>
                <div className="space-y-3">
                  {riskAnalysis.holdings_breakdown.map((holding, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800/70 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                        <div>
                          <div className="text-white font-medium">{holding.symbol}</div>
                          <div className="text-slate-400 text-sm">{holding.sector}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-semibold">{holding.weight}%</div>
                        <div className="text-slate-400 text-xs">Weight</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Recommendations */}
              <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">💡</span>
                  <h4 className="text-white font-medium">Risk Recommendations</h4>
                </div>
                <div className="space-y-3">
                  {riskAnalysis.diversification_score < 50 && (
                    <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                      <div className="text-yellow-400 font-medium text-sm mb-1">⚠️ Diversification</div>
                      <div className="text-yellow-200 text-sm">Consider adding stocks from different sectors to reduce concentration risk.</div>
                    </div>
                  )}
                  
                  {riskAnalysis.volatility > 25 && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                      <div className="text-red-400 font-medium text-sm mb-1">📈 High Volatility</div>
                      <div className="text-red-200 text-sm">Your portfolio has high volatility. Consider adding more stable, dividend-paying stocks.</div>
                    </div>
                  )}
                  
                  {riskAnalysis.sharpe_ratio && riskAnalysis.sharpe_ratio < 1.0 && (
                    <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                      <div className="text-orange-400 font-medium text-sm mb-1">⚖️ Risk-Adjusted Returns</div>
                      <div className="text-orange-200 text-sm">Consider rebalancing to improve your risk-adjusted returns.</div>
                    </div>
                  )}
                  
                  {riskAnalysis.max_drawdown > 20 && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                      <div className="text-red-400 font-medium text-sm mb-1">📉 High Drawdown Risk</div>
                      <div className="text-red-200 text-sm">Your portfolio has experienced significant losses. Consider adding defensive stocks.</div>
                    </div>
                  )}
                  
                  {riskAnalysis.diversification_score > 70 && riskAnalysis.volatility < 15 && (
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                      <div className="text-green-400 font-medium text-sm mb-1">✅ Well Balanced</div>
                      <div className="text-green-200 text-sm">Your portfolio shows good diversification and moderate risk levels.</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Analysis Info */}
              <div className="text-center text-slate-500 text-sm space-y-1">
                {riskAnalysis.cached ? (
                  <div>📋 Results cached (24h) • Click "Analyze Risk" to refresh</div>
                ) : (
                  <div>🔄 Live analysis • Results valid for 24 hours</div>
                )}
                <div>Analysis based on 1 year of historical data from Finnhub</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
