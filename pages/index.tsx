import { useState } from 'react';
import Head from 'next/head';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { SummaryTab } from '../components/tabs/SummaryTab';
import { NewsTab } from '../components/tabs/NewsTab';
import { PortfolioTab } from '../components/tabs/PortfolioTab';
import { StocksTab } from '../components/tabs/StocksTab';
import { AIAnalysisTab } from '../components/tabs/AIAnalysisTab';

const Home = () => {
  const [activeTab, setActiveTab] = useState('summary');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Head>
        <title>Financial Track - AI-Powered Market Intelligence</title>
        <meta name="description" content="AI-Powered Financial Analysis Dashboard with Gemini Integration" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <span className="text-white text-xl">📊</span>
              </div>
              <div>
                <h1 className="text-white text-xl font-bold">Financial Track</h1>
                <p className="text-slate-400 text-sm">AI-Powered Market Intelligence</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-slate-400 text-sm">Market Status</p>
                <p className="text-green-400 text-sm font-medium">● Open</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6 bg-slate-800/50 border border-slate-700">
            <TabsTrigger value="summary" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
              📈 Summary
            </TabsTrigger>
            <TabsTrigger value="news" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">
              📰 News
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
              💼 Portfolio
            </TabsTrigger>
            <TabsTrigger value="stocks" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
              📊 Stocks
            </TabsTrigger>
            <TabsTrigger value="ai-analysis" className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-400">
              🤖 AI Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <SummaryTab />
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

          <TabsContent value="ai-analysis">
            <AIAnalysisTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Home;
