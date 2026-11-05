import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { DocumentManager } from './components/DocumentManager';
import { ChatInterface } from './components/ChatInterface';
import { AuthCard } from './components/AuthCard';
import {
  Brain,
  ShieldCheck,
  BookOpen,
  Zap,
  Lock,
  Sparkles,
  Layers,
  FileSearch,
} from 'lucide-react';
import { ConfigModal } from './components/ConfigModal';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { isLight } = useTheme();
  const [activeTab, setActiveTab] = useState<'chat' | 'documents'>('chat');
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isLight
          ? 'bg-[#F8FAFC] text-slate-800 selection:bg-indigo-600 selection:text-white'
          : 'bg-[#0F172A] text-slate-100 selection:bg-indigo-500 selection:text-white'
      }`}
    >
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {!isAuthenticated ? (
        <main
          className={`flex-1 flex items-center justify-center p-3 sm:p-6 ${
            isLight ? 'bg-[#F8FAFC]' : 'bg-[#0F172A]'
          }`}
        >
          <div className="max-w-xl w-full text-center space-y-6 sm:space-y-8 py-5 sm:py-8">
            {/* Hero Icon */}
            <div className="relative inline-flex">
              <div
                className={`p-3.5 sm:p-4 rounded-3xl border transition-all ${
                  isLight
                    ? 'bg-white border-slate-200 text-indigo-600 shadow-lg shadow-slate-200/60'
                    : 'bg-[#1E293B] border-slate-700 text-indigo-400 shadow-[0_0_35px_rgba(99,102,241,0.25)]'
                }`}
              >
                <Brain size={42} className={isLight ? 'text-indigo-600' : 'text-indigo-400'} />
              </div>
              <div
                className={`absolute -bottom-1 -right-1 p-1 sm:p-1.5 rounded-xl border-2 shadow-md ${
                  isLight
                    ? 'bg-indigo-600 text-white border-white'
                    : 'bg-indigo-500 text-slate-950 border-[#0F172A]'
                }`}
              >
                <Lock size={13} />
              </div>
            </div>

            <div className="space-y-2.5 sm:space-y-3">
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] sm:text-xs font-medium ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-600 shadow-sm'
                    : 'bg-[#1E293B] border-slate-700 text-indigo-300'
                }`}
              >
                <Sparkles size={12} className={isLight ? 'text-indigo-600' : 'text-indigo-400'} />
                <span>Isolated Knowledge Intelligence</span>
              </div>
              <h1
                className={`text-2xl sm:text-4xl font-extrabold tracking-tight ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                MindVault<span className={isLight ? 'text-indigo-600' : 'text-indigo-400'}>AI</span>
              </h1>
              <p
                className={`text-xs sm:text-sm max-w-md mx-auto leading-relaxed px-2 ${
                  isLight ? 'text-slate-600' : 'text-slate-400'
                }`}
              >
                Upload your private documents and chat with grounded citations from your personal knowledge vault.
              </p>
            </div>

            {/* Email Login / Register Card */}
            <AuthCard />

            {/* Feature Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-left max-w-lg mx-auto pt-1 sm:pt-2 px-1">
              <div
                className={`p-3.5 sm:p-4 rounded-2xl border transition group ${
                  isLight
                    ? 'bg-white border-slate-200 hover:border-indigo-500 shadow-sm'
                    : 'bg-[#1E293B] border-slate-700 hover:border-indigo-500/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <ShieldCheck size={18} className={isLight ? 'text-indigo-600' : 'text-indigo-400'} />
                  <Lock size={12} className={isLight ? 'text-slate-400' : 'text-slate-500'} />
                </div>
                <h4 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Owner Isolation
                </h4>
                <p className={`text-[11px] mt-0.5 leading-normal ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Strictly partitioned vectors per user account.
                </p>
              </div>

              <div
                className={`p-3.5 sm:p-4 rounded-2xl border transition group ${
                  isLight
                    ? 'bg-white border-slate-200 hover:border-indigo-500 shadow-sm'
                    : 'bg-[#1E293B] border-slate-700 hover:border-indigo-500/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <BookOpen size={18} className={isLight ? 'text-indigo-600' : 'text-indigo-400'} />
                  <FileSearch size={12} className={isLight ? 'text-slate-400' : 'text-slate-500'} />
                </div>
                <h4 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Verified Citations
                </h4>
                <p className={`text-[11px] mt-0.5 leading-normal ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Exact page numbers & previews from docs.
                </p>
              </div>

              <div
                className={`p-3.5 sm:p-4 rounded-2xl border transition group ${
                  isLight
                    ? 'bg-white border-slate-200 hover:border-indigo-500 shadow-sm'
                    : 'bg-[#1E293B] border-slate-700 hover:border-indigo-500/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <Zap size={18} className={isLight ? 'text-indigo-600' : 'text-indigo-400'} />
                  <Layers size={12} className={isLight ? 'text-slate-400' : 'text-slate-500'} />
                </div>
                <h4 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Fast Ingestion
                </h4>
                <p className={`text-[11px] mt-0.5 leading-normal ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Automatic chunking and high-speed vectors.
                </p>
              </div>
            </div>
          </div>
        </main>
      ) : (
        <div className={`flex-1 flex flex-col ${isLight ? 'bg-[#F8FAFC]' : 'bg-[#0F172A]'}`}>
          {activeTab === 'chat' && <ChatInterface />}
          {activeTab === 'documents' && <DocumentManager />}
        </div>
      )}

      <Footer
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsConfigOpen(true)}
      />

      <ConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
