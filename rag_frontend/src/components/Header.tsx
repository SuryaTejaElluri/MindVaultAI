import React, { useState } from 'react';
import { Brain, MessageSquare, FolderOpen, LogOut, Settings, User as UserIcon } from 'lucide-react';
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
      <header className="border-b border-vault-teal/20 bg-vault-darkest/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-vault-teal to-vault-cyan flex items-center justify-center shadow-lg shadow-vault-cyan/20">
                <Brain className="text-white" size={18} />
              </div>
              <div>
                <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                  MindVault<span className="text-vault-cyan">AI</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-vault-teal/10 text-vault-cyan px-1.5 py-0.5 rounded border border-vault-teal/20">
                    Beta
                  </span>
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            {isAuthenticated && (
              <nav className="hidden sm:flex items-center gap-1 bg-vault-dark p-1 rounded-xl border border-vault-teal/20">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeTab === 'chat'
                      ? 'bg-vault-cyan text-white shadow-sm shadow-vault-cyan/20'
                      : 'text-vault-blue/60 hover:text-vault-blue'
                  }`}
                >
                  <MessageSquare size={14} />
                  Chat
                </button>
                <button
                  onClick={() => setActiveTab('documents')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeTab === 'documents'
                      ? 'bg-vault-cyan text-white shadow-sm shadow-vault-cyan/20'
                      : 'text-vault-blue/60 hover:text-vault-blue'
                  }`}
                >
                  <FolderOpen size={14} />
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
              className="p-2 text-vault-blue/50 hover:text-vault-cyan hover:bg-vault-teal/10 rounded-xl border border-transparent hover:border-vault-teal/20 transition"
            >
              <Settings size={18} />
            </button>

            {isAuthenticated && (
              <div className="flex items-center gap-3 pl-2 border-l border-vault-teal/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-vault-teal/20 flex items-center justify-center text-vault-cyan border border-vault-teal/40 font-semibold text-xs uppercase">
                    {user?.email ? user.email.charAt(0) : <UserIcon size={14} />}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-xs font-medium text-white leading-tight">
                      {user?.email}
                    </p>
                  </div>
                </div>

                <button
                  onClick={logout}
                  title="Sign Out"
                  className="flex items-center gap-1.5 text-xs text-vault-blue/50 hover:text-rose-400 hover:bg-rose-500/10 px-2.5 py-1.5 rounded-xl transition"
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
