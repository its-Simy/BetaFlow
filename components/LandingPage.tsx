import { Button } from './ui/button';

interface LandingPageProps {
  onLogin: () => void;
  onSignUp: () => void;
}

export const LandingPage = ({ onLogin, onSignUp }: LandingPageProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="max-w-4xl mx-auto px-4 text-center">
        {/* Hero Section */}
        <div className="mb-16">
          <div className="flex items-center justify-center mb-8">
            <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl">
              <span className="text-white text-6xl">📊</span>
            </div>
          </div>
          <h1 className="text-6xl font-bold text-white mb-6">
            Financial Track
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            AI-Powered Market Intelligence for Smart Investment Decisions
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              onClick={onLogin}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
            >
              Sign In
            </Button>
            <Button 
              onClick={onSignUp}
              variant="outline"
              className="px-8 py-3 border-slate-600 text-slate-300 hover:bg-slate-800 font-semibold rounded-lg"
            >
              Sign Up
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="p-6 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold text-white mb-2">AI Analysis</h3>
            <p className="text-slate-400">
              Get intelligent insights and recommendations powered by advanced AI
            </p>
          </div>
          <div className="p-6 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="text-4xl mb-4">📈</div>
            <h3 className="text-xl font-semibold text-white mb-2">Real-time Data</h3>
            <p className="text-slate-400">
              Access live market data and portfolio tracking in real-time
            </p>
          </div>
          <div className="p-6 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="text-4xl mb-4">💼</div>
            <h3 className="text-xl font-semibold text-white mb-2">Portfolio Management</h3>
            <p className="text-slate-400">
              Track and optimize your investments with advanced analytics
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-slate-500 text-sm">
          <p>© 2024 Financial Track. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};
