import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { apiEndpoints } from '../../lib/apiConfig';

interface AnalysisResult {
  query?: string;
  symbol?: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  recommendation: string;
  keyPoints: string[];
  riskLevel: string;
  confidence: number;
  timestamp: string;
  sources?: Array<{
    title: string;
    url: string;
    publishedAt: string;
    source: string;
  }>;
  cached?: boolean;
}

const sampleAnalyses: AnalysisResult[] = [
  {
    query: 'Should I invest in NVIDIA stock now?',
    sentiment: 'bullish',
    recommendation: 'STRONG BUY',
    keyPoints: [
      'AI chip demand continues to surge globally',
      'Strong Q4 earnings beat expectations by 15%',
      'Data center revenue up 409% year-over-year',
      'Multiple new partnerships with major cloud providers',
      'Strong guidance for Q1 2024'
    ],
    riskLevel: 'Medium',
    confidence: 87,
    timestamp: '2 hours ago'
  },
  {
    query: 'What about Tesla stock volatility?',
    sentiment: 'neutral',
    recommendation: 'HOLD',
    keyPoints: [
      'High volatility due to CEO statements and market reactions',
      'EV market competition increasing from traditional automakers',
      'Strong delivery numbers in Q4 (484,507 vehicles)',
      'Energy storage business showing strong growth',
      'Autonomous driving timeline uncertainty'
    ],
    riskLevel: 'High',
    confidence: 72,
    timestamp: '4 hours ago'
  },
  {
    query: 'Best dividend stocks for 2025?',
    sentiment: 'bullish',
    recommendation: 'BUY',
    keyPoints: [
      'Johnson & Johnson: 3.2% yield, stable healthcare sector',
      'Procter & Gamble: 2.8% yield, defensive consumer goods',
      'Coca-Cola: 3.1% yield, consistent dividend growth',
      'Utilities sector showing strength with infrastructure spending',
      'REITs offering attractive yields in current environment'
    ],
    riskLevel: 'Low',
    confidence: 91,
    timestamp: '6 hours ago'
  }
];

export function AIAnalysisTab() {
  const [query, setQuery] = useState('');
  const [symbol, setSymbol] = useState('');
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
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      setCurrentAnalysis({
        query: data.query,
        sentiment: data.insight.sentiment,
        recommendation: data.insight.recommendation,
        keyPoints: data.insight.keyPoints,
        riskLevel: data.insight.riskLevel,
        confidence: data.insight.confidence,
        timestamp: 'Just now',
        sources: data.sources,
        cached: data.cached
      });
    } catch (error) {
      console.error('Analysis error:', error);
      setError(error instanceof Error ? error.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStockAnalyze = async () => {
    if (!symbol.trim()) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const response = await fetch(apiEndpoints.insights.stock(symbol.toUpperCase()));

      if (!response.ok) {
        throw new Error(`Stock analysis failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      setCurrentAnalysis({
        symbol: data.symbol,
        sentiment: data.insight.sentiment,
        recommendation: data.insight.recommendation,
        keyPoints: data.insight.keyPoints,
        riskLevel: data.insight.riskLevel,
        confidence: data.insight.confidence,
        timestamp: 'Just now',
        sources: data.sources,
        cached: data.cached
      });
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
          <div className="space-y-4">
            {/* Quick Stock Analysis */}
            <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-blue-400 text-lg">📊</span>
                <span className="text-blue-400 font-medium">Quick Stock Analysis</span>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter stock symbol (e.g., AAPL, NVDA, TSLA)"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
                  disabled={isAnalyzing}
                />
                <Button
                  onClick={handleStockAnalyze}
                  disabled={!symbol.trim() || isAnalyzing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">📈</span>
                      Analyze Stock
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Free Text Analysis */}
            <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-purple-400 text-lg">💬</span>
                <span className="text-purple-400 font-medium">Free Text Analysis</span>
              </div>
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
              className="min-h-[150px] bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 resize-none"
            />
            
            <div className="flex items-center justify-between">
              <p className="text-slate-500 text-sm">
                💡 Powered by Gemini AI - Analyzing financial headlines, SEC filings, and analyst reports
              </p>
              <Button
                onClick={handleAnalyze}
                disabled={!query.trim() || isAnalyzing}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <span className="mr-2">🚀</span>
                    Analyze with AI
                  </>
                )}
              </Button>
            </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-400">
              <span className="text-red-400 text-lg">⚠️</span>
              <span className="font-medium">Analysis Error</span>
            </div>
            <p className="text-red-300 mt-2">{error}</p>
            <Button 
              onClick={() => setError(null)}
              className="mt-3 bg-red-600 hover:bg-red-700"
            >
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

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
              Confidence: {currentAnalysis.confidence}% | 
              {currentAnalysis.query && ` Query: "${currentAnalysis.query}"`}
              {currentAnalysis.symbol && ` Stock: ${currentAnalysis.symbol}`}
              | {currentAnalysis.timestamp}
              {currentAnalysis.cached && ' (Cached)'}
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

            {/* Sources */}
            {currentAnalysis.sources && currentAnalysis.sources.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-blue-400 text-lg">📰</span>
                  <span className="text-blue-400 font-medium">News Sources</span>
                </div>
                <div className="space-y-2">
                  {currentAnalysis.sources.map((source, index) => (
                    <div key={index} className="p-3 rounded-lg bg-slate-900/50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-white text-sm font-medium mb-1">{source.title}</h4>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span>{source.source}</span>
                            <span>•</span>
                            <span>{source.publishedAt}</span>
                          </div>
                        </div>
                        <a 
                          href={source.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-xs"
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
          <div className="space-y-4">
            {sampleAnalyses.map((analysis, index) => (
              <div key={index} className="p-4 rounded-lg bg-slate-900/50 hover:bg-slate-900 transition-colors cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-medium">{analysis.query}</h4>
                  <div className="flex gap-2">
                    <Badge className={getSentimentColor(analysis.sentiment)}>
                      {analysis.sentiment}
                    </Badge>
                    <Badge className={getRiskColor(analysis.riskLevel)}>
                      {analysis.riskLevel}
                    </Badge>
                  </div>
                </div>
                <p className="text-slate-400 text-sm mb-2">{analysis.recommendation}</p>
                <div className="flex items-center justify-between">
                  <p className="text-slate-500 text-xs">Confidence: {analysis.confidence}%</p>
                  <p className="text-slate-500 text-xs">{analysis.timestamp}</p>
                </div>
              </div>
            ))}
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
