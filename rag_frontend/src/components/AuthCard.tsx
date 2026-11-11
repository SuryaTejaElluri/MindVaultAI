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

  const cardBg = isLight
    ? 'bg-white border-hairline shadow-ambient'
    : 'bg-dark-raised border-[#38383E] shadow-card';

  const tabBg = isLight ? 'bg-surface-raised border-hairline' : 'bg-dark-surface border-[#38383E]';

  const activeTabCls = isLight
    ? 'bg-white text-ink shadow-pill'
    : 'bg-[#3A3A40] text-dark-ink shadow-pill';

  const inactiveTabCls = isLight
    ? 'text-muted hover:text-ink'
    : 'text-dark-muted hover:text-dark-ink';

  const textMain = isLight ? 'text-ink' : 'text-dark-ink';
  const textMuted = isLight ? 'text-muted' : 'text-dark-muted';
  const labelCls = `block text-[13px] mb-1 flex items-center gap-1.5 ${textMuted}`;

  const inputCls = `w-full rounded-md pl-9 pr-3 py-2.5 text-[14px] transition focus:outline-none border ${
    isLight
      ? 'bg-surface border-hairline text-ink placeholder:text-muted focus:border-[#A1A1A1] focus:ring-1 focus:ring-[#A1A1A1]'
      : 'bg-dark-surface border-[#38383E] text-dark-ink placeholder:text-dark-muted focus:border-[#6B6B70] focus:ring-1 focus:ring-[#6B6B70]'
  }`;

  return (
    <div className={`w-full max-w-md mx-auto border rounded-xl p-5 sm:p-7 space-y-5 transition-all ${cardBg}`}>

      {/* Mode Toggle */}
      <div className={`flex p-1 rounded-md border ${tabBg}`}>
        <button
          type="button"
          onClick={() => { setMode('login'); setError(null); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-[13px] transition ${
            mode === 'login' ? activeTabCls : inactiveTabCls
          }`}
        >
          <LogIn size={13} />
          Sign In
        </button>
        <button
          type="button"
          onClick={() => { setMode('register'); setError(null); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-[13px] transition ${
            mode === 'register' ? activeTabCls : inactiveTabCls
          }`}
        >
          <UserPlus size={13} />
          Register
        </button>
      </div>

      {/* Title */}
      <div className="text-left space-y-1">
        <h2 className={`font-fraunces text-[22px] leading-tight flex items-center gap-2 ${textMain}`}>
          {mode === 'login' ? (
            <><KeyRound size={18} /> Welcome Back</>
          ) : (
            <><Shield size={18} /> Create Account</>
          )}
        </h2>
        <p className={`text-[13px] ${textMuted}`}>
          {mode === 'login'
            ? 'Sign in to access your isolated knowledge vault.'
            : 'Register a new account. Your documents are strictly partitioned.'}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-md text-[13px] flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Success */}
      {successMessage && (
        <div className={`p-3 rounded-md text-[13px] flex items-center gap-2 border ${
          isLight
            ? 'bg-[#EEF3FB] border-[#3563AD]/30 text-[#3563AD]'
            : 'bg-[#1E2A3A] border-[#86A8E6]/30 text-[#86A8E6]'
        }`}>
          <CheckCircle2 size={14} className="shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {/* Email */}
        <div>
          <label className={labelCls}>
            <Mail size={12} /> Email Address
          </label>
          <div className="relative">
            <Mail size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${textMuted}`} />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputCls}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className={labelCls}>
            <Lock size={12} /> Password
          </label>
          <div className="relative">
            <Lock size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${textMuted}`} />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={inputCls}
            />
          </div>
          {mode === 'register' && (
            <p className={`text-[11px] mt-1 flex items-center gap-1 ${textMuted}`}>
              <Shield size={10} /> Minimum 6 characters
            </p>
          )}
        </div>

        {/* Confirm Password */}
        {mode === 'register' && (
          <div>
            <label className={labelCls}>
              <Lock size={12} /> Confirm Password
            </label>
            <div className="relative">
              <Lock size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${textMuted}`} />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={inputCls}
              />
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full flex items-center justify-center gap-2 h-[46px] px-6 rounded-md text-[15px] transition disabled:opacity-50 mt-2 ${
            isLight
              ? 'bg-ink text-white hover:opacity-85'
              : 'bg-dark-ink text-dark-surface hover:opacity-85'
          }`}
        >
          {isLoading ? (
            <><Loader2 size={15} className="animate-spin" />{mode === 'login' ? 'Signing in...' : 'Registering...'}</>
          ) : mode === 'login' ? (
            <><LogIn size={15} /> Sign In <ArrowRight size={13} className="ml-1 opacity-60" /></>
          ) : (
            <><UserPlus size={15} /> Create Account <ArrowRight size={13} className="ml-1 opacity-60" /></>
          )}
        </button>
      </form>
    </div>
  );
};
