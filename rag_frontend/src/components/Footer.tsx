import React from 'react';
import { Brain, Shield, Sparkles, Terminal, Heart, Lock, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface FooterProps {
  setActiveTab?: (tab: 'chat' | 'documents') => void;
  onOpenSettings?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab, onOpenSettings }) => {
  const { isLight } = useTheme();

  return (
    <footer
      className={`border-t transition-colors duration-200 mt-auto ${
        isLight
          ? 'bg-gradient-to-r from-[#111638] via-[#1E2452] to-[#111638] text-slate-200 border-indigo-400/25'
          : 'bg-gradient-to-r from-[#0C102A] via-[#161B42] to-[#0C102A] text-slate-300 border-indigo-500/20'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 text-center md:text-left">
          {/* Left Brand & Status */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shadow-sm">
                <Brain size={15} />
              </div>
              <span className="font-bold text-xs sm:text-sm tracking-tight text-white">
                MindVault<span className="text-indigo-400">AI</span>
              </span>
            </div>

            <div className="h-4 w-px bg-slate-700 hidden sm:block" />

            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-indigo-300/90 bg-indigo-950/60 border border-indigo-500/20 px-2.5 py-0.5 sm:py-1 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              <span>Isolated Vault Engine Active</span>
            </div>
          </div>

          {/* Middle Security Badges */}
          <div className="flex items-center justify-center gap-3 text-[11px] sm:text-xs text-slate-300">
            <span className="flex items-center gap-1">
              <Lock size={11} className="text-indigo-400" />
              <span>Multi-Tenant</span>
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 size={11} className="text-indigo-400" />
              <span>Grounded Citations</span>
            </span>
          </div>

          {/* Right Links & Year */}
          <div className="flex items-center justify-center gap-3 text-[11px] sm:text-xs text-slate-400">
            {setActiveTab && (
              <button
                onClick={() => setActiveTab('chat')}
                className="hover:text-indigo-300 transition"
              >
                Chat
              </button>
            )}
            {setActiveTab && (
              <button
                onClick={() => setActiveTab('documents')}
                className="hover:text-indigo-300 transition"
              >
                Documents
              </button>
            )}
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="hover:text-indigo-300 transition"
              >
                Settings
              </button>
            )}
            <span>© {new Date().getFullYear()} MindVaultAI</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
