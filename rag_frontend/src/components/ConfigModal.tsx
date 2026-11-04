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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="bg-black border-2 border-[#274D60] rounded-2xl w-full max-w-lg shadow-[0_0_40px_rgba(39,77,96,0.4)] p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8daec0] hover:text-white transition"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-black border border-[#274D60] text-[#8daec0] rounded-xl shadow-sm">
            <SettingsIcon size={22} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              System Settings
            </h2>
            <p className="text-xs text-[#8daec0]/70">Configure connection endpoints and development overrides</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Globe size={14} className="text-[#8daec0]" />
              <label className="text-xs font-medium text-[#8daec0]">
                Backend API Base URL
              </label>
            </div>
            <input
              type="url"
              required
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="http://localhost:8000"
              className="w-full bg-[#05080b] border border-[#274D60] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#366882] focus:ring-1 focus:ring-[#366882] transition"
            />
            <p className="text-[11px] text-[#8daec0]/60 mt-1 flex items-center gap-1">
              <Terminal size={11} className="text-[#274D60]" />
              Default backend service: http://localhost:8000
            </p>
          </div>

          <div className="pt-2 border-t border-[#274D60]/60">
            <div className="flex items-center gap-2 mb-1.5">
              <Key size={14} className="text-[#8daec0]" />
              <label className="text-xs font-medium text-[#8daec0]">
                Direct JWT Bearer Token (Optional)
              </label>
            </div>
            <textarea
              rows={2}
              value={testTokenInput}
              onChange={(e) => setTestTokenInput(e.target.value)}
              placeholder="eyJhbGciOi... (optional manual JWT token override)"
              className="w-full bg-[#05080b] border border-[#274D60] rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#366882] focus:ring-1 focus:ring-[#366882] transition resize-none"
            />
            <p className="text-[11px] text-[#8daec0]/60 mt-1 flex items-center gap-1">
              <Shield size={11} className="text-[#274D60]" />
              For manual debugging and pre-signed tokens.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#8daec0] hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 bg-[#274D60] hover:bg-[#366882] text-white px-5 py-2 rounded-xl text-xs font-medium border border-[#366882] shadow-sm transition"
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
