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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ConfigModal } from './ConfigModal';

interface HeaderProps {
  activeTab: 'chat' | 'documents';
  setActiveTab: (tab: 'chat' | 'documents') => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  return (
    <>
      <header className="border-b border-[#413B61] bg-[#03122F]/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-[#19305C] border-2 border-[#413B61] flex items-center justify-center shadow-md">
                <Brain className="text-[#F1916D]" size={18} />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white flex items-center gap-1">
                  MindVault<span className="text-[#F1916D]">AI</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider bg-[#19305C] text-[#AE7DAC] px-2 py-0.5 rounded-full border border-[#413B61]">
                  <Shield size={10} className="text-[#F1916D]" />
                  Encrypted Vault
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            {isAuthenticated && (
              <nav className="hidden sm:flex items-center gap-1.5 bg-[#19305C] p-1 rounded-xl border border-[#413B61]">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'chat'
                      ? 'bg-[#F1916D] text-[#03122F] shadow-sm'
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsConfigOpen(true)}
              title="Settings & Configuration"
              className="p-2 text-[#AE7DAC] hover:text-[#F1916D] hover:bg-[#19305C] rounded-xl border border-[#413B61] transition"
            >
              <Settings size={17} />
            </button>

            {isAuthenticated && (
              <div className="flex items-center gap-3 pl-2 border-l border-[#413B61]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#19305C] flex items-center justify-center text-[#F1916D] border-2 border-[#413B61] font-bold text-xs uppercase shadow-sm">
                    {user?.email ? user.email.charAt(0) : <UserIcon size={14} />}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-xs font-medium text-[#F3DADF] leading-tight">
                      {user?.email}
                    </p>
                    <p className="text-[10px] text-[#AE7DAC] flex items-center gap-1">
                      <Sparkles size={9} className="text-[#F1916D]" /> Active Session
                    </p>
                  </div>
                </div>

                <button
                  onClick={logout}
                  title="Sign Out"
                  className="flex items-center gap-1.5 text-xs text-[#AE7DAC] hover:text-[#F1916D] hover:bg-red-950/20 px-2.5 py-1.5 rounded-xl border border-transparent hover:border-[#413B61] transition"
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
