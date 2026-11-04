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
    <div className="w-full max-w-md mx-auto bg-black border-2 border-[#274D60] rounded-3xl p-7 shadow-[0_0_40px_rgba(39,77,96,0.25)] space-y-6">
      {/* Tab Switcher */}
      <div className="flex bg-[#05080b] p-1.5 rounded-2xl border border-[#274D60]/60">
        <button
          type="button"
          onClick={() => {
            setMode('login');
            setError(null);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition ${
            mode === 'login'
              ? 'bg-[#274D60] text-white shadow-[0_2px_10px_rgba(39,77,96,0.5)] border border-[#366882]'
              : 'text-[#8daec0]/60 hover:text-[#8daec0]'
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
              ? 'bg-[#274D60] text-white shadow-[0_2px_10px_rgba(39,77,96,0.5)] border border-[#366882]'
              : 'text-[#8daec0]/60 hover:text-[#8daec0]'
          }`}
        >
          <UserPlus size={15} />
          Register
        </button>
      </div>

      <div className="text-left space-y-1">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          {mode === 'login' ? (
            <>
              <KeyRound size={20} className="text-[#8daec0]" />
              Welcome Back
            </>
          ) : (
            <>
              <Shield size={20} className="text-[#8daec0]" />
              Create Account
            </>
          )}
        </h2>
        <p className="text-xs text-[#8daec0]/70">
          {mode === 'login'
            ? 'Sign in to access your private documents and chat history.'
            : 'Register your account. All data remains strictly isolated in your vault.'}
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-950/40 border border-red-500/40 text-red-300 rounded-xl text-xs flex items-center gap-2.5 text-left">
          <AlertCircle size={16} className="shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-[#274D60]/20 border border-[#274D60] text-[#8daec0] rounded-xl text-xs flex items-center gap-2.5 text-left">
          <CheckCircle2 size={16} className="shrink-0 text-[#8daec0]" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <div>
          <label className="block text-xs font-medium text-[#8daec0] mb-1.5 flex items-center gap-1.5">
            <Mail size={13} className="text-[#274D60]" />
            Email Address
          </label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#274D60]" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-black border border-[#274D60] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-[#274D60]/60 focus:outline-none focus:border-[#366882] focus:ring-1 focus:ring-[#366882] transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#8daec0] mb-1.5 flex items-center gap-1.5">
            <Lock size={13} className="text-[#274D60]" />
            Password
          </label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#274D60]" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-black border border-[#274D60] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-[#274D60]/60 focus:outline-none focus:border-[#366882] focus:ring-1 focus:ring-[#366882] transition"
            />
          </div>
          {mode === 'register' && (
            <p className="text-[11px] text-[#8daec0]/60 mt-1 flex items-center gap-1">
              <Shield size={11} className="text-[#274D60]" /> Minimum 6 characters
            </p>
          )}
        </div>

        {mode === 'register' && (
          <div>
            <label className="block text-xs font-medium text-[#8daec0] mb-1.5 flex items-center gap-1.5">
              <Lock size={13} className="text-[#274D60]" />
              Confirm Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#274D60]" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-black border border-[#274D60] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-[#274D60]/60 focus:outline-none focus:border-[#366882] focus:ring-1 focus:ring-[#366882] transition"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-[#274D60] hover:bg-[#366882] disabled:opacity-50 text-white py-3 px-4 rounded-xl text-sm font-semibold transition border border-[#366882] shadow-[0_4px_16px_rgba(39,77,96,0.35)] mt-3"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin text-[#8daec0]" />
              {mode === 'login' ? 'Signing in...' : 'Registering...'}
            </>
          ) : mode === 'login' ? (
            <>
              <LogIn size={16} />
              Sign In
              <ArrowRight size={14} className="ml-1 opacity-70" />
            </>
          ) : (
            <>
              <UserPlus size={16} />
              Create Account
              <ArrowRight size={14} className="ml-1 opacity-70" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
