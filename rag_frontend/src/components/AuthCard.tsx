import React, { useState } from 'react';
import {
  Mail,
  Lock,
  LogIn,
  UserPlus,
  AlertCircle,
  Loader2,
  CheckCircle2,
  KeyRound,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const AuthCard: React.FC = () => {
  const { login, register } = useAuth();
  const { isLight } = useTheme();
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
    <div
      className={`w-full max-w-md mx-auto border rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-xl space-y-4 sm:space-y-6 transition-all ${
        isLight
          ? 'bg-white border-slate-200 shadow-slate-200/50'
          : 'bg-[#1E293B] border-slate-700 shadow-[0_10px_35px_rgba(0,0,0,0.4)]'
      }`}
    >
      {/* Tab Switcher */}
      <div
        className={`flex p-1 rounded-xl sm:rounded-2xl border ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#0F172A] border-slate-700'
        }`}
      >
        <button
          type="button"
          onClick={() => {
            setMode('login');
            setError(null);
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs font-semibold transition ${
            mode === 'login'
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md font-bold'
              : isLight
              ? 'text-slate-600 hover:text-slate-900'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <LogIn size={14} />
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('register');
            setError(null);
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs font-semibold transition ${
            mode === 'register'
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md font-bold'
              : isLight
              ? 'text-slate-600 hover:text-slate-900'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <UserPlus size={14} />
          Register
        </button>
      </div>

      <div className="text-left space-y-1">
        <h2
          className={`text-lg sm:text-xl font-bold tracking-tight flex items-center gap-2 ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}
        >
          {mode === 'login' ? (
            <>
              <KeyRound size={18} className={isLight ? 'text-indigo-600' : 'text-indigo-400'} />
              Welcome Back
            </>
          ) : (
            <>
              <Shield size={18} className={isLight ? 'text-indigo-600' : 'text-indigo-400'} />
              Create Account
            </>
          )}
        </h2>
        <p className={`text-[11px] sm:text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          {mode === 'login'
            ? 'Sign in to access your isolated knowledge vault.'
            : 'Register a new account. Your documents are strictly partitioned.'}
        </p>
      </div>

      {error && (
        <div className="p-2.5 sm:p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs flex items-center gap-2 text-left">
          <AlertCircle size={15} className="shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div
          className={`p-2.5 sm:p-3 rounded-xl text-xs flex items-center gap-2 text-left border ${
            isLight
              ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
              : 'bg-indigo-950/40 border-indigo-500/30 text-indigo-200'
          }`}
        >
          <CheckCircle2 size={15} className="shrink-0 text-indigo-400" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4 text-left">
        <div>
          <label
            className={`block text-xs font-medium mb-1 flex items-center gap-1.5 ${
              isLight ? 'text-slate-700' : 'text-slate-300'
            }`}
          >
            <Mail size={12} className={isLight ? 'text-indigo-600' : 'text-indigo-400'} />
            Email Address
          </label>
          <div className="relative">
            <Mail
              size={15}
              className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                isLight ? 'text-slate-400' : 'text-slate-500'
              }`}
            />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={`w-full rounded-xl pl-9 pr-3 py-2 sm:py-2.5 text-xs sm:text-sm transition focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 border ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                  : 'bg-[#0F172A] border-slate-700 text-slate-100 placeholder:text-slate-600'
              }`}
            />
          </div>
        </div>

        <div>
          <label
            className={`block text-xs font-medium mb-1 flex items-center gap-1.5 ${
              isLight ? 'text-slate-700' : 'text-slate-300'
            }`}
          >
            <Lock size={12} className={isLight ? 'text-indigo-600' : 'text-indigo-400'} />
            Password
          </label>
          <div className="relative">
            <Lock
              size={15}
              className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                isLight ? 'text-slate-400' : 'text-slate-500'
              }`}
            />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full rounded-xl pl-9 pr-3 py-2 sm:py-2.5 text-xs sm:text-sm transition focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 border ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                  : 'bg-[#0F172A] border-slate-700 text-slate-100 placeholder:text-slate-600'
              }`}
            />
          </div>
          {mode === 'register' && (
            <p
              className={`text-[10px] sm:text-[11px] mt-1 flex items-center gap-1 ${
                isLight ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              <Shield size={10} className={isLight ? 'text-indigo-600' : 'text-indigo-400'} /> Minimum 6 characters
            </p>
          )}
        </div>

        {mode === 'register' && (
          <div>
            <label
              className={`block text-xs font-medium mb-1 flex items-center gap-1.5 ${
                isLight ? 'text-slate-700' : 'text-slate-300'
              }`}
            >
              <Lock size={12} className={isLight ? 'text-indigo-600' : 'text-indigo-400'} />
              Confirm Password
            </label>
            <div className="relative">
              <Lock
                size={15}
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                  isLight ? 'text-slate-400' : 'text-slate-500'
                }`}
              />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full rounded-xl pl-9 pr-3 py-2 sm:py-2.5 text-xs sm:text-sm transition focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 border ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                    : 'bg-[#0F172A] border-slate-700 text-slate-100 placeholder:text-slate-600'
                }`}
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white py-2.5 sm:py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition shadow-lg shadow-indigo-500/25 mt-2"
        >
          {isLoading ? (
            <>
              <Loader2 size={15} className="animate-spin text-white" />
              {mode === 'login' ? 'Signing in...' : 'Registering...'}
            </>
          ) : mode === 'login' ? (
            <>
              <LogIn size={15} />
              Sign In
              <ArrowRight size={13} className="ml-1 opacity-75" />
            </>
          ) : (
            <>
              <UserPlus size={15} />
              Create Account
              <ArrowRight size={13} className="ml-1 opacity-75" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
