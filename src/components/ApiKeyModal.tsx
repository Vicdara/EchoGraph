import React, { useState, useEffect } from 'react';
import { X, Key, CheckCircle, ShieldAlert, Cpu, Globe } from 'lucide-react';
import { 
  AVAILABLE_MODELS, 
  setCustomApiKey, 
  setCustomBaseUrl, 
  setSelectedModel, 
  getSelectedModel, 
  getEffectiveBaseUrl 
} from '../services/aiVision';

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
  const [baseUrlInput, setBaseUrlInput] = useState('');
  const [currentModel, setCurrentModel] = useState<string>('hy3-free');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentModel(getSelectedModel());
      setBaseUrlInput(getEffectiveBaseUrl());
      const savedKey = localStorage.getItem('echograph_custom_api_key');
      if (savedKey) {
        setApiKeyInput(savedKey);
      }
    }
  }, [isOpen]);

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
    setCustomBaseUrl(baseUrlInput);
    setSelectedModel(currentModel);
    setStatusMessage('Settings updated successfully!');
    setTimeout(() => {
      onClose();
      setStatusMessage(null);
    }, 1200);
  };

  const handleClear = () => {
    setApiKeyInput('');
    setCustomApiKey(null);
    setCustomBaseUrl(null);
    setSelectedModel('hy3-free');
    setCurrentModel('hy3-free');
    setBaseUrlInput('https://opencode.ai/zen/v1');
    setStatusMessage('Reset to OpenCode Free Models & Default Key.');
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
        className={`w-full max-w-xl rounded-2xl border p-6 sm:p-7 shadow-2xl transition-all max-h-[90vh] overflow-y-auto ${
          highContrast
            ? 'bg-black text-white border-white'
            : 'bg-white text-[#1a2b4a] border-[#ded7c5]'
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#ded7c5] dark:border-white/20">
          <div className="flex items-center gap-2.5">
            <Key className="w-5 h-5 text-[#0d9488] dark:text-yellow-400" />
            <h2 id="api-modal-title" className="text-xl font-bold">
              AI Model &amp; API Key Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close settings dialog"
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="mt-4 text-sm text-[#4a5568] dark:text-white/90">
          EchoGraph connects to <strong>OpenCode Zen</strong> free models. You can select your preferred free vision model or provide your own API key.
        </p>

        <form onSubmit={handleSave} className="mt-5 space-y-5">
          {/* Model Selection Dropdown */}
          <div>
            <label
              htmlFor="model-selection"
              className="flex items-center gap-2 text-sm font-bold mb-1.5"
            >
              <Cpu className="w-4 h-4 text-[#0d9488] dark:text-yellow-400" />
              <span>Select Vision Model</span>
            </label>
            <select
              id="model-selection"
              value={currentModel}
              onChange={(e) => setCurrentModel(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-lg border text-sm font-medium transition-all focus-visible:ring-4 ${
                highContrast
                  ? 'bg-black text-white border-white focus:border-yellow-400'
                  : 'bg-[#faf9f6] text-[#1a2b4a] border-[#ded7c5] focus:border-[#0d9488]'
              }`}
            >
              {AVAILABLE_MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} {model.isFree ? '— [FREE]' : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-[#718096] dark:text-white/70 mt-1">
              All free models include automatic multi-model fallback in case of rate limits.
            </p>
          </div>

          {/* API Key Input */}
          <div>
            <label
              htmlFor="opencode-key-input"
              className="flex items-center gap-2 text-sm font-bold mb-1.5"
            >
              <Key className="w-4 h-4 text-[#0d9488] dark:text-yellow-400" />
              <span>OpenCode / OpenAI-Compatible API Key (Optional)</span>
            </label>
            <input
              id="opencode-key-input"
              type="password"
              placeholder="sk-... (Leave empty to use free built-in OpenCode keys)"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-lg border font-mono text-sm transition-all focus-visible:ring-4 ${
                highContrast
                  ? 'bg-black text-white border-white focus:border-yellow-400'
                  : 'bg-[#faf9f6] text-[#1a2b4a] border-[#ded7c5] focus:border-[#0d9488]'
              }`}
            />
          </div>

          {/* Base URL (Optional) */}
          <div>
            <label
              htmlFor="base-url-input"
              className="flex items-center gap-2 text-sm font-bold mb-1.5"
            >
              <Globe className="w-4 h-4 text-[#0d9488] dark:text-yellow-400" />
              <span>API Base URL</span>
            </label>
            <input
              id="base-url-input"
              type="text"
              placeholder="https://opencode.ai/zen/v1"
              value={baseUrlInput}
              onChange={(e) => setBaseUrlInput(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-lg border font-mono text-xs transition-all focus-visible:ring-4 ${
                highContrast
                  ? 'bg-black text-white border-white focus:border-yellow-400'
                  : 'bg-[#faf9f6] text-[#1a2b4a] border-[#ded7c5] focus:border-[#0d9488]'
              }`}
            />
          </div>

          <div className="p-3 rounded-lg bg-[#f0f4f9] dark:bg-white/10 text-xs flex items-start gap-2 border border-[#b7cde3] dark:border-white/30">
            <ShieldAlert className="w-4 h-4 shrink-0 text-[#1a2b4a] dark:text-yellow-400 mt-0.5" />
            <span>
              <strong>Built-in Keys:</strong> Default configured with OpenCode Zen free models (`hy3-free`, `mimo-v2.5-free`, `muse-spark-1.2`, `nemotron-3-ultra-free`, `deepseek-v4-flash-free`).
            </span>
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
              Reset to Free Defaults
            </button>
            <button
              type="submit"
              className={`px-5 py-2 rounded-lg text-sm font-bold text-white transition-all shadow-sm ${
                highContrast
                  ? 'bg-black text-yellow-400 border-2 border-yellow-400 hover:bg-yellow-400 hover:text-black'
                  : 'bg-[#0d9488] hover:bg-[#0f766e]'
              }`}
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
