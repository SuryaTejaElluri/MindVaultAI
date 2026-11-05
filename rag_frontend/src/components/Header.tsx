import React, { useState } from 'react';
import {
  Brain,
  MessageSquare,
  Files,
  LogOut,
  Settings,
  User as UserIcon,
  Shield,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ConfigModal } from './ConfigModal';

interface HeaderProps {
  activeTab: 'chat' | 'documents';
  setActiveTab: (tab: 'chat' | 'documents') => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { isLight, toggleTheme } = useTheme();
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  return (
    <>
      <header
        className={`border-b sticky top-0 z-40 backdrop-blur-md transition-colors duration-200 ${
          isLight
            ? 'bg-gradient-to-r from-[#111638] via-[#1E2452] to-[#111638] border-indigo-400/25 text-white shadow-md'
            : 'bg-gradient-to-r from-[#0C102A] via-[#161B42] to-[#0C102A] border-indigo-500/20 text-white shadow-lg'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3 sm:gap-6 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl border-2 border-indigo-400/30 bg-indigo-500/20 flex items-center justify-center shadow-md text-indigo-400">
                <Brain size={18} />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm sm:text-base tracking-tight text-white flex items-center">
                  MindVault<span className="text-indigo-400 font-extrabold">AI</span>
                </span>
                <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full border border-indigo-500/30 bg-indigo-950/50 text-indigo-300">
                  <Shield size={10} className="text-indigo-400" />
                  Encrypted Vault
                </span>
              </div>
            </div>

            {/* Navigation Tabs (Desktop) */}
            {isAuthenticated && (
              <nav className="hidden sm:flex items-center gap-1 p-1 rounded-xl border border-indigo-500/25 bg-black/20">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'chat'
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <MessageSquare size={13} />
                  <span>Chat</span>
                </button>
                <button
                  onClick={() => setActiveTab('documents')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'documents'
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Files size={13} />
                  <span>Documents</span>
                </button>
              </nav>
            )}
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              title={isLight ? 'Switch to Dark Theme' : 'Switch to White Theme'}
              className="px-2 sm:px-2.5 py-1.5 rounded-xl border border-indigo-500/30 bg-white/5 hover:bg-white/10 text-indigo-200 flex items-center gap-1 text-xs font-medium transition shadow-sm"
            >
              {isLight ? (
                <>
                  <Moon size={14} className="text-amber-300" />
                  <span className="hidden sm:inline">Dark</span>
                </>
              ) : (
                <>
                  <Sun size={14} className="text-amber-400" />
                  <span className="hidden sm:inline">White</span>
                </>
              )}
            </button>

            {/* Settings Button */}
            <button
              onClick={() => setIsConfigOpen(true)}
              title="Settings & Configuration"
              className="p-1.5 sm:p-2 rounded-xl border border-indigo-500/30 bg-white/5 hover:bg-white/10 text-indigo-200 transition"
            >
              <Settings size={15} />
            </button>

            {isAuthenticated && (
              <div className="flex items-center gap-1.5 sm:gap-2.5 pl-1.5 sm:pl-2 border-l border-indigo-500/25">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase shadow-sm border border-indigo-400/40 bg-indigo-500/20 text-indigo-300">
                    {user?.email ? user.email.charAt(0) : <UserIcon size={13} />}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-medium leading-tight text-white max-w-[120px] truncate">
                      {user?.email}
                    </p>
                    <p className="text-[10px] flex items-center gap-1 text-indigo-300/80">
                      <Sparkles size={8} className="text-indigo-400" /> Active Session
                    </p>
                  </div>
                </div>

                <button
                  onClick={logout}
                  title="Sign Out"
                  className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-xl border border-transparent text-slate-300 hover:text-red-300 hover:bg-red-500/10 transition"
                >
                  <LogOut size={14} />
                  <span className="hidden md:inline">Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Tabs Bar */}
        {isAuthenticated && (
          <div className="sm:hidden px-3 py-1.5 border-t border-indigo-500/20 bg-black/30 flex items-center justify-around gap-2">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'chat'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <MessageSquare size={13} />
              <span>Chat</span>
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'documents'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Files size={13} />
              <span>Documents</span>
            </button>
          </div>
        )}
      </header>

      <ConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />
    </>
  );
};
