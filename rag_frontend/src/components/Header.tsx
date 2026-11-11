import React, { useState } from 'react';
import {
  MessageSquare,
  Files,
  LogOut,
  Settings,
  User as UserIcon,
  Sun,
  Moon,
  Brain,
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

  const navCapsule = isLight
    ? 'bg-[#DCDCE099] border border-hairline backdrop-blur-[24px] saturate-150'
    : 'bg-[#2B2B30CC] border border-[#38383E] backdrop-blur-[24px] saturate-150';

  const headerBg = isLight
    ? 'bg-surface/90 backdrop-blur-md border-hairline'
    : 'bg-dark-surface/90 backdrop-blur-md border-[#38383E]';

  const textMain = isLight ? 'text-ink' : 'text-dark-ink';
  const textMuted = isLight ? 'text-muted' : 'text-dark-muted';

  const activeTab_ = isLight
    ? 'bg-white text-ink shadow-pill'
    : 'bg-[#3A3A40] text-dark-ink shadow-pill';

  const inactiveTab = isLight
    ? 'text-muted hover:text-ink hover:bg-white/50'
    : 'text-dark-muted hover:text-dark-ink hover:bg-white/10';

  const iconBtn = isLight
    ? 'text-ink hover:bg-[#18181B0D] border border-hairline rounded-md h-[42px] w-[42px] flex items-center justify-center transition'
    : 'text-dark-ink hover:bg-white/10 border border-[#38383E] rounded-md h-[42px] w-[42px] flex items-center justify-center transition';

  return (
    <>
      <header className={`sticky top-0 z-40 border-b transition-colors duration-200 ${headerBg}`}>
        <div className="max-w-[1080px] mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">

          {/* Wordmark */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex items-center gap-2 shrink-0">
              <Brain size={18} className={isLight ? 'text-ink' : 'text-dark-ink'} />
              <span className="font-space-grotesk font-medium text-sm tracking-tight">
                <span className={textMain}>MindVault</span>
                <span className={textMuted}>AI</span>
              </span>
            </div>

            {/* Desktop Nav Tabs */}
            {isAuthenticated && (
              <nav className={`hidden sm:flex items-center gap-1 p-2 rounded-xl ${navCapsule}`}>
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-md text-[13px] transition font-hanken ${
                    activeTab === 'chat' ? activeTab_ : inactiveTab
                  }`}
                >
                  <MessageSquare size={13} />
                  Chat
                </button>
                <button
                  onClick={() => setActiveTab('documents')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-md text-[13px] transition font-hanken ${
                    activeTab === 'documents' ? activeTab_ : inactiveTab
                  }`}
                >
                  <Files size={13} />
                  Documents
                </button>
              </nav>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={isLight ? 'Switch to Dark' : 'Switch to Light'}
              className={iconBtn}
            >
              {isLight ? <Moon size={15} /> : <Sun size={15} />}
            </button>

            {/* Settings */}
            <button
              onClick={() => setIsConfigOpen(true)}
              title="Settings"
              className={iconBtn}
            >
              <Settings size={15} />
            </button>

            {isAuthenticated && (
              <div className={`flex items-center gap-2 pl-2 border-l ${isLight ? 'border-hairline' : 'border-[#38383E]'}`}>
                {/* Avatar */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs uppercase border ${isLight ? 'bg-surface-raised border-hairline text-ink' : 'bg-dark-raised border-[#38383E] text-dark-ink'}`}>
                  {user?.email ? user.email.charAt(0) : <UserIcon size={12} />}
                </div>
                <span className={`hidden lg:block text-[13px] max-w-[110px] truncate ${textMuted}`}>
                  {user?.email}
                </span>
                <button
                  onClick={logout}
                  title="Sign Out"
                  className={`flex items-center gap-1 text-[13px] px-2 py-1.5 rounded-md transition ${isLight ? 'text-muted hover:text-red-600 hover:bg-red-50' : 'text-dark-muted hover:text-red-400 hover:bg-red-900/20'}`}
                >
                  <LogOut size={14} />
                  <span className="hidden md:inline">Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile bottom tab bar */}
        {isAuthenticated && (
          <div className={`sm:hidden px-4 py-2 border-t flex gap-2 ${isLight ? 'border-hairline bg-surface/95' : 'border-[#38383E] bg-dark-surface/95'}`}>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-[13px] transition ${
                activeTab === 'chat' ? activeTab_ : inactiveTab
              }`}
            >
              <MessageSquare size={13} />
              Chat
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-[13px] transition ${
                activeTab === 'documents' ? activeTab_ : inactiveTab
              }`}
            >
              <Files size={13} />
              Documents
            </button>
          </div>
        )}
      </header>

      <ConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />
    </>
  );
};
