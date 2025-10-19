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

type AuthState = 'landing' | 'login' | 'signup' | 'authenticated';

const Home = () => {
  const [activeTab, setActiveTab] = useState('summary');
  const [authState, setAuthState] = useState<AuthState>('landing');
  const [authError, setAuthError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [portfolioRefreshTrigger, setPortfolioRefreshTrigger] = useState(0);

  // Check for existing authentication on page load
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      // Verify token is still valid by making a test request
      fetch('/api/portfolio/summary', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      .then(response => {
        if (response.ok) {
          setAuthState('authenticated');
        } else {
          // Token is invalid, clear storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setAuthState('landing');
        }
      })
      .catch((error) => {
        // Network error, clear storage
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setAuthState('landing');
      });
    } else {
      // No token or user, start at landing
      setAuthState('landing');
    }
  }, []);

  const handleLogin = async (email: string, password: string) => {
    console.log('Login attempt for:', email);
    setIsLoading(true);
    setAuthError('');
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('Login response:', { status: response.status, data });

      if (response.ok) {
        // Store user data and token in localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        setAuthState('authenticated');
        setAuthError('');
        // Trigger portfolio refresh
        setPortfolioRefreshTrigger(prev => prev + 1);
        console.log('Login successful, auth state set to authenticated');
      } else {
        setAuthError(data.error || 'Login failed');
        console.log('Login failed:', data.error);
      }
    } catch (error) {
      console.error('Login error:', error);
      setAuthError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (email: string, password: string, firstName: string, lastName: string) => {
    console.log('Signup attempt for:', email);
    setIsLoading(true);
    setAuthError('');
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password, 
          first_name: firstName, 
          last_name: lastName 
        }),
      });

      const data = await response.json();
      console.log('Signup response:', { status: response.status, data });

      if (response.ok) {
        // Account created successfully, now log them in
        console.log('Account created, attempting login...');
        await handleLogin(email, password);
      } else {
        setAuthError(data.error || 'Failed to create account');
        console.log('Signup failed:', data.error);
      }
    } catch (error) {
      console.error('Signup error:', error);
      setAuthError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    // Clear stored user data and token
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setAuthState('landing');
    setAuthError('');
  };

  const handleBackToLanding = () => {
    setAuthState('landing');
    setAuthError('');
  };

  const handleSwitchToLogin = () => {
    setAuthState('login');
    setAuthError('');
  };

  const handleSwitchToSignup = () => {
    setAuthState('signup');
    setAuthError('');
  };

  // Debug: Log current auth state
  console.log('Current auth state:', authState);

  // Render different pages based on auth state
  if (authState === 'landing') {
    return <LandingPage onLogin={handleSwitchToLogin} onSignUp={handleSwitchToSignup} />;
  }

  if (authState === 'login') {
    return (
      <LoginPage
        onLogin={handleLogin}
        onSwitchToSignup={handleSwitchToSignup}
        onBackToLanding={handleBackToLanding}
        error={authError}
        loading={isLoading}
      />
    );
  }

  if (authState === 'signup') {
    return (
      <SignupPage
        onSignup={handleSignup}
        onSwitchToLogin={handleSwitchToLogin}
        onBackToLanding={handleBackToLanding}
        error={authError}
        loading={isLoading}
      />
    );
  }

  // Authenticated state - show main dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Head>
        <title>BetaFlow - AI-Powered Market Intelligence</title>
        <meta name="description" content="AI-Powered Financial Analysis Dashboard with Portfolio Management" />
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
        </div>
      </header>

      {/* Main Content */}
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

          <TabsContent value="news">
            <NewsTab />
          </TabsContent>

          <TabsContent value="portfolio">
            <PortfolioTab refreshTrigger={portfolioRefreshTrigger} />
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
