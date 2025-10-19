import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { AudioPlayer } from '../AudioPlayer';
import { FinanceToggle } from './FinanceToggle'; // adjust path if needed
import { apiEndpoints } from '../../lib/apiConfig';
type NewsItem = {
  id: number;
  title: string;
  summary: string;
  fullText?:string;
  source: string | { name: string };
  timestamp: string;
  category: string;
  sentiment: string;
  readTime: string;
  audioAvailable: boolean;
  url:string;
};

// Helper function to get source name
const getSourceName = (source: string | { name: string }): string => {
  return typeof source === 'string' ? source : source.name;
};

// Helper function to truncate text intelligently
const truncateText = (text: string, maxLength: number = 120): string => {
  if (!text || text.length <= maxLength) return text;
  
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  // If we can find a space near the end, cut there to avoid mid-word breaks
  if (lastSpace > maxLength - 20) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
};

type SummaryData = {
  mainPoints: string[];
  keyImpacts: string[];
  sentiment: string;
};

export function NewsTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [viewMode, setViewMode] = useState<'read' | 'audio'>('read');
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
const [isAudioPlaying, setIsAudioPlaying] = useState(false);
 const [financeOnly, setFinanceOnly] = useState(true);

// ADD THESE AUDIO HANDLER FUNCTIONS:
  const handlePlayAudio = () => {
    setIsAudioPlaying(true);
    console.log('Playing audio...');
  };

  const handlePauseAudio = () => {
    setIsAudioPlaying(false);
    console.log('Pausing audio...');
  };
const handleSelectNews = async (news: NewsItem) => {
  setSelectedNews(news);

  if (!news.fullText) {
    try {
      const res = await fetch(`/api/full-article?url=${encodeURIComponent(news.url)}`);
      const data = await res.json();
setSelectedNews(prev => prev ? { ...prev, fullText: data.fullText } : prev);    } catch (err) {
      console.error("Failed to fetch full article:", err);
    }
  }
};
  const handleStopAudio = () => {
    setIsAudioPlaying(false);
    console.log('Stopping audio...');
  };

  const handleReplayAudio = () => {
    setIsAudioPlaying(true);
    console.log('Replaying audio...');
  };
  
useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch(apiEndpoints.news());
        const data = await res.json();

        const formatted = data.articles.map((item: any, index: number): NewsItem => ({
          id: index + 1,
          title: item.title,
          summary: item.description,
          source: item.source,
          url: item.url,
          timestamp: new Date(item.publishedAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          category: 'General',
          sentiment: 'neutral',
          readTime: '3 min read',
          audioAvailable: false,
        }));

        setNews(formatted);
      } catch (err) {
        console.error('Failed to fetch news:', err);
      }
    };
    fetchNews();
  }, []);


  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'negative': return 'bg-red-500/20 text-red-400 border-red-500/50';
      default: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    }
  };

  const handleReadClick = async (newsItem: NewsItem) => {
    setSelectedNews(newsItem);
    setViewMode('read');
    setSummary(null);
    setIsLoadingSummary(true);

    try {
      const response = await fetch(apiEndpoints.readNews(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ article: newsItem.summary || newsItem.title })
      });

      const data = await response.json();
      setSummary(data);
    } catch (err) {
      console.error("Failed to fetch summary:", err);
      setSummary({
        mainPoints: ['Key insights from the news article'],
        keyImpacts: ['Market implications to consider'],
        sentiment: 'neutral'
      });
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const handleAudioClick = (newsItem: NewsItem) => {
    setSelectedNews(newsItem);
    setViewMode('audio');
    setSummary(null);
  };

  const closeModal = () => {
    setSelectedNews(null);
    setSummary(null);
    setIsLoadingSummary(false);
  };
const keywords = ['finance', 'stock', 'trade', 'bitcoin', 'crypto', 'market', 'nasdaq', 'dow', 'invest'];
  const visibleNews = financeOnly
    ? news.filter(item =>
        keywords.some(keyword =>
          `${item.title} ${item.summary}`.toLowerCase().includes(keyword)
        )
      )
    : news;
<<<<<<< HEAD
console.log("Toggle state:", financeOnly);
console.log("Visible news count:", visibleNews.length);
=======

>>>>>>> 7b39651ff8b411e351c9fefe575b5f318e5d12f5
  return (
    <div className="space-y-6">
      {/* Search and AI Integration */}
      <Card className="searchNewsCard bg-gradient-to-br from-green-500/10 to-blue-500/10 border-green-500/20">
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
            <Button className="searchButton bg-green-600 hover:bg-green-700">
              <span className="mr-2">🤖</span>
              Search with AI
            </Button>
          </div>
          <p className="text-slate-500 text-sm mt-2">
            💡 Powered by Gemini AI - Analyzing headlines, SEC filings, and analyst reports
          </p>
        </CardContent>
      </Card>
<FinanceToggle checked={financeOnly} onChange={() => setFinanceOnly(!financeOnly)} />
      {/* News List */}
      <div className="grid gap-4">

      
        {news.map((news) => (
  <Card
    key={news.id}
    className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 transition-colors cursor-pointer"
    onClick={() => handleNewsClick(news)}
  >
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2" style={{marginTop:"10px"}}>
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
<div className="flex flex-col gap-2 ml-4" style={{ marginTop: "5%" }}>          <Button
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="bg-slate-800/90 border-slate-600 backdrop-blur-sm max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  {viewMode === 'read' ? '📖' : '🎵'} {selectedNews.title}
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={closeModal}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </Button>
              </div>
              <CardDescription className="text-slate-400">
                {getSourceName(selectedNews.source)} • {selectedNews.timestamp} • {selectedNews.readTime}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {viewMode === 'read' ? (
                <div className="space-y-6">
                  {/* Gemini AI Analysis */}
                  {isLoadingSummary ? (
                    <div className="p-6 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <h4 className="text-blue-400 font-medium mb-4 flex items-center gap-2 text-lg">
                        🤖 AI Analysis in Progress
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                          <p className="text-slate-300 text-sm">Extracting key insights from the article...</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                          <p className="text-slate-300 text-sm">Analyzing market implications...</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                          <p className="text-slate-300 text-sm">Determining sentiment and impact...</p>
                        </div>
                      </div>
                      <div className="mt-4 text-center">
                        <p className="text-slate-400 text-xs">Powered by Gemini AI</p>
                      </div>
                    </div>
                  ) : summary ? (
                    <div className="space-y-6">
                      {/* Main Points - Primary Focus */}
                      <div className="p-6 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                        <h4 className="text-blue-400 font-medium mb-4 flex items-center gap-2 text-lg">
                          🎯 Key Insights
                        </h4>
                        <div className="space-y-3">
                          {summary.mainPoints && summary.mainPoints.map((point: string, index: number) => (
                            <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/50">
                              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                              <p className="text-slate-200 text-sm leading-relaxed">{point}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Key Impacts */}
                      {summary.keyImpacts && summary.keyImpacts.length > 0 && (
                        <div className="p-6 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                          <h4 className="text-green-400 font-medium mb-4 flex items-center gap-2 text-lg">
                            📊 Market Impact
                          </h4>
                          <div className="space-y-3">
                            {summary.keyImpacts.map((impact: string, index: number) => (
                              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/50">
                                <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                                <p className="text-slate-200 text-sm leading-relaxed">{impact}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Sentiment */}
                      <div className="p-6 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                        <h4 className="text-purple-400 font-medium mb-4 flex items-center gap-2 text-lg">
                          📈 Sentiment Analysis
                        </h4>
                        <div className="flex items-center gap-3">
                          <Badge className={
                            summary.sentiment === 'positive' ? 'bg-green-500/20 text-green-400 border-green-500/50 px-4 py-2 text-sm' :
                            summary.sentiment === 'negative' ? 'bg-red-500/20 text-red-400 border-red-500/50 px-4 py-2 text-sm' :
                            'bg-yellow-500/20 text-yellow-400 border-yellow-500/50 px-4 py-2 text-sm'
                          }>
                            {summary.sentiment || 'neutral'}
                          </Badge>
                          <p className="text-slate-400 text-sm">
                            AI-powered sentiment analysis of the article content
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-slate-400 mb-4">
                        <span className="text-4xl mb-4 block">🤖</span>
                        <h3 className="text-lg font-medium text-white mb-2">AI Analysis Not Available</h3>
                        <p className="text-sm">Unable to generate AI insights for this article.</p>
                      </div>
                      <Button 
                        onClick={() => handleReadClick(selectedNews)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <span className="mr-2">🔄</span>
                        Try Again
                      </Button>
                    </div>
                  )}
                  
                  {/* Read Full News Link - Centered at bottom */}
                  <div className="text-center pt-4 border-t border-slate-700">
                    <button
                      onClick={() => {
                        const searchQuery = encodeURIComponent(selectedNews.title);
                        window.open(`https://news.google.com/search?q=${searchQuery}&hl=en-US&gl=US&ceid=US:en`, '_blank');
                      }}
                      className="text-white hover:text-blue-300 transition-colors underline underline-offset-4 decoration-blue-400 hover:decoration-blue-300 text-lg font-medium"
                    >
                      📰 Read Full News Article
                    </button>
                    <p className="text-slate-400 text-sm mt-2">
                      Opens original source in new tab
                    </p>
                  </div>
                </div>
              ) : selectedNews?(
                // Audio view
               <AudioPlayer
    title={selectedNews.title}
    articleText={
      selectedNews.fullText || selectedNews.summary || selectedNews.title
    }
    onPlayAudio={handlePlayAudio}
    onPauseAudio={handlePauseAudio}
    onStopAudio={handleStopAudio}
    onReplayAudio={handleReplayAudio}
    isPlaying={isAudioPlaying}
  />

                
              ):null}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}