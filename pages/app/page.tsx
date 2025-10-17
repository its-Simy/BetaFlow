'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { SummaryDashboard } from '../components/SummaryDashboard';
import { NewsTab } from '../components/NewsTab';
import { PortfolioTab } from '../components/PortfolioTab';
import { StocksTab } from '../components/StocksTab';
import { AnalysisTab } from '../components/AnalysisTab';
import { TrendingUp } from 'lucide-react';

export default function Page() {
  const [activeTab, setActiveTab] = useState('summary');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white">FinancialTrack AI</h1>
              <p className="text-slate-400 text-sm">AI-Powered Market Intelligence Platform</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6 bg-slate-800/50 border border-slate-700">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="news">News</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="stocks">Stocks</TabsTrigger>
            <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <SummaryDashboard />
          </TabsContent>

          <TabsContent value="news">
            <NewsTab />
          </TabsContent>

          <TabsContent value="portfolio">
            <PortfolioTab />
          </TabsContent>

          <TabsContent value="stocks">
            <StocksTab />
          </TabsContent>

          <TabsContent value="analysis">
            <AnalysisTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
