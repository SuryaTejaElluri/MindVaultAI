import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { DocumentManager } from './components/DocumentManager';
import { ChatInterface } from './components/ChatInterface';
import { AuthCard } from './components/AuthCard';
import {
  Brain,
  ShieldCheck,
  BookOpen,
  Zap,
  Lock,
  Layers,
  FileSearch,
  Sparkles,
} from 'lucide-react';
import { ConfigModal } from './components/ConfigModal';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'chat' | 'documents'>('chat');
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col font-sans selection:bg-[#274D60] selection:text-white">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {!isAuthenticated ? (
        <main className="flex-1 flex items-center justify-center p-6 bg-black">
          <div className="max-w-xl w-full text-center space-y-8 py-6">
            {/* Hero Icon with #274D60 & Black */}
            <div className="relative inline-flex">
              <div className="p-4 rounded-3xl bg-black border-2 border-[#274D60] text-[#366882] shadow-[0_0_30px_rgba(39,77,96,0.35)]">
                <Brain size={48} className="text-[#8daec0]" />
              </div>
              <div className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-[#274D60] text-white border border-black shadow-md">
                <Lock size={14} />
              </div>
            </div>

            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black border border-[#274D60] text-xs text-[#8daec0]">
                <Sparkles size={13} className="text-[#8daec0]" />
                <span>Isolated Knowledge Vault</span>
              </div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
                MindVault<span className="text-[#8daec0]">AI</span>
              </h1>
              <p className="text-sm text-[#8daec0]/80 max-w-md mx-auto leading-relaxed">
                Upload confidential documents and query your private intelligence vault in complete privacy. Zero third-party sharing.
              </p>
            </div>

            {/* Email Login / Register Card */}
            <AuthCard />

            {/* Feature Badges with Black and #274D60 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-lg mx-auto pt-2">
              <div className="p-4 bg-black border border-[#274D60] rounded-2xl hover:border-[#366882] transition group">
                <div className="flex items-center justify-between mb-2">
                  <ShieldCheck size={20} className="text-[#8daec0]" />
                  <Lock size={12} className="text-[#274D60]" />
                </div>
                <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                  Owner Isolation
                </h4>
                <p className="text-[11px] text-[#8daec0]/70 mt-1">
                  Private storage partition per user account with strict authorization.
                </p>
              </div>

              <div className="p-4 bg-black border border-[#274D60] rounded-2xl hover:border-[#366882] transition group">
                <div className="flex items-center justify-between mb-2">
                  <BookOpen size={20} className="text-[#8daec0]" />
                  <FileSearch size={12} className="text-[#274D60]" />
                </div>
                <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                  Verified Citations
                </h4>
                <p className="text-[11px] text-[#8daec0]/70 mt-1">
                  Accurate source page numbers and verified text excerpts.
                </p>
              </div>

              <div className="p-4 bg-black border border-[#274D60] rounded-2xl hover:border-[#366882] transition group">
                <div className="flex items-center justify-between mb-2">
                  <Zap size={20} className="text-[#8daec0]" />
                  <Layers size={12} className="text-[#274D60]" />
                </div>
                <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                  Smart Indexing
                </h4>
                <p className="text-[11px] text-[#8daec0]/70 mt-1">
                  Instant document vectorization with automatic chunking.
                </p>
              </div>
            </div>
          </div>
        </main>
      ) : (
        <div className="flex-1 bg-black">
          {activeTab === 'chat' && <ChatInterface />}
          {activeTab === 'documents' && <DocumentManager />}
        </div>
      )}

      <ConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
