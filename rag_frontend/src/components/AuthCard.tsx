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
      className={`w-full max-w-md mx-auto border-2 rounded-3xl p-7 shadow-xl space-y-6 transition-all ${
        isLight
          ? 'bg-white border-slate-200 shadow-slate-200/50'
          : 'bg-[#19305C] border-[#413B61] shadow-[0_10px_35px_rgba(3,18,47,0.7)]'
      }`}
    >
      {/* Tab Switcher */}
      <div
        className={`flex p-1.5 rounded-2xl border ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#03122F] border-[#413B61]'
        }`}
      >
        <button
          type="button"
          onClick={() => {
            setMode('login');
            setError(null);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition ${
            mode === 'login'
              ? 'bg-[#F1916D] text-white shadow-md font-bold'
              : isLight
              ? 'text-slate-600 hover:text-slate-900'
              : 'text-[#AE7DAC] hover:text-[#F3DADF]'
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
              ? 'bg-[#F1916D] text-white shadow-md font-bold'
              : isLight
              ? 'text-slate-600 hover:text-slate-900'
              : 'text-[#AE7DAC] hover:text-[#F3DADF]'
          }`}
        >
          <UserPlus size={15} />
          Register
        </button>
      </div>

      <div className="text-left space-y-1">
        <h2
          className={`text-xl font-bold tracking-tight flex items-center gap-2 ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}
        >
          {mode === 'login' ? (
            <>
              <KeyRound size={20} className="text-[#F1916D]" />
              Welcome Back
            </>
          ) : (
            <>
              <Shield size={20} className="text-[#F1916D]" />
              Create Account
            </>
          )}
        </h2>
        <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-[#AE7DAC]'}`}>
          {mode === 'login'
            ? 'Sign in to access your isolated knowledge vault.'
            : 'Register a new account. Your documents are strictly partitioned.'}
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-xs flex items-center gap-2.5 text-left">
          <AlertCircle size={16} className="shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2.5 text-left border ${
            isLight
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-[#413B61]/40 border-[#AE7DAC] text-[#F3DADF]'
          }`}
        >
          <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <div>
          <label
            className={`block text-xs font-medium mb-1.5 flex items-center gap-1.5 ${
              isLight ? 'text-slate-700' : 'text-[#F3DADF]'
            }`}
          >
            <Mail size={13} className="text-[#F1916D]" />
            Email Address
          </label>
          <div className="relative">
            <Mail
              size={16}
              className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${
                isLight ? 'text-slate-400' : 'text-[#AE7DAC]'
              }`}
            />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={`w-full rounded-xl pl-10 pr-3.5 py-2.5 text-sm transition focus:outline-none focus:border-[#F1916D] focus:ring-1 focus:ring-[#F1916D] border ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                  : 'bg-[#03122F] border-[#413B61] text-[#F3DADF] placeholder:text-[#413B61]'
              }`}
            />
          </div>
        </div>

        <div>
          <label
            className={`block text-xs font-medium mb-1.5 flex items-center gap-1.5 ${
              isLight ? 'text-slate-700' : 'text-[#F3DADF]'
            }`}
          >
            <Lock size={13} className="text-[#F1916D]" />
            Password
          </label>
          <div className="relative">
            <Lock
              size={16}
              className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${
                isLight ? 'text-slate-400' : 'text-[#AE7DAC]'
              }`}
            />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full rounded-xl pl-10 pr-3.5 py-2.5 text-sm transition focus:outline-none focus:border-[#F1916D] focus:ring-1 focus:ring-[#F1916D] border ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                  : 'bg-[#03122F] border-[#413B61] text-[#F3DADF] placeholder:text-[#413B61]'
              }`}
            />
          </div>
          {mode === 'register' && (
            <p
              className={`text-[11px] mt-1 flex items-center gap-1 ${
                isLight ? 'text-slate-400' : 'text-[#AE7DAC]'
              }`}
            >
              <Shield size={11} className="text-[#F1916D]" /> Minimum 6 characters
            </p>
          )}
        </div>

        {mode === 'register' && (
          <div>
            <label
              className={`block text-xs font-medium mb-1.5 flex items-center gap-1.5 ${
                isLight ? 'text-slate-700' : 'text-[#F3DADF]'
              }`}
            >
              <Lock size={13} className="text-[#F1916D]" />
              Confirm Password
            </label>
            <div className="relative">
              <Lock
                size={16}
                className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${
                  isLight ? 'text-slate-400' : 'text-[#AE7DAC]'
                }`}
              />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full rounded-xl pl-10 pr-3.5 py-2.5 text-sm transition focus:outline-none focus:border-[#F1916D] focus:ring-1 focus:ring-[#F1916D] border ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                    : 'bg-[#03122F] border-[#413B61] text-[#F3DADF] placeholder:text-[#413B61]'
                }`}
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-[#F1916D] hover:bg-[#F1916D]/90 disabled:opacity-50 text-white py-3 px-4 rounded-xl text-sm font-bold transition shadow-lg shadow-[#F1916D]/20 mt-3"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin text-white" />
              {mode === 'login' ? 'Signing in...' : 'Registering...'}
            </>
          ) : mode === 'login' ? (
            <>
              <LogIn size={16} />
              Sign In
              <ArrowRight size={14} className="ml-1 opacity-75" />
            </>
          ) : (
            <>
              <UserPlus size={16} />
              Create Account
              <ArrowRight size={14} className="ml-1 opacity-75" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
