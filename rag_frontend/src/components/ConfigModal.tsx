import React, { useState } from 'react';
import { Settings as SettingsIcon, X, Check, Key, Globe } from 'lucide-react';
import { getApiBaseUrl, setApiBaseUrl } from '../api';
import { useAuth } from '../context/AuthContext';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose }) => {
  const { loginWithCustomToken } = useAuth();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <SettingsIcon size={22} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">System Settings</h2>
            <p className="text-xs text-slate-400">Configure connection endpoints and development tokens</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Globe size={14} className="text-indigo-400" />
              <label className="text-xs font-medium text-slate-300">
                Backend API Base URL
              </label>
            </div>
            <input
              type="url"
              required
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="http://localhost:8000"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              The URL of your running FastAPI backend (default: http://localhost:8000).
            </p>
          </div>

          <div className="pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-2 mb-1.5">
              <Key size={14} className="text-amber-400" />
              <label className="text-xs font-medium text-slate-300">
                Direct / Development JWT Bearer Token
              </label>
            </div>
            <textarea
              rows={2}
              value={testTokenInput}
              onChange={(e) => setTestTokenInput(e.target.value)}
              placeholder="eyJhbGciOi... (optional manual JWT token override)"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500 transition resize-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Optional: for developer testing with pre-generated tokens.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-xs font-medium shadow-lg shadow-indigo-600/20 transition"
            >
              {savedMessage ? (
                <>
                  <Check size={14} /> Saved!
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
