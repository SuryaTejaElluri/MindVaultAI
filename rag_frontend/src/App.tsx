import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { DocumentManager } from './components/DocumentManager';
import { ChatInterface } from './components/ChatInterface';
import { AuthCard } from './components/AuthCard';
import { Brain, ShieldCheck, BookOpen, Zap } from 'lucide-react';
import { ConfigModal } from './components/ConfigModal';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'chat' | 'documents'>('chat');
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  return (
    <div className="min-h-screen bg-vault-darkest flex flex-col font-sans">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {!isAuthenticated ? (
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-xl w-full text-center space-y-8">
            {/* Hero Icon */}
            <div className="inline-flex p-4 rounded-3xl bg-gradient-to-tr from-vault-teal/20 to-vault-cyan/20 border border-vault-teal/30 text-vault-cyan shadow-2xl shadow-vault-cyan/10">
              <Brain size={44} />
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
                MindVault<span className="text-vault-cyan">AI</span>
              </h1>
              <p className="text-sm text-vault-blue/80 max-w-md mx-auto leading-relaxed">
                Upload your private documents and get grounded, cited answers from your own
                isolated knowledge vault — zero data leakage, full control.
              </p>
            </div>

            {/* Email Login / Register Card */}
            <AuthCard />

            {/* Feature Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-lg mx-auto pt-2">
              <div className="p-4 bg-vault-dark/60 border border-vault-teal/20 rounded-2xl">
                <ShieldCheck size={18} className="text-vault-cyan mb-2" />
                <h4 className="text-xs font-semibold text-white">Owner Isolation</h4>
                <p className="text-[11px] text-vault-blue/70 mt-1">
                  Vectors and history are strictly partitioned per user account.
                </p>
              </div>

              <div className="p-4 bg-vault-dark/60 border border-vault-teal/20 rounded-2xl">
                <BookOpen size={18} className="text-vault-cyan mb-2" />
                <h4 className="text-xs font-semibold text-white">Grounded Citations</h4>
                <p className="text-[11px] text-vault-blue/70 mt-1">
                  Human-readable page numbers and verified source previews.
                </p>
              </div>

              <div className="p-4 bg-vault-dark/60 border border-vault-teal/20 rounded-2xl">
                <Zap size={18} className="text-vault-cyan mb-2" />
                <h4 className="text-xs font-semibold text-white">Smart Retrieval</h4>
                <p className="text-[11px] text-vault-blue/70 mt-1">
                  Semantic vector search with rate limiting and storage quotas.
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
