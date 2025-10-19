import { useState, useEffect } from 'react';
import Head from 'next/head';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { SummaryTab } from '../components/tabs/SummaryTab';
import { NewsTab } from '../components/tabs/NewsTab';
import { PortfolioTab } from '../components/tabs/PortfolioTab';
import { StocksTab } from '../components/tabs/StocksTab';
import { AIAnalysisTab } from '../components/tabs/AIAnalysisTab';
import LandingPage from '../components/LandingPage';
import LoginPage from '../components/auth/LoginPage';
import SignupPage from '../components/auth/SignupPage';

// Temporary alias to bypass JSX IntrinsicAttributes typing until PortfolioTab is typed to accept props
const PortfolioTabComponent: any = PortfolioTab;

type AuthState = 'landing' | 'login' | 'signup' | 'authenticated';

const Home = () => {
  const [activeTab, setActiveTab] = useState('summary');
  const [authState, setAuthState] = useState<AuthState>('authenticated');
  const [authError, setAuthError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [portfolioRefreshTrigger, setPortfolioRefreshTrigger] = useState<number>(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      fetch('/api/portfolio/summary', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
        .then(res => {
          if (res.ok) setAuthState('authenticated');
          else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        });
    }
  }, []);

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    setAuthError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        setAuthState('authenticated');
        setPortfolioRefreshTrigger(prev => prev + 1);
      } else setAuthError(data.error || 'Login failed');
    } catch {
      setAuthError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (email: string, password: string, firstName: string, lastName: string) => {
    setIsLoading(true);
    setAuthError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, first_name: firstName, last_name: lastName }),
      });
      const data = await res.json();
      if (res.ok) await handleLogin(email, password);
      else setAuthError(data.error || 'Failed to create account');
    } catch {
      setAuthError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setAuthState('landing');
    setAuthError('');
  };

  const handleBackToLanding = () => setAuthState('landing');
  const handleSwitchToLogin = () => setAuthState('login');
  const handleSwitchToSignup = () => setAuthState('signup');

  if (authState === 'landing') return <LandingPage onLogin={handleSwitchToLogin} onSignUp={handleSwitchToSignup} />;
  if (authState === 'login')
    return (
      <LoginPage onLogin={handleLogin} onSwitchToSignup={handleSwitchToSignup} onBackToLanding={handleBackToLanding} error={authError} loading={isLoading} />
    );
  if (authState === 'signup')
    return (
      <SignupPage onSignup={handleSignup} onSwitchToLogin={handleSwitchToLogin} onBackToLanding={handleBackToLanding} error={authError} loading={isLoading} />
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Head>
        <title>BetaFlow - AI-Powered Market Intelligence</title>
        <meta name="description" content="AI-Powered Financial Analysis Dashboard with Portfolio Management" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <span className="text-white text-xl">📊</span>
            </div>
            <div>
              <h1 className="text-white text-xl font-bold">BetaFlow</h1>
              <p className="text-slate-400 text-sm">AI-Powered Market Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-slate-400 text-sm">Market Status</p>
              <p className="text-green-400 text-sm font-medium">● Open</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-slate-300 hover:text-white border border-slate-600 hover:border-slate-500 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6 bg-slate-800/50 border border-slate-700">
            <TabsTrigger value="summary" className="tabsButton text-white hover:text-white data-[state=active]:bg-blue-500/20 data-[state=active]:text-white">
              📈 Summary
            </TabsTrigger>
            <TabsTrigger value="news" className="tabsButton text-white hover:text-white data-[state=active]:bg-green-500/20 data-[state=active]:text-white">
              📰 News
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="tabsButton text-white hover:text-white data-[state=active]:bg-purple-500/20 data-[state=active]:text-white">
              💼 Portfolio
            </TabsTrigger>
            <TabsTrigger value="stocks" className="tabsButton text-white hover:text-white data-[state=active]:bg-orange-500/20 data-[state=active]:text-white">
              📊 Stocks
            </TabsTrigger>
            <TabsTrigger value="ai-analysis" className="tabsButton text-white hover:text-white data-[state=active]:bg-pink-500/20 data-[state=active]:text-white">
              🤖 AI Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <SummaryTab />
          </TabsContent>
          <TabsContent value="portfolio">
            <PortfolioTabComponent refreshTrigger={portfolioRefreshTrigger} />
          </TabsContent>
          {/* <TabsContent value="portfolio">
            <PortfolioTab refreshTrigger={portfolioRefreshTrigger} />
          </TabsContent> */}
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
