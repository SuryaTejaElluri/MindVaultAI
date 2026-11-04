import React, { useState } from 'react';
import { Mail, Lock, LogIn, UserPlus, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthCard: React.FC = () => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (mode === 'register' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'login') {
        await login(cleanEmail, password);
      } else {
        await register(cleanEmail, password);
        setSuccessMessage('Account created successfully!');
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-vault-dark border border-vault-teal/30 rounded-3xl p-7 shadow-2xl shadow-vault-darkest/80 space-y-6">
      {/* Tab Switcher */}
      <div className="flex bg-vault-darkest p-1 rounded-2xl border border-vault-teal/20">
        <button
          type="button"
          onClick={() => {
            setMode('login');
            setError(null);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition ${
            mode === 'login'
              ? 'bg-vault-cyan text-white shadow-md shadow-vault-cyan/30'
              : 'text-vault-blue/60 hover:text-vault-blue'
          }`}
        >
          <LogIn size={15} />
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('register');
            setError(null);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition ${
            mode === 'register'
              ? 'bg-vault-cyan text-white shadow-md shadow-vault-cyan/30'
              : 'text-vault-blue/60 hover:text-vault-blue'
          }`}
        >
          <UserPlus size={15} />
          Create Account
        </button>
      </div>

      <div className="text-left space-y-1">
        <h2 className="text-xl font-bold text-white tracking-tight">
          {mode === 'login' ? 'Welcome Back' : 'Create an Account'}
        </h2>
        <p className="text-xs text-vault-blue/70">
          {mode === 'login'
            ? 'Sign in to access your private knowledge vault.'
            : 'Register a new account. All documents and history stay completely private.'}
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex items-center gap-2.5 text-left">
          <AlertCircle size={16} className="shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-vault-teal/10 border border-vault-teal/30 text-vault-cyan rounded-xl text-xs flex items-center gap-2.5 text-left">
          <CheckCircle2 size={16} className="shrink-0 text-vault-cyan" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <div>
          <label className="block text-xs font-medium text-vault-blue/80 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-vault-teal/60" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-vault-darkest border border-vault-teal/30 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-100 placeholder:text-vault-teal/30 focus:outline-none focus:border-vault-cyan transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-vault-blue/80 mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-vault-teal/60" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-vault-darkest border border-vault-teal/30 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-100 placeholder:text-vault-teal/30 focus:outline-none focus:border-vault-cyan transition"
            />
          </div>
          {mode === 'register' && (
            <p className="text-[11px] text-vault-teal/50 mt-1">Must be at least 6 characters</p>
          )}
        </div>

        {mode === 'register' && (
          <div>
            <label className="block text-xs font-medium text-vault-blue/80 mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-vault-teal/60" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-vault-darkest border border-vault-teal/30 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-100 placeholder:text-vault-teal/30 focus:outline-none focus:border-vault-cyan transition"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-vault-cyan hover:bg-vault-teal disabled:opacity-50 text-white py-3 px-4 rounded-xl text-sm font-semibold transition shadow-lg shadow-vault-cyan/20 mt-2"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {mode === 'login' ? 'Signing in...' : 'Creating account...'}
            </>
          ) : mode === 'login' ? (
            <>
              <LogIn size={16} />
              Sign In
            </>
          ) : (
            <>
              <UserPlus size={16} />
              Create Account
            </>
          )}
        </button>
      </form>
    </div>
  );
};
