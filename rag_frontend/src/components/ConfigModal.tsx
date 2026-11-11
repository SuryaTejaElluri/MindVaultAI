import React, { useState } from 'react';
import { Settings as SettingsIcon, X, Check, Key, Globe, Shield, Terminal } from 'lucide-react';
import { getApiBaseUrl, setApiBaseUrl } from '../api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose }) => {
  const { loginWithCustomToken } = useAuth();
  const { isLight } = useTheme();
  const [apiUrl, setApiUrl] = useState(getApiBaseUrl());
  const [testTokenInput, setTestTokenInput] = useState('');
  const [savedMessage, setSavedMessage] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setApiBaseUrl(apiUrl);
    if (testTokenInput.trim()) loginWithCustomToken(testTokenInput.trim());
    setSavedMessage(true);
    setTimeout(() => { setSavedMessage(false); onClose(); }, 1000);
  };

  const modalBg = isLight
    ? 'bg-white border-hairline text-ink'
    : 'bg-dark-raised border-[#38383E] text-dark-ink';

  const textMuted = isLight ? 'text-muted' : 'text-dark-muted';
  const divider = isLight ? 'border-hairline' : 'border-[#38383E]';

  const inputCls = `w-full rounded-md px-3.5 py-2.5 text-[14px] focus:outline-none transition border ${
    isLight
      ? 'bg-surface border-hairline text-ink placeholder:text-muted focus:border-[#A1A1A1] focus:ring-1 focus:ring-[#A1A1A1]'
      : 'bg-dark-surface border-[#38383E] text-dark-ink placeholder:text-dark-muted focus:border-[#6B6B70] focus:ring-1 focus:ring-[#6B6B70]'
  }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`border rounded-xl w-full max-w-lg shadow-2xl p-5 sm:p-6 relative max-h-[90vh] overflow-y-auto transition-colors ${modalBg}`}>
        {/* Close */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 transition ${textMuted} hover:text-ink`}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-2 rounded-md border ${isLight ? 'bg-surface-raised border-hairline' : 'bg-dark-surface border-[#38383E]'}`}>
            <SettingsIcon size={18} className={textMuted} />
          </div>
          <div>
            <h2 className={`font-fraunces text-[22px] leading-tight ${isLight ? 'text-ink' : 'text-dark-ink'}`}>
              System Settings
            </h2>
            <p className={`text-[13px] ${textMuted}`}>Configure connection endpoints and development overrides</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* API URL */}
          <div>
            <div className={`flex items-center gap-2 mb-1.5 text-[13px] ${textMuted}`}>
              <Globe size={12} />
              <label>Backend API Base URL</label>
            </div>
            <input
              type="url"
              required
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="http://localhost:8000"
              className={inputCls}
            />
            <p className={`font-space-mono text-[11px] mt-1 flex items-center gap-1 ${textMuted}`}>
              <Terminal size={10} /> Default: http://localhost:8000
            </p>
          </div>

          {/* Token */}
          <div className={`pt-4 border-t ${divider}`}>
            <div className={`flex items-center gap-2 mb-1.5 text-[13px] ${textMuted}`}>
              <Key size={12} />
              <label>Direct JWT Bearer Token (Optional)</label>
            </div>
            <textarea
              rows={2}
              value={testTokenInput}
              onChange={(e) => setTestTokenInput(e.target.value)}
              placeholder="eyJhbGciOi… (optional manual JWT token override)"
              className={`${inputCls} resize-none font-space-mono`}
            />
            <p className={`font-space-mono text-[11px] mt-1 flex items-center gap-1 ${textMuted}`}>
              <Shield size={10} /> For manual debugging and pre-signed tokens.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-[13px] rounded-md transition ${
                isLight ? 'text-muted hover:text-ink' : 'text-dark-muted hover:text-dark-ink'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex items-center gap-1.5 h-[42px] px-5 rounded-md text-[14px] transition ${
                isLight ? 'bg-ink text-white hover:opacity-85' : 'bg-dark-ink text-dark-surface hover:opacity-85'
              }`}
            >
              {savedMessage ? <><Check size={13} /> Saved!</> : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
