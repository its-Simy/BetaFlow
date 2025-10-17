import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';

const mockNews = [
  {
    id: 1,
    title: "Federal Reserve Signals Potential Rate Cuts in 2024",
    summary: "The Federal Reserve hints at potential interest rate reductions as inflation shows signs of cooling, sparking optimism in equity markets.",
    source: "Reuters",
    timestamp: "2 hours ago",
    category: "Monetary Policy",
    sentiment: "positive",
    readTime: "3 min read",
    audioAvailable: true
  },
  {
    id: 2,
    title: "NVIDIA Reports Record Q4 Revenue Driven by AI Chip Demand",
    summary: "NVIDIA's quarterly earnings exceed expectations with data center revenue surging 409% year-over-year, driven by unprecedented AI chip demand.",
    source: "Bloomberg",
    timestamp: "4 hours ago",
    category: "Earnings",
    sentiment: "positive",
    readTime: "4 min read",
    audioAvailable: true
  },
  {
    id: 3,
    title: "Tesla Stock Volatility Continues Amid CEO Statements",
    summary: "Tesla shares experience heightened volatility following Elon Musk's recent statements about autonomous driving timelines and production targets.",
    source: "CNBC",
    timestamp: "6 hours ago",
    category: "Company News",
    sentiment: "neutral",
    readTime: "2 min read",
    audioAvailable: true
  },
  {
    id: 4,
    title: "Energy Sector Faces Headwinds from Geopolitical Tensions",
    summary: "Oil and gas stocks decline as geopolitical tensions in the Middle East create uncertainty about energy supply chains and pricing.",
    source: "Wall Street Journal",
    timestamp: "8 hours ago",
    category: "Energy",
    sentiment: "negative",
    readTime: "5 min read",
    audioAvailable: true
  },
  {
    id: 5,
    title: "Healthcare Stocks Show Undervalued Potential",
    summary: "Analysts suggest healthcare sector may be undervalued based on Q4 earnings reports and upcoming FDA approvals for major drugs.",
    source: "Financial Times",
    timestamp: "10 hours ago",
    category: "Healthcare",
    sentiment: "positive",
    readTime: "4 min read",
    audioAvailable: true
  }
];

export function NewsTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNews, setSelectedNews] = useState<typeof mockNews[0] | null>(null);
  const [viewMode, setViewMode] = useState<'read' | 'audio'>('read');

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'negative': return 'bg-red-500/20 text-red-400 border-red-500/50';
      default: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    }
  };

  const handleNewsClick = (news: typeof mockNews[0]) => {
    setSelectedNews(news);
  };

  return (
    <div className="space-y-6">
      {/* Search and AI Integration */}
      <Card className="bg-gradient-to-br from-green-500/10 to-blue-500/10 border-green-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <span className="text-green-400 text-xl">🔍</span>
            AI-Powered News Search
          </CardTitle>
          <CardDescription className="text-slate-400">
            Search financial news with Gemini AI integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Search for specific stocks, sectors, or market trends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
            />
            <Button className="bg-green-600 hover:bg-green-700">
              <span className="mr-2">🤖</span>
              Search with AI
            </Button>
          </div>
          <p className="text-slate-500 text-sm mt-2">
            💡 Powered by Gemini AI - Analyzing headlines, SEC filings, and analyst reports
          </p>
        </CardContent>
      </Card>

      {/* News List */}
      <div className="grid gap-4">
        {mockNews.map((news) => (
          <Card 
            key={news.id} 
            className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 transition-colors cursor-pointer"
            onClick={() => handleNewsClick(news)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getSentimentColor(news.sentiment)}>
                      {news.sentiment}
                    </Badge>
                    <Badge variant="outline" className="text-slate-400 border-slate-600">
                      {news.category}
                    </Badge>
                    <span className="text-slate-500 text-sm">{news.readTime}</span>
                  </div>
                  <h3 className="text-white font-medium text-lg mb-2">{news.title}</h3>
                  <p className="text-slate-400 text-sm mb-3">{news.summary}</p>
                  <div className="flex items-center gap-4 text-slate-500 text-sm">
                    <span>{news.source}</span>
                    <span>•</span>
                    <span>{news.timestamp}</span>
                    {news.audioAvailable && (
                      <>
                        <span>•</span>
                        <span className="text-blue-400">🎵 Audio Available</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNews(news);
                      setViewMode('read');
                    }}
                    className="text-slate-400 border-slate-600 hover:bg-slate-700"
                  >
                    📖 Read
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNews(news);
                      setViewMode('audio');
                    }}
                    className="text-slate-400 border-slate-600 hover:bg-slate-700"
                  >
                    🎵 Audio
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* News Detail Modal */}
      {selectedNews && (
        <Card className="bg-slate-800/90 border-slate-600 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                {viewMode === 'read' ? '📖' : '🎵'} {selectedNews.title}
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedNews(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </Button>
            </div>
            <CardDescription className="text-slate-400">
              {selectedNews.source} • {selectedNews.timestamp} • {selectedNews.readTime}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {viewMode === 'read' ? (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-slate-900/50">
                  <h4 className="text-white font-medium mb-2">Article Summary</h4>
                  <p className="text-slate-300">{selectedNews.summary}</p>
                </div>
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <h4 className="text-blue-400 font-medium mb-2">AI Analysis</h4>
                  <p className="text-slate-300">
                    This news has a {selectedNews.sentiment} sentiment impact on the market. 
                    Based on historical patterns and current market conditions, this could influence 
                    related stocks in the {selectedNews.category.toLowerCase()} sector.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <span className="mr-2">🤖</span>
                    Get AI Insights
                  </Button>
                  <Button variant="outline" className="border-slate-600 text-slate-400">
                    <span className="mr-2">📊</span>
                    View Related Stocks
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <h4 className="text-purple-400 font-medium mb-2">🎵 Audio Reading</h4>
                  <p className="text-slate-300 mb-4">
                    This article will be read aloud using ElevenLabs AI voice synthesis.
                  </p>
                  <div className="flex items-center gap-4">
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      ▶️ Play Audio
                    </Button>
                    <div className="text-slate-400 text-sm">
                      Duration: ~{selectedNews.readTime}
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-slate-900/50">
                  <h4 className="text-white font-medium mb-2">Audio Controls</h4>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="border-slate-600">
                      ⏸️ Pause
                    </Button>
                    <Button variant="outline" size="sm" className="border-slate-600">
                      ⏹️ Stop
                    </Button>
                    <Button variant="outline" size="sm" className="border-slate-600">
                      🔄 Replay
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
