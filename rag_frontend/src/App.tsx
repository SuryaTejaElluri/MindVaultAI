import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { DocumentManager } from './components/DocumentManager';
import { ChatInterface } from './components/ChatInterface';
import { AuthCard } from './components/AuthCard';
import { Brain, ShieldCheck, BookOpen, Zap, Lock, Layers, FileSearch } from 'lucide-react';
import { ConfigModal } from './components/ConfigModal';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { isLight } = useTheme();
  const [activeTab, setActiveTab] = useState<'chat' | 'documents'>('chat');
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const pageBg = isLight ? 'bg-surface text-ink' : 'bg-dark-surface text-dark-ink';

  return (
    <div className={`min-h-screen flex flex-col font-hanken transition-colors duration-200 ${pageBg}`}>
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {!isAuthenticated ? (
        <main className={`flex-1 flex items-center justify-center p-4 sm:p-8 ${pageBg}`}>
          <div className="max-w-[480px] w-full text-center space-y-8 py-6 sm:py-10">

            {/* Hero Icon */}
            <div className="relative inline-flex">
              <div className={`p-4 rounded-xl border transition-all ${
                isLight
                  ? 'bg-white border-hairline text-ink shadow-ambient'
                  : 'bg-dark-raised border-[#38383E] text-dark-ink shadow-card'
              }`}>
                <Brain size={40} />
              </div>
              <div className={`absolute -bottom-1 -right-1 p-1 rounded-md border-2 ${
                isLight ? 'bg-ink text-white border-surface' : 'bg-dark-ink text-dark-surface border-dark-surface'
              }`}>
                <Lock size={11} />
              </div>
            </div>

            {/* Headline */}
            <div className="space-y-3">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xs border font-space-mono text-[11px] ${
                isLight
                  ? 'bg-surface-raised border-hairline text-muted'
                  : 'bg-dark-raised border-[#38383E] text-dark-muted'
              }`}>
                Isolated Knowledge Intelligence
              </div>
              <h1 className="font-fraunces text-[42px] sm:text-[52px] leading-[1.05] tracking-[-0.03em]">
                <span className={isLight ? 'text-ink' : 'text-dark-ink'}>MindVault</span>
                <span className={isLight ? 'text-muted' : 'text-dark-muted'}>AI</span>
              </h1>
              <p className={`text-[15px] leading-relaxed max-w-sm mx-auto ${isLight ? 'text-muted' : 'text-dark-muted'}`}>
                Upload your private documents and chat with grounded citations from your personal knowledge vault.
              </p>
            </div>

            {/* Auth Card */}
            <AuthCard />

            {/* Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
              {[
                {
                  icon: ShieldCheck,
                  title: 'Owner Isolation',
                  desc: 'Strictly partitioned vectors per user account.',
                  secondary: Lock,
                },
                {
                  icon: BookOpen,
                  title: 'Verified Citations',
                  desc: 'Exact page numbers & previews from docs.',
                  secondary: FileSearch,
                },
                {
                  icon: Zap,
                  title: 'Fast Ingestion',
                  desc: 'Automatic chunking and high-speed vectors.',
                  secondary: Layers,
                },
              ].map(({ icon: Icon, title, desc, secondary: SecIcon }) => (
                <div
                  key={title}
                  className={`p-4 rounded-xl border transition ${
                    isLight
                      ? 'bg-white border-hairline hover:border-[#A1A1A1] shadow-ambient'
                      : 'bg-dark-raised border-[#38383E] hover:border-[#6B6B70]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon size={16} className={isLight ? 'text-ink' : 'text-dark-ink'} />
                    <SecIcon size={12} className={isLight ? 'text-muted' : 'text-dark-muted'} />
                  </div>
                  <h4 className={`font-fraunces text-[15px] leading-tight mb-1 ${isLight ? 'text-ink' : 'text-dark-ink'}`}>
                    {title}
                  </h4>
                  <p className={`text-[12px] leading-relaxed ${isLight ? 'text-muted' : 'text-dark-muted'}`}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </main>
      ) : (
        <div className={`flex-1 flex flex-col ${pageBg}`}>
          {activeTab === 'chat' && <ChatInterface />}
          {activeTab === 'documents' && <DocumentManager />}
        </div>
      )}

      <Footer setActiveTab={setActiveTab} onOpenSettings={() => setIsConfigOpen(true)} />
      <ConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />
    </div>
  );
};

export const App: React.FC = () => (
  <ThemeProvider>
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  </ThemeProvider>
);

export default App;
