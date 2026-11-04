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
      <header className="border-b border-[#274D60] bg-black/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-black border-2 border-[#274D60] flex items-center justify-center shadow-[0_0_15px_rgba(39,77,96,0.4)]">
                <Brain className="text-[#8daec0]" size={18} />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white flex items-center gap-1">
                  MindVault<span className="text-[#8daec0]">AI</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider bg-black text-[#8daec0] px-2 py-0.5 rounded-full border border-[#274D60]">
                  <Shield size={10} />
                  Vault Secure
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            {isAuthenticated && (
              <nav className="hidden sm:flex items-center gap-1.5 bg-black p-1 rounded-xl border border-[#274D60]">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeTab === 'chat'
                      ? 'bg-[#274D60] text-white shadow-sm border border-[#366882]'
                      : 'text-[#8daec0]/70 hover:text-white hover:bg-[#274D60]/20'
                  }`}
                >
                  <MessageSquare size={14} />
                  <span>Chat & Query</span>
                </button>
                <button
                  onClick={() => setActiveTab('documents')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeTab === 'documents'
                      ? 'bg-[#274D60] text-white shadow-sm border border-[#366882]'
                      : 'text-[#8daec0]/70 hover:text-white hover:bg-[#274D60]/20'
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
              className="p-2 text-[#8daec0] hover:text-white hover:bg-[#274D60]/30 rounded-xl border border-[#274D60]/60 hover:border-[#274D60] transition"
            >
              <Settings size={17} />
            </button>

            {isAuthenticated && (
              <div className="flex items-center gap-3 pl-2 border-l border-[#274D60]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-[#8daec0] border-2 border-[#274D60] font-semibold text-xs uppercase shadow-sm">
                    {user?.email ? user.email.charAt(0) : <UserIcon size={14} />}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-xs font-medium text-white leading-tight">
                      {user?.email}
                    </p>
                    <p className="text-[10px] text-[#8daec0]/60 flex items-center gap-1">
                      <Sparkles size={9} className="text-[#8daec0]" /> Active Session
                    </p>
                  </div>
                </div>

                <button
                  onClick={logout}
                  title="Sign Out"
                  className="flex items-center gap-1.5 text-xs text-[#8daec0] hover:text-red-400 hover:bg-red-950/20 px-2.5 py-1.5 rounded-xl border border-transparent hover:border-red-900/40 transition"
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
