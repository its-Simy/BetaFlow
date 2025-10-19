import React, { useState } from 'react';

interface SignupPageProps {
  onSignup: (email: string, password: string, firstName: string, lastName: string) => void;
  onSwitchToLogin: () => void;
  onBackToLanding: () => void;
  error?: string;
  loading?: boolean;
}

const SignupPage: React.FC<SignupPageProps> = ({ 
  onSignup, 
  onSwitchToLogin, 
  onBackToLanding, 
  error, 
  loading = false 
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return;
    }
    
    onSignup(email, password, firstName, lastName);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Back to Landing */}
        <button
          onClick={onBackToLanding}
          className="text-white/70 hover:text-white mb-8 flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Home</span>
        </button>

        {/* Signup Form */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
            <p className="text-gray-300">Join BetaFlow and start managing your portfolio</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-white mb-2">
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="John"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-white mb-2">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Create a password"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Confirm your password"
              />
              {password && confirmPassword && password !== confirmPassword && (
                <p className="text-red-400 text-sm mt-1">Passwords do not match</p>
              )}
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (password !== confirmPassword && confirmPassword !== '')}
              className="w-full py-3 bg-white text-slate-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-300">
              Already have an account?{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-white hover:text-purple-300 font-medium"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;