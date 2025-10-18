import React from 'react';

interface LandingPageProps {
  onLogin: () => void;
  onSignUp: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onSignUp }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold text-white">
            BetaFlow
          </div>
          <div className="space-x-4">
            <button
              onClick={onLogin}
              className="px-4 py-2 text-white border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
            >
              Login
            </button>
            <button
              onClick={onSignUp}
              className="px-4 py-2 bg-white text-slate-900 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16 pt-16">
          <h1 className="text-6xl font-bold text-white mb-6">
            BetaFlow
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Your comprehensive financial dashboard for portfolio management, 
            real-time market analysis, and AI-powered insights.
          </p>
          <div className="space-x-4">
            <button
              onClick={onSignUp}
              className="px-8 py-4 bg-white text-slate-900 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Get Started
            </button>
            <button
              onClick={onLogin}
              className="px-8 py-4 border border-white/30 text-white rounded-lg text-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-white mb-3">Portfolio Management</h3>
            <p className="text-gray-300">
              Track your investments, monitor performance, and manage your portfolio with real-time data.
            </p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
            <div className="text-4xl mb-4">📈</div>
            <h3 className="text-xl font-semibold text-white mb-3">Market Analysis</h3>
            <p className="text-gray-300">
              Get real-time stock prices, historical charts, and market insights to make informed decisions.
            </p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold text-white mb-3">AI Insights</h3>
            <p className="text-gray-300">
              Leverage artificial intelligence for personalized recommendations and market predictions.
            </p>
          </div>
        </div>

        {/* Additional Features */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
            <div className="text-4xl mb-4">📰</div>
            <h3 className="text-xl font-semibold text-white mb-3">Financial News</h3>
            <p className="text-gray-300">
              Stay updated with the latest financial news and market developments.
            </p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold text-white mb-3">Real-time Updates</h3>
            <p className="text-gray-300">
              Get instant notifications and updates on your portfolio and market movements.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center text-gray-400">
            <p>&copy; 2024 BetaFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
