import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { DocumentManager } from './components/DocumentManager';
import { ChatInterface } from './components/ChatInterface';
import { AuthCard } from './components/AuthCard';
import { Database, ShieldCheck, Sparkles } from 'lucide-react';
import { ConfigModal } from './components/ConfigModal';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'chat' | 'documents'>('chat');
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {!isAuthenticated ? (
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-xl w-full text-center space-y-8">
            <div className="inline-flex p-4 rounded-3xl bg-gradient-to-tr from-indigo-600/20 to-violet-500/20 border border-indigo-500/30 text-indigo-400 shadow-2xl">
              <Database size={44} />
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
                Private Multi-User RAG Intelligence
              </h1>
              <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                Upload private PDF, TXT, and Markdown documents into your isolated personal knowledge
                store. Chat with grounded citations and zero data leakage.
              </p>
            </div>

            {/* Email Login / Register Card */}
            <AuthCard />

            {/* Feature Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-lg mx-auto pt-2">
              <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
                <ShieldCheck size={18} className="text-emerald-400 mb-2" />
                <h4 className="text-xs font-semibold text-slate-200">Owner Isolation</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Vectors and history are strictly partitioned per user account.
                </p>
              </div>

              <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
                <Sparkles size={18} className="text-indigo-400 mb-2" />
                <h4 className="text-xs font-semibold text-slate-200">Grounded Citations</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Human-readable page numbers and source chunk previews.
                </p>
              </div>

              <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
                <Database size={18} className="text-amber-400 mb-2" />
                <h4 className="text-xs font-semibold text-slate-200">Quotas & Safety</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Rate limiting, storage quotas, and background ingestion.
                </p>
              </div>
            </div>
          </div>
        </main>
      ) : (
        <div className="flex-1">
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
