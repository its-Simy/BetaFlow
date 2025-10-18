import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface LoginPageProps {
  onLogin: (email: string, password: string) => void;
  onSwitchToSignup: () => void;
  onBackToLanding: () => void;
  error: string;
  isLoading: boolean;
}

export const LoginPage = ({ onLogin, onSwitchToSignup, onBackToLanding, error, isLoading }: LoginPageProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white">Sign In</CardTitle>
          <CardDescription className="text-slate-400">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Enter your password"
              />
            </div>
            {error && (
              <div className="text-red-400 text-sm text-center">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <p className="text-slate-400 text-sm">
              Don't have an account?{' '}
              <button
                onClick={onSwitchToSignup}
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                Sign up
              </button>
            </p>
            <button
              onClick={onBackToLanding}
              className="text-slate-500 hover:text-slate-400 text-sm mt-2"
            >
              ← Back to home
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
