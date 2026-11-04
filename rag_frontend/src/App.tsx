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
  Sparkles,
  Layers,
  FileSearch,
} from 'lucide-react';
import { ConfigModal } from './components/ConfigModal';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'chat' | 'documents'>('chat');
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#03122F] text-[#F3DADF] flex flex-col font-sans selection:bg-[#F1916D] selection:text-[#03122F]">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {!isAuthenticated ? (
        <main className="flex-1 flex items-center justify-center p-6 bg-[#03122F]">
          <div className="max-w-xl w-full text-center space-y-8 py-6">
            {/* Hero Icon using Palette */}
            <div className="relative inline-flex">
              <div className="p-4 rounded-3xl bg-[#19305C] border-2 border-[#413B61] text-[#AE7DAC] shadow-[0_0_35px_rgba(241,145,109,0.25)]">
                <Brain size={48} className="text-[#F1916D]" />
              </div>
              <div className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-[#F1916D] text-[#03122F] border-2 border-[#03122F] shadow-md">
                <Lock size={14} />
              </div>
            </div>

            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#19305C] border border-[#413B61] text-xs text-[#AE7DAC]">
                <Sparkles size={13} className="text-[#F1916D]" />
                <span>Isolated Knowledge Intelligence</span>
              </div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
                MindVault<span className="text-[#F1916D]">AI</span>
              </h1>
              <p className="text-sm text-[#AE7DAC] max-w-md mx-auto leading-relaxed">
                Upload your private documents and chat with grounded citations from your personal knowledge vault.
              </p>
            </div>

            {/* Email Login / Register Card */}
            <AuthCard />

            {/* Feature Badges with Palette Colors */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-lg mx-auto pt-2">
              <div className="p-4 bg-[#19305C] border border-[#413B61] rounded-2xl hover:border-[#AE7DAC] transition group">
                <div className="flex items-center justify-between mb-2">
                  <ShieldCheck size={20} className="text-[#F1916D]" />
                  <Lock size={13} className="text-[#AE7DAC]" />
                </div>
                <h4 className="text-xs font-semibold text-white">Owner Isolation</h4>
                <p className="text-[11px] text-[#AE7DAC] mt-1 leading-normal">
                  Strictly partitioned vectors and chat history per user account.
                </p>
              </div>

              <div className="p-4 bg-[#19305C] border border-[#413B61] rounded-2xl hover:border-[#AE7DAC] transition group">
                <div className="flex items-center justify-between mb-2">
                  <BookOpen size={20} className="text-[#F1916D]" />
                  <FileSearch size={13} className="text-[#AE7DAC]" />
                </div>
                <h4 className="text-xs font-semibold text-white">Verified Citations</h4>
                <p className="text-[11px] text-[#AE7DAC] mt-1 leading-normal">
                  Exact page numbers and verified text previews from your docs.
                </p>
              </div>

              <div className="p-4 bg-[#19305C] border border-[#413B61] rounded-2xl hover:border-[#AE7DAC] transition group">
                <div className="flex items-center justify-between mb-2">
                  <Zap size={20} className="text-[#F1916D]" />
                  <Layers size={13} className="text-[#AE7DAC]" />
                </div>
                <h4 className="text-xs font-semibold text-white">Fast Ingestion</h4>
                <p className="text-[11px] text-[#AE7DAC] mt-1 leading-normal">
                  Automatic chunking and high-performance vector search.
                </p>
              </div>
            </div>
          </div>
        </main>
      ) : (
        <div className="flex-1 bg-[#03122F]">
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
