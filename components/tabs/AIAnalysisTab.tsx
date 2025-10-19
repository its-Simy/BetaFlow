import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { apiEndpoints } from '../../lib/apiConfig';

interface AnalysisResult {
  query: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  recommendation: string;
  keyPoints: string[];
  riskLevel: string;
  confidence: number;
  timestamp: string;
  reasoning?: string;
  recentNews?: Array<{
    title: string;
    source: string;
    publishedAt: string;
    url: string;
  }>;
}

export function AIAnalysisTab() {
  const [query, setQuery] = useState('');
  const [tickerSymbol, setTickerSymbol] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!query.trim()) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const response = await fetch(apiEndpoints.insights.analyze(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.analysis) {
        setCurrentAnalysis({
          query: data.query,
          sentiment: data.analysis.insight.sentiment,
          recommendation: data.analysis.insight.recommendation,
          keyPoints: data.analysis.insight.keyPoints,
          riskLevel: data.analysis.insight.riskLevel,
          confidence: data.analysis.insight.confidence,
          timestamp: 'Just now',
          reasoning: data.analysis.reasoning,
          recentNews: data.recentNews || []
        });
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setError(error instanceof Error ? error.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTickerAnalysis = async () => {
    if (!tickerSymbol.trim()) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const response = await fetch(apiEndpoints.insights.stock(tickerSymbol.trim().toUpperCase()));
      
      if (!response.ok) {
        throw new Error(`Stock analysis failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.analysis) {
        setCurrentAnalysis({
          query: `${tickerSymbol.toUpperCase()} stock analysis`,
          sentiment: data.analysis.insight.sentiment,
          recommendation: data.analysis.insight.recommendation,
          keyPoints: data.analysis.insight.keyPoints,
          riskLevel: data.analysis.insight.riskLevel,
          confidence: data.analysis.insight.confidence,
          timestamp: 'Just now',
          reasoning: data.analysis.reasoning,
          recentNews: data.recentNews || []
        });
      } else {
        throw new Error(data.error || 'Stock analysis failed');
      }
    } catch (error) {
      console.error('Stock analysis error:', error);
      setError(error instanceof Error ? error.message : 'Stock analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };


  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'bearish': return 'bg-red-500/20 text-red-400 border-red-500/50';
      default: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-green-500/20 text-green-400';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'High': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Query Input */}
      <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <span className="text-purple-400 text-xl">🤖</span>
            Gemini AI Financial Analyst
          </CardTitle>
          <CardDescription className="text-slate-400">
            Ask anything about stocks, market trends, or investment strategies. Powered by Gemini AI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Ticker Symbol Input */}
            <div className="space-y-2">
              <label className="text-slate-300 text-sm font-medium">Quick Stock Analysis</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter ticker symbol (e.g., AAPL, TSLA, NVDA)"
                  value={tickerSymbol}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTickerSymbol(e.target.value.toUpperCase())}
                  className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleTickerAnalysis();
                    }
                  }}
                />
                <Button
                  onClick={handleTickerAnalysis}
                  disabled={!tickerSymbol.trim() || isAnalyzing}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">📊</span>
                      Analyze Stock
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {/* Free Text Analysis */}
            <div className="space-y-2">
              <label className="text-slate-300 text-sm font-medium">General Market Analysis</label>
              <div className="flex gap-2">
                <Textarea
                  placeholder="Ask me anything about the financial markets...

Examples:
• Should I invest in Apple stock right now?
• What are the best dividend stocks in 2025?
• Analyze Tesla's recent earnings report
• Compare NVIDIA vs AMD for long-term investment
• What's driving the recent market rally?
• How will Fed rate changes affect tech stocks?
• Best defensive stocks for market downturn?"
                  value={query}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setQuery(e.target.value)}
                  className="min-h-[120px] bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 resize-none flex-1"
                />
                <Button
                  onClick={handleAnalyze}
                  disabled={!query.trim() || isAnalyzing}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 self-start"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">🚀</span>
                      Analyze Query
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-center">
              <p className="text-slate-500 text-sm">
                💡 Powered by Gemini AI - Analyzing financial headlines, SEC filings, and analyst reports
              </p>
            </div>
            
            
            {/* Error Display */}
            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 text-sm">❌ {error}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {currentAnalysis && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <span className="text-blue-400 text-xl">📈</span>
                AI Analysis Results
              </CardTitle>
              <div className="flex gap-2">
                <Badge className={getSentimentColor(currentAnalysis.sentiment)}>
                  {currentAnalysis.sentiment.toUpperCase()}
                </Badge>
                <Badge className={getRiskColor(currentAnalysis.riskLevel)}>
                  {currentAnalysis.riskLevel} Risk
                </Badge>
              </div>
            </div>
            <CardDescription className="text-slate-400">
              Confidence: {currentAnalysis.confidence}% | Query: "{currentAnalysis.query}" | {currentAnalysis.timestamp}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Recommendation */}
            <div className="p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-blue-400 text-lg">🎯</span>
                <span className="text-blue-400 font-medium">AI Recommendation</span>
              </div>
              <p className="text-white text-lg font-semibold">{currentAnalysis.recommendation}</p>
              <p className="text-slate-300 text-sm mt-1">
                Based on comprehensive analysis of market data, earnings reports, and sentiment analysis.
              </p>
            </div>

            {/* Key Points */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-green-400 text-lg">🔑</span>
                <span className="text-green-400 font-medium">Key Analysis Points</span>
              </div>
              <div className="grid gap-3">
                {currentAnalysis.keyPoints.map((point, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/50">
                    <span className="text-green-400 mt-0.5">•</span>
                    <span className="text-slate-200">{point}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Insights */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-lg bg-slate-900/50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-yellow-400 text-lg">⚠️</span>
                  <span className="text-yellow-400 font-medium">Risk Assessment</span>
                </div>
                <p className="text-slate-200">{currentAnalysis.riskLevel} risk level based on volatility analysis and market conditions</p>
              </div>
              
              <div className="p-4 rounded-lg bg-slate-900/50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-purple-400 text-lg">🎯</span>
                  <span className="text-purple-400 font-medium">Confidence Score</span>
                </div>
                <p className="text-slate-200">{currentAnalysis.confidence}% confidence based on data quality and market signal strength</p>
              </div>
            </div>

            {/* Reasoning */}
            {currentAnalysis.reasoning && (
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-blue-400 text-lg">🧠</span>
                  <span className="text-blue-400 font-medium">AI Reasoning</span>
                </div>
                <p className="text-slate-200">{currentAnalysis.reasoning}</p>
              </div>
            )}

            {/* Recent News Sources */}
            {currentAnalysis.recentNews && currentAnalysis.recentNews.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-orange-400 text-lg">📰</span>
                  <span className="text-orange-400 font-medium">Recent News Sources</span>
                </div>
                <div className="space-y-2">
                  {currentAnalysis.recentNews.map((news, index) => (
                    <div key={index} className="p-3 rounded-lg bg-slate-900/50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-white text-sm font-medium mb-1">{news.title}</h4>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span>{news.source}</span>
                            <span>•</span>
                            <span>{new Date(news.publishedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <a 
                          href={news.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-xs ml-2"
                        >
                          Read →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <span className="mr-2">📊</span>
                View Related Stocks
              </Button>
              <Button variant="outline" className="border-slate-600 text-slate-400">
                <span className="mr-2">💼</span>
                Add to Watchlist
              </Button>
              <Button variant="outline" className="border-slate-600 text-slate-400">
                <span className="mr-2">🔄</span>
                Refresh Analysis
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Analyses */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <span className="text-orange-400 text-xl">📋</span>
            Recent AI Analyses
          </CardTitle>
          <CardDescription className="text-slate-400">Previous Gemini AI analysis results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-slate-400 mb-4">No recent analyses yet</p>
            <p className="text-slate-500 text-sm">Start by asking a question or using quick analysis buttons above</p>
          </div>
        </CardContent>
      </Card>

      {/* AI Capabilities */}
      <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <span className="text-blue-400 text-xl">🧠</span>
            Gemini AI Capabilities
          </CardTitle>
          <CardDescription className="text-slate-400">What our AI can analyze for you</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-green-400">📰</span>
                <span className="text-slate-300 text-sm">Financial headlines analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">📄</span>
                <span className="text-slate-300 text-sm">SEC filings interpretation</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">📊</span>
                <span className="text-slate-300 text-sm">Earnings report analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">🎯</span>
                <span className="text-slate-300 text-sm">Analyst report synthesis</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-green-400">📈</span>
                <span className="text-slate-300 text-sm">Market sentiment analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">⚖️</span>
                <span className="text-slate-300 text-sm">Risk assessment</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">🔮</span>
                <span className="text-slate-300 text-sm">Trend prediction</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">💡</span>
                <span className="text-slate-300 text-sm">Investment recommendations</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}