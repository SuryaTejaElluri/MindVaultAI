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

    if (testTokenInput.trim()) {
      loginWithCustomToken(testTokenInput.trim());
    }

    setSavedMessage(true);
    setTimeout(() => {
      setSavedMessage(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4">
      <div
        className={`border rounded-2xl w-full max-w-lg shadow-2xl p-4 sm:p-6 relative max-h-[90vh] overflow-y-auto transition-colors ${
          isLight
            ? 'bg-white border-slate-200 text-slate-800'
            : 'bg-[#1E293B] border-slate-700 text-slate-100'
        }`}
      >
        <button
          onClick={onClose}
          className={`absolute top-3.5 right-3.5 sm:top-4 sm:right-4 transition ${
            isLight ? 'text-slate-400 hover:text-slate-700' : 'text-slate-400 hover:text-white'
          }`}
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-6">
          <div
            className={`p-2 rounded-xl border shadow-sm ${
              isLight
                ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                : 'bg-indigo-950/50 border-indigo-500/30 text-indigo-400'
            }`}
          >
            <SettingsIcon size={20} />
          </div>
          <div>
            <h2 className={`text-base sm:text-lg font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              System Settings
            </h2>
            <p className={`text-[11px] sm:text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Configure connection endpoints and development overrides
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 sm:space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Globe size={13} className={isLight ? 'text-indigo-600' : 'text-indigo-400'} />
              <label
                className={`text-xs font-medium ${
                  isLight ? 'text-slate-700' : 'text-slate-300'
                }`}
              >
                Backend API Base URL
              </label>
            </div>
            <input
              type="url"
              required
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="http://localhost:8000"
              className={`w-full rounded-xl px-3 sm:px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition border ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900'
                  : 'bg-[#0F172A] border-slate-700 text-slate-100 placeholder:text-slate-600'
              }`}
            />
            <p className={`text-[10px] sm:text-[11px] mt-1 flex items-center gap-1 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
              <Terminal size={11} className={isLight ? 'text-indigo-600' : 'text-indigo-400'} />
              Default backend service: http://localhost:8000
            </p>
          </div>

          <div className={`pt-2 border-t ${isLight ? 'border-slate-200' : 'border-slate-700'}`}>
            <div className="flex items-center gap-2 mb-1.5">
              <Key size={13} className={isLight ? 'text-indigo-600' : 'text-indigo-400'} />
              <label
                className={`text-xs font-medium ${
                  isLight ? 'text-slate-700' : 'text-slate-300'
                }`}
              >
                Direct JWT Bearer Token (Optional)
              </label>
            </div>
            <textarea
              rows={2}
              value={testTokenInput}
              onChange={(e) => setTestTokenInput(e.target.value)}
              placeholder="eyJhbGciOi... (optional manual JWT token override)"
              className={`w-full rounded-xl px-3 sm:px-3.5 py-2 text-xs font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition resize-none border ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900'
                  : 'bg-[#0F172A] border-slate-700 text-slate-100 placeholder:text-slate-600'
              }`}
            />
            <p className={`text-[10px] sm:text-[11px] mt-1 flex items-center gap-1 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
              <Shield size={11} className={isLight ? 'text-indigo-600' : 'text-indigo-400'} />
              For manual debugging and pre-signed tokens.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 sm:pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`px-3.5 py-2 text-xs font-medium transition ${
                isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold px-4 sm:px-5 py-2 rounded-xl text-xs transition shadow-md shadow-indigo-500/20"
            >
              {savedMessage ? (
                <>
                  <Check size={13} /> Saved!
                </>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
