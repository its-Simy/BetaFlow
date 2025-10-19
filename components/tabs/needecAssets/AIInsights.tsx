import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../ui/card';

interface Insight {
  title: string;
  content: string;
  source: string;
  lastUpdated: string;
}

const AiMarketInsightsTab: React.FC = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const res = await axios.get('/api/insights');
        if (Array.isArray(res.data) && res.data.length > 0) {
          setInsights(res.data);
        } else {
          console.warn('Unexpected insights format:', res.data);
          setInsights([]);
        }
      } catch (err) {
        console.error('Error fetching AI insights:', err);
        setInsights([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, []);

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <span className="text-purple-400 text-lg">🧠</span>
          AI Market Insights
        </CardTitle>
        <CardDescription className="text-slate-400">
          Real-time financial news powered by TheNewsAPI
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-slate-300">Loading insights...</p>
        ) : insights.length > 0 ? (
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20"
              >
                <h4 className="text-white font-semibold">{insight.title}</h4>
                <p className="text-slate-300 mt-1">{insight.content}</p>
                <div className="text-xs text-slate-400 mt-2 flex justify-between">
                  <span>Source: {insight.source}</span>
                  <span>Updated: {new Date(insight.lastUpdated).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-300">No insights available at the moment.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default AiMarketInsightsTab;