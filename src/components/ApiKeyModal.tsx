import React, { useState, useEffect } from 'react';
import { X, Key, CheckCircle, ShieldAlert } from 'lucide-react';
import { setCustomApiKey } from '../services/featherless';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  highContrast: boolean;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  highContrast,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomApiKey(apiKeyInput);
    setStatusMessage('Custom session API key active.');
    setTimeout(() => {
      onClose();
      setStatusMessage(null);
    }, 1200);
  };

  const handleClear = () => {
    setApiKeyInput('');
    setCustomApiKey(null);
    setStatusMessage('Cleared. Using default bundled API key.');
    setTimeout(() => {
      onClose();
      setStatusMessage(null);
    }, 1200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="api-modal-title"
    >
      <div
        className={`w-full max-w-lg rounded-xl border p-6 shadow-2xl transition-all ${
          highContrast
            ? 'bg-black text-white border-white'
            : 'bg-white text-[#1a2b4a] border-[#ded7c5]'
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#ded7c5] dark:border-white/20">
          <div className="flex items-center gap-2.5">
            <Key className="w-5 h-5 text-[#0d9488] dark:text-yellow-400" />
            <h2 id="api-modal-title" className="text-xl font-bold">
              Custom Featherless API Key (Optional)
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close API Key dialog"
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="mt-4 text-sm text-[#4a5568] dark:text-white/90">
          The app works automatically out-of-the-box with free AI models bundled for judges. If you prefer to use your own personal Featherless API key, you can enter it below.
        </p>

        <div className="mt-3 p-3 rounded-lg bg-[#f0f4f9] dark:bg-white/10 text-xs flex items-start gap-2 border border-[#b7cde3] dark:border-white/30">
          <ShieldAlert className="w-4 h-4 shrink-0 text-[#1a2b4a] dark:text-yellow-400 mt-0.5" />
          <span>
            <strong>Privacy Note:</strong> Your key is kept only in browser memory for this session and is never logged or saved to disk.
          </span>
        </div>

        <form onSubmit={handleSave} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="featherless-key-input"
              className="block text-sm font-semibold mb-1"
            >
              Featherless API Key
            </label>
            <input
              id="featherless-key-input"
              type="password"
              placeholder="featherless-api-key-..."
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-lg border font-mono text-sm transition-all focus-visible:ring-4 ${
                highContrast
                  ? 'bg-black text-white border-white focus:border-yellow-400'
                  : 'bg-[#faf9f6] text-[#1a2b4a] border-[#ded7c5] focus:border-[#0d9488]'
              }`}
            />
          </div>

          {statusMessage && (
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle className="w-4 h-4" />
              <span>{statusMessage}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#ded7c5] dark:border-white/20">
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2 rounded-lg text-sm font-semibold border border-[#ded7c5] dark:border-white hover:bg-gray-100 dark:hover:bg-white/20 transition-colors"
            >
              Reset to Default
            </button>
            <button
              type="submit"
              className={`px-5 py-2 rounded-lg text-sm font-bold text-white transition-all shadow-sm ${
                highContrast
                  ? 'bg-black text-yellow-400 border-2 border-yellow-400 hover:bg-yellow-400 hover:text-black'
                  : 'bg-[#0d9488] hover:bg-[#0f766e]'
              }`}
            >
              Save for Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
