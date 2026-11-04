import React, { useState } from 'react';
import { Settings as SettingsIcon, X, Check, Key, Globe, Shield, Terminal } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#03122F]/85 backdrop-blur-sm p-4">
      <div className="bg-[#19305C] border-2 border-[#413B61] rounded-2xl w-full max-w-lg shadow-[0_10px_40px_rgba(3,18,47,0.8)] p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#AE7DAC] hover:text-[#F1916D] transition"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-[#03122F] border border-[#413B61] text-[#F1916D] rounded-xl shadow-sm">
            <SettingsIcon size={22} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              System Settings
            </h2>
            <p className="text-xs text-[#AE7DAC]">Configure connection endpoints and development overrides</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Globe size={14} className="text-[#F1916D]" />
              <label className="text-xs font-medium text-[#F3DADF]">
                Backend API Base URL
              </label>
            </div>
            <input
              type="url"
              required
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="http://localhost:8000"
              className="w-full bg-[#03122F] border border-[#413B61] rounded-xl px-3.5 py-2.5 text-sm text-[#F3DADF] focus:outline-none focus:border-[#F1916D] focus:ring-1 focus:ring-[#F1916D] transition"
            />
            <p className="text-[11px] text-[#AE7DAC] mt-1 flex items-center gap-1">
              <Terminal size={11} className="text-[#F1916D]" />
              Default backend service: http://localhost:8000
            </p>
          </div>

          <div className="pt-2 border-t border-[#413B61]">
            <div className="flex items-center gap-2 mb-1.5">
              <Key size={14} className="text-[#F1916D]" />
              <label className="text-xs font-medium text-[#F3DADF]">
                Direct JWT Bearer Token (Optional)
              </label>
            </div>
            <textarea
              rows={2}
              value={testTokenInput}
              onChange={(e) => setTestTokenInput(e.target.value)}
              placeholder="eyJhbGciOi... (optional manual JWT token override)"
              className="w-full bg-[#03122F] border border-[#413B61] rounded-xl px-3.5 py-2 text-xs font-mono text-[#F3DADF] focus:outline-none focus:border-[#F1916D] focus:ring-1 focus:ring-[#F1916D] transition resize-none"
            />
            <p className="text-[11px] text-[#AE7DAC] mt-1 flex items-center gap-1">
              <Shield size={11} className="text-[#F1916D]" />
              For manual debugging and pre-signed tokens.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#AE7DAC] hover:text-[#F3DADF] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 bg-[#F1916D] hover:bg-[#F1916D]/90 text-[#03122F] font-bold px-5 py-2 rounded-xl text-xs transition shadow-md"
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
