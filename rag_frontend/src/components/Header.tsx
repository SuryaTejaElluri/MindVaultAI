import React, { useState } from 'react';
import { Database, MessageSquare, LogOut, Settings, User as UserIcon } from 'lucide-react';
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
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Database className="text-white" size={18} />
              </div>
              <div>
                <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                  RAG Intelligence
                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/20">
                    Multi-User
                  </span>
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            {isAuthenticated && (
              <nav className="hidden sm:flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeTab === 'chat'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <MessageSquare size={14} />
                  Chat & Q&A
                </button>
                <button
                  onClick={() => setActiveTab('documents')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeTab === 'documents'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Database size={14} />
                  Documents
                </button>
              </nav>
            )}
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsConfigOpen(true)}
              title="Settings & Configuration"
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-xl border border-transparent hover:border-slate-800 transition"
            >
              <Settings size={18} />
            </button>

            {isAuthenticated && (
              <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center text-indigo-300 border border-indigo-500/30 font-semibold text-xs uppercase">
                    {user?.email ? user.email.charAt(0) : <UserIcon size={14} />}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-xs font-medium text-slate-200 leading-tight">
                      {user?.email}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono truncate max-w-[140px]">
                      ID: {user?.sub?.slice(0, 8)}...
                    </p>
                  </div>
                </div>

                <button
                  onClick={logout}
                  title="Sign Out"
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 px-2.5 py-1.5 rounded-xl transition"
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
