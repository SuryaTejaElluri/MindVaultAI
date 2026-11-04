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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className={`border-2 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative ${
          isLight
            ? 'bg-white border-slate-200 text-slate-800'
            : 'bg-[#19305C] border-[#413B61] text-[#F3DADF]'
        }`}
      >
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 transition ${
            isLight ? 'text-slate-400 hover:text-slate-700' : 'text-[#AE7DAC] hover:text-[#F1916D]'
          }`}
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div
            className={`p-2.5 rounded-xl border shadow-sm ${
              isLight
                ? 'bg-slate-100 border-slate-200 text-[#F1916D]'
                : 'bg-[#03122F] border-[#413B61] text-[#F1916D]'
            }`}
          >
            <SettingsIcon size={22} />
          </div>
          <div>
            <h2 className={`text-lg font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              System Settings
            </h2>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-[#AE7DAC]'}`}>
              Configure connection endpoints and development overrides
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Globe size={14} className="text-[#F1916D]" />
              <label
                className={`text-xs font-medium ${
                  isLight ? 'text-slate-700' : 'text-[#F3DADF]'
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
              className={`w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#F1916D] focus:ring-1 focus:ring-[#F1916D] transition border ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900'
                  : 'bg-[#03122F] border-[#413B61] text-[#F3DADF]'
              }`}
            />
            <p className={`text-[11px] mt-1 flex items-center gap-1 ${isLight ? 'text-slate-400' : 'text-[#AE7DAC]'}`}>
              <Terminal size={11} className="text-[#F1916D]" />
              Default backend service: http://localhost:8000
            </p>
          </div>

          <div className={`pt-2 border-t ${isLight ? 'border-slate-200' : 'border-[#413B61]'}`}>
            <div className="flex items-center gap-2 mb-1.5">
              <Key size={14} className="text-[#F1916D]" />
              <label
                className={`text-xs font-medium ${
                  isLight ? 'text-slate-700' : 'text-[#F3DADF]'
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
              className={`w-full rounded-xl px-3.5 py-2 text-xs font-mono focus:outline-none focus:border-[#F1916D] focus:ring-1 focus:ring-[#F1916D] transition resize-none border ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900'
                  : 'bg-[#03122F] border-[#413B61] text-[#F3DADF]'
              }`}
            />
            <p className={`text-[11px] mt-1 flex items-center gap-1 ${isLight ? 'text-slate-400' : 'text-[#AE7DAC]'}`}>
              <Shield size={11} className="text-[#F1916D]" />
              For manual debugging and pre-signed tokens.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-xs font-medium transition ${
                isLight ? 'text-slate-600 hover:text-slate-900' : 'text-[#AE7DAC] hover:text-[#F3DADF]'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 bg-[#F1916D] hover:bg-[#F1916D]/90 text-white font-bold px-5 py-2 rounded-xl text-xs transition shadow-md"
            >
              {savedMessage ? (
                <>
                  <Check size={14} /> Saved Successfully!
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
