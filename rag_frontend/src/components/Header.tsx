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
            ? 'border-slate-200 bg-white/95 text-slate-800 shadow-sm'
            : 'border-[#413B61] bg-[#03122F]/95 text-[#F3DADF]'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div
                className={`h-9 w-9 rounded-xl border-2 flex items-center justify-center shadow-md transition-colors ${
                  isLight
                    ? 'bg-slate-100 border-slate-300'
                    : 'bg-[#19305C] border-[#413B61]'
                }`}
              >
                <Brain className="text-[#F1916D]" size={18} />
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`font-bold text-base tracking-tight flex items-center gap-1 ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  MindVault<span className="text-[#F1916D]">AI</span>
                </span>
                <span
                  className={`hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full border ${
                    isLight
                      ? 'bg-slate-100 text-slate-600 border-slate-200'
                      : 'bg-[#19305C] text-[#AE7DAC] border-[#413B61]'
                  }`}
                >
                  <Shield size={10} className="text-[#F1916D]" />
                  Encrypted Vault
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            {isAuthenticated && (
              <nav
                className={`hidden sm:flex items-center gap-1.5 p-1 rounded-xl border ${
                  isLight
                    ? 'bg-slate-100 border-slate-200'
                    : 'bg-[#19305C] border-[#413B61]'
                }`}
              >
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'chat'
                      ? 'bg-[#F1916D] text-[#03122F] shadow-sm'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      : 'text-[#AE7DAC] hover:text-[#F3DADF] hover:bg-[#413B61]/40'
                  }`}
                >
                  <MessageSquare size={14} />
                  <span>Chat & Query</span>
                </button>
                <button
                  onClick={() => setActiveTab('documents')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'documents'
                      ? 'bg-[#F1916D] text-[#03122F] shadow-sm'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      : 'text-[#AE7DAC] hover:text-[#F3DADF] hover:bg-[#413B61]/40'
                  }`}
                >
                  <Files size={14} />
                  <span>Documents Vault</span>
                </button>
              </nav>
            )}
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2.5">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              title={isLight ? 'Switch to Dark Theme' : 'Switch to White Theme'}
              className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-medium transition ${
                isLight
                  ? 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 shadow-sm'
                  : 'border-[#413B61] bg-[#19305C] text-[#AE7DAC] hover:text-[#F1916D] hover:border-[#F1916D]'
              }`}
            >
              {isLight ? (
                <>
                  <Moon size={16} className="text-[#19305C]" />
                  <span className="hidden sm:inline text-xs font-medium">Dark</span>
                </>
              ) : (
                <>
                  <Sun size={16} className="text-[#F1916D]" />
                  <span className="hidden sm:inline text-xs font-medium text-[#F3DADF]">White</span>
                </>
              )}
            </button>

            {/* Settings Button */}
            <button
              onClick={() => setIsConfigOpen(true)}
              title="Settings & Configuration"
              className={`p-2 rounded-xl border transition ${
                isLight
                  ? 'border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  : 'border-[#413B61] text-[#AE7DAC] hover:text-[#F1916D] hover:bg-[#19305C]'
              }`}
            >
              <Settings size={17} />
            </button>

            {isAuthenticated && (
              <div
                className={`flex items-center gap-3 pl-2 border-l ${
                  isLight ? 'border-slate-200' : 'border-[#413B61]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase shadow-sm border-2 ${
                      isLight
                        ? 'bg-slate-100 border-slate-300 text-slate-800'
                        : 'bg-[#19305C] border-[#413B61] text-[#F1916D]'
                    }`}
                  >
                    {user?.email ? user.email.charAt(0) : <UserIcon size={14} />}
                  </div>
                  <div className="hidden md:block text-left">
                    <p
                      className={`text-xs font-medium leading-tight ${
                        isLight ? 'text-slate-800' : 'text-[#F3DADF]'
                      }`}
                    >
                      {user?.email}
                    </p>
                    <p
                      className={`text-[10px] flex items-center gap-1 ${
                        isLight ? 'text-slate-400' : 'text-[#AE7DAC]'
                      }`}
                    >
                      <Sparkles size={9} className="text-[#F1916D]" /> Active Session
                    </p>
                  </div>
                </div>

                <button
                  onClick={logout}
                  title="Sign Out"
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl border transition ${
                    isLight
                      ? 'text-slate-600 hover:text-red-600 border-transparent hover:bg-red-50 hover:border-red-200'
                      : 'text-[#AE7DAC] hover:text-[#F1916D] border-transparent hover:bg-red-950/20 hover:border-[#413B61]'
                  }`}
                >
                  <LogOut size={15} />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <ConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />
    </>
  );
};
