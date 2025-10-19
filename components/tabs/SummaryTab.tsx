import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import SummaryCards from './needecAssets/summaryCards';
import TrendingStocksTab from './needecAssets/trendingStocksTab';
import AIInsights from './needecAssets/AIInsights';

export function SummaryTab() {
  return (
    <div className="space-y-6">
      {/* Market Overview */}
      <SummaryCards />

      {/* Trending Stocks and AI Insights */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Trending Stocks */}
        <TrendingStocksTab/>

        {/* AI Market Insights */}
        <AIInsights />
      </div>
    </div>
  );
}
