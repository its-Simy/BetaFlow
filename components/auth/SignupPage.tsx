import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface SignupPageProps {
  onSignup: (firstName: string, lastName: string, email: string, password: string) => void;
  onSwitchToLogin: () => void;
  onBackToLanding: () => void;
  error: string;
  isLoading: boolean;
}

export const SignupPage = ({ onSignup, onSwitchToLogin, onBackToLanding, error, isLoading }: SignupPageProps) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return;
    }
    onSignup(firstName, lastName, email, password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white">Sign Up</CardTitle>
          <CardDescription className="text-slate-400">
            Create your account to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-slate-300 mb-1">
                  First Name
                </label>
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="First name"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-slate-300 mb-1">
                  Last Name
                </label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Last name"
                />
              </div>
            </div>
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
                placeholder="Create a password"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-1">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Confirm your password"
              />
            </div>
            {password !== confirmPassword && confirmPassword && (
              <div className="text-red-400 text-sm">
                Passwords do not match
              </div>
            )}
            {error && (
              <div className="text-red-400 text-sm text-center">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading || password !== confirmPassword}
            >
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <p className="text-slate-400 text-sm">
              Already have an account?{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                Sign in
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
