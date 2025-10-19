import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';

export function AIInsights() {
  const [insights, setInsights] = useState<string[]>([]);
  const [recommendation, setRecommendation] = useState('');
  const [source, setSource] = useState('');
  const [fetchedAt, setFetchedAt] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const res = await fetch(`http://localhost:5055/api/ai-insights?ts=${Date.now()}`, {
          cache: 'no-store'
        });
        const data = await res.json();
        setInsights(data.insights || []);
        setRecommendation(data.recommendation || '');
        setSource(data.source || '');
        setFetchedAt(data.fetchedAt || '');
      } catch (err) {
        console.error('Failed to fetch AI insights:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, []);

  const getRecommendationColor = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes('buy')) return 'bg-green-500/20 border-green-500/40 text-green-400';
    if (lower.includes('hold')) return 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400';
    if (lower.includes('sell')) return 'bg-red-500/20 border-red-500/40 text-red-400';
    if (lower.includes('diversify')) return 'bg-purple-500/20 border-purple-500/40 text-purple-300';
    return 'bg-blue-500/10 border-blue-500/20 text-blue-300';
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <span className="text-purple-400 text-lg">🤖</span>
          AI Market Insights
        </CardTitle>
        <CardDescription className="text-slate-400">Real-time sentiment analysis</CardDescription>
      </CardHeader>

      <CardContent>
        {loading ? (
          <p className="text-slate-400 text-sm">Loading insights...</p>
        ) : (
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all"
              >
                <p className="text-slate-200 text-sm">{insight}</p>
              </div>
            ))}

            <div
              className={`mt-4 p-4 rounded-lg border transition-all ${getRecommendationColor(
                recommendation
              )}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">💰</span>
                <span className="font-medium text-sm">Portfolio Recommendation</span>
              </div>
              <p className="text-sm">{recommendation}</p>
            </div>

            <div className="mt-2 text-xs text-slate-500">
              <p>🕒 Last updated: {new Date(fetchedAt).toLocaleTimeString()}</p>
              <p>📡 Source: {source}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}