import React from 'react';
import { Brain, Lock, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface FooterProps {
  setActiveTab?: (tab: 'chat' | 'documents') => void;
  onOpenSettings?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab, onOpenSettings }) => {
  const { isLight } = useTheme();

  const footerBg = isLight
    ? 'bg-surface border-hairline text-muted'
    : 'bg-dark-surface border-[#38383E] text-dark-muted';

  const linkHover = isLight
    ? 'hover:text-ink transition'
    : 'hover:text-dark-ink transition';

  const divider = isLight ? 'bg-hairline' : 'bg-[#38383E]';

  return (
    <footer className={`border-t mt-auto transition-colors duration-200 ${footerBg}`}>
      <div className="max-w-[1080px] mx-auto px-4 sm:px-6 py-5 sm:py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">

          {/* Brand */}
          <div className="flex items-center gap-3">
            <Brain size={15} className={isLight ? 'text-ink' : 'text-dark-ink'} />
            <span className="font-space-grotesk font-medium text-[13px] tracking-tight">
              <span className={isLight ? 'text-ink' : 'text-dark-ink'}>MindVault</span>
              <span className={isLight ? 'text-muted' : 'text-dark-muted'}>AI</span>
            </span>
            <div className={`h-3.5 w-px ${divider} hidden sm:block`} />
            {/* Live indicator */}
            <div className="flex items-center gap-1.5 font-space-mono text-[11px]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3563AD] opacity-60"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#3563AD]"></span>
              </span>
              Vault Engine Active
            </div>
          </div>

          {/* Security Badges */}
          <div className="flex items-center gap-4 font-space-mono text-[11px]">
            <span className="flex items-center gap-1">
              <Lock size={10} />
              Multi-Tenant
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 size={10} />
              Grounded Citations
            </span>
          </div>

          {/* Nav links */}
          <div className="flex items-center gap-4 font-hanken text-[13px]">
            {setActiveTab && (
              <button onClick={() => setActiveTab('chat')} className={linkHover}>
                Chat
              </button>
            )}
            {setActiveTab && (
              <button onClick={() => setActiveTab('documents')} className={linkHover}>
                Documents
              </button>
            )}
            {onOpenSettings && (
              <button onClick={onOpenSettings} className={linkHover}>
                Settings
              </button>
            )}
            <span className={isLight ? 'text-muted' : 'text-dark-muted'}>
              © {new Date().getFullYear()} MindVaultAI
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
