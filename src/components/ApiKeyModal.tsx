import React, { useState, useEffect } from 'react';
import { 
  X, 
  Key, 
  CheckCircle, 
  Sparkles, 
  Cpu, 
  Globe, 
  RefreshCw, 
  Search, 
  ExternalLink,
  Layers,
  ShieldCheck,
  Eye
} from 'lucide-react';
import { 
  PRESET_PROVIDERS, 
  DetectedModel,
  getActiveProviderId, 
  setActiveProviderId, 
  getProviderApiKey, 
  setProviderApiKey, 
  getProviderBaseUrl, 
  setProviderBaseUrl, 
  getActiveModel, 
  setActiveModel, 
  fetchModelsFromProvider 
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
  const [selectedProvider, setSelectedProvider] = useState<string>('featherless');
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [baseUrlInput, setBaseUrlInput] = useState<string>('');
  const [modelInput, setModelInput] = useState<string>('google/gemma-3-27b-it');
  const [modelSearchQuery, setModelSearchQuery] = useState<string>('');
  const [detectedModels, setDetectedModels] = useState<DetectedModel[]>([]);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const activeP = getActiveProviderId();
      setSelectedProvider(activeP);
      setApiKeyInput(getProviderApiKey(activeP));
      setBaseUrlInput(getProviderBaseUrl(activeP));
      setModelInput(getActiveModel());
      loadModels(activeP);
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

  const loadModels = async (providerId: string) => {
    setIsDetecting(true);
    try {
      const models = await fetchModelsFromProvider(providerId);
      setDetectedModels(models);
    } catch (e) {
      console.warn('Model fetch warning:', e);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleProviderChange = (newProviderId: string) => {
    setSelectedProvider(newProviderId);
    setApiKeyInput(getProviderApiKey(newProviderId));
    setBaseUrlInput(getProviderBaseUrl(newProviderId));

    const preset = PRESET_PROVIDERS.find((p) => p.id === newProviderId);
    if (preset) {
      setModelInput(preset.defaultModel);
    }
    loadModels(newProviderId);
  };

  const handleAutoDetect = async () => {
    setIsDetecting(true);
    // Save current settings first so client uses latest key
    setProviderApiKey(selectedProvider, apiKeyInput);
    setProviderBaseUrl(selectedProvider, baseUrlInput);
    
    try {
      const models = await fetchModelsFromProvider(selectedProvider);
      setDetectedModels(models);
      setStatusMessage(`Found ${models.length} models for ${selectedProvider}!`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (e: any) {
      setStatusMessage(`Model detection failed: ${e.message}`);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveProviderId(selectedProvider);
    setProviderApiKey(selectedProvider, apiKeyInput);
    setProviderBaseUrl(selectedProvider, baseUrlInput);
    setActiveModel(modelInput);

    setStatusMessage('Provider & model preferences saved!');
    setTimeout(() => {
      onClose();
      setStatusMessage(null);
    }, 1200);
  };

  const handleReset = () => {
    setSelectedProvider('default-engine');
    setActiveProviderId('default-engine');
    setApiKeyInput('');
    setBaseUrlInput('https://opencode.ai/zen/v1');
    setModelInput('hy3-free');
    setActiveModel('hy3-free');
    loadModels('default-engine');
    setStatusMessage('Reset to Zero-Setup Free Engine.');
    setTimeout(() => {
      onClose();
      setStatusMessage(null);
    }, 1200);
  };

  if (!isOpen) return null;

  const currentPreset = PRESET_PROVIDERS.find((p) => p.id === selectedProvider);
  const filteredModels = detectedModels.filter((m) =>
    m.id.toLowerCase().includes(modelSearchQuery.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="api-modal-title"
    >
      <div
        className={`w-full max-w-2xl rounded-2xl border p-5 sm:p-7 shadow-2xl transition-all max-h-[92vh] overflow-y-auto flex flex-col justify-between ${
          highContrast
            ? 'bg-black text-white border-white'
            : 'bg-white text-[#1a2b4a] border-[#ded7c5]'
        }`}
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-[#ded7c5] dark:border-white/20">
            <div className="flex items-center gap-2.5">
              <Layers className="w-5 h-5 text-[#0d9488] dark:text-yellow-400" />
              <h2 id="api-modal-title" className="text-xl font-bold">
                AI Provider &amp; Model Selection
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

          {/* Featherless AI Presenting Sponsor Hype Banner */}
          <div className="mt-4 p-3.5 rounded-xl border border-teal-200 dark:border-teal-500 bg-gradient-to-r from-teal-50/80 to-teal-100/40 dark:from-teal-950/50 dark:to-black text-[#115e59] dark:text-teal-200 flex items-start gap-3 shadow-xs">
            <Sparkles className="w-5 h-5 text-[#0d9488] dark:text-yellow-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[#0f766e] dark:text-white">
                  Featherless AI — Presenting Hackathon Sponsor
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0d9488] text-white">
                  Recommended
                </span>
              </div>
              <p className="text-xs text-[#134e4a] dark:text-teal-100/90 leading-relaxed">
                40,000+ open models with &lt;250ms cold starts. Every hackathon participant receives <strong>$25 in free Featherless credit</strong> to run vision models (like Gemma 3 27B) without token metering!
              </p>
              <a
                href="https://featherless.ai"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-bold underline hover:text-[#0f766e] dark:hover:text-yellow-300 pt-0.5"
              >
                <span>Visit featherless.ai</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <form onSubmit={handleSave} className="mt-5 space-y-4">
            {/* 1. Provider Picker */}
            <div>
              <label
                htmlFor="provider-select"
                className="block text-sm font-bold text-[#1a2b4a] dark:text-white mb-1.5"
              >
                Choose AI Provider
              </label>
              <select
                id="provider-select"
                value={selectedProvider}
                onChange={(e) => handleProviderChange(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-lg border text-sm font-semibold transition-all focus-visible:ring-4 ${
                  highContrast
                    ? 'bg-black text-white border-white focus:border-yellow-400'
                    : 'bg-[#faf9f6] text-[#1a2b4a] border-[#ded7c5] focus:border-[#0d9488]'
                }`}
              >
                {PRESET_PROVIDERS.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name} {provider.badge ? `[${provider.badge}]` : ''}
                  </option>
                ))}
              </select>
              {currentPreset && (
                <p className="text-xs text-[#718096] dark:text-white/70 mt-1">
                  {currentPreset.description}
                </p>
              )}
            </div>

            {/* 2. API Key Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="provider-key-input"
                  className="flex items-center gap-1.5 text-sm font-bold text-[#1a2b4a] dark:text-white"
                >
                  <Key className="w-4 h-4 text-[#0d9488] dark:text-yellow-400" />
                  <span>{selectedProvider === 'custom' ? 'API Key' : `${currentPreset?.name || 'Provider'} API Key`}</span>
                </label>
                {selectedProvider === 'default-engine' && (
                  <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Built-in (Zero credentials required)
                  </span>
                )}
              </div>
              <input
                id="provider-key-input"
                type="password"
                placeholder={
                  selectedProvider === 'featherless'
                    ? 'Paste your Featherless API key (sk-...)'
                    : selectedProvider === 'default-engine'
                    ? 'Default key active — or paste a custom override'
                    : 'Enter API key (sk-...)'
                }
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-lg border font-mono text-sm transition-all focus-visible:ring-4 ${
                  highContrast
                    ? 'bg-black text-white border-white focus:border-yellow-400'
                    : 'bg-[#faf9f6] text-[#1a2b4a] border-[#ded7c5] focus:border-[#0d9488]'
                }`}
              />
            </div>

            {/* 3. Base URL (Editable for custom/proxies) */}
            <div>
              <label
                htmlFor="provider-base-url"
                className="flex items-center gap-1.5 text-xs font-bold text-[#4a5568] dark:text-white/80 mb-1"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Base URL Endpoint</span>
              </label>
              <input
                id="provider-base-url"
                type="text"
                value={baseUrlInput}
                onChange={(e) => setBaseUrlInput(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border font-mono text-xs transition-all focus-visible:ring-4 ${
                  highContrast
                    ? 'bg-black text-white border-white'
                    : 'bg-[#faf9f6] text-[#1a2b4a] border-[#ded7c5]'
                }`}
              />
            </div>

            {/* 4. Model Selection & Auto-Detect */}
            <div className="pt-2 border-t border-[#ded7c5] dark:border-white/20">
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-1.5 text-sm font-bold text-[#1a2b4a] dark:text-white">
                  <Cpu className="w-4 h-4 text-[#0d9488] dark:text-yellow-400" />
                  <span>Model: <span className="font-mono text-xs font-normal text-[#0d9488] dark:text-yellow-300">{modelInput}</span></span>
                </label>

                <button
                  type="button"
                  onClick={handleAutoDetect}
                  disabled={isDetecting}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border border-[#0d9488] text-[#0d9488] dark:text-yellow-300 hover:bg-[#0d9488]/10 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isDetecting ? 'animate-spin' : ''}`} />
                  <span>{isDetecting ? 'Detecting...' : 'Auto-Detect Provider Models'}</span>
                </button>
              </div>

              {/* Searchable Filter for Models */}
              <div className="relative mb-2">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search detected models (e.g. gemma, vision, llama)..."
                  value={modelSearchQuery}
                  onChange={(e) => setModelSearchQuery(e.target.value)}
                  className={`w-full pl-9 pr-3 py-1.5 rounded-lg border text-xs transition-all ${
                    highContrast
                      ? 'bg-black text-white border-white'
                      : 'bg-[#faf9f6] text-[#1a2b4a] border-[#ded7c5]'
                  }`}
                />
              </div>

              {/* Scrollable Model Picker List */}
              <div className="max-h-36 overflow-y-auto rounded-lg border border-[#ded7c5] dark:border-white/20 p-1 space-y-1 bg-white dark:bg-black">
                {filteredModels.length === 0 ? (
                  <div className="py-3 text-center text-xs text-gray-500">
                    No models matching &quot;{modelSearchQuery}&quot;. You can type your model name directly below.
                  </div>
                ) : (
                  filteredModels.map((m) => {
                    const isSelected = modelInput === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setModelInput(m.id)}
                        className={`w-full px-2.5 py-1.5 rounded-md text-left text-xs flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-[#0d9488] text-white font-bold'
                            : 'hover:bg-gray-100 dark:hover:bg-white/10 text-[#1a2b4a] dark:text-white'
                        }`}
                      >
                        <span className="truncate max-w-[320px] sm:max-w-md font-mono">{m.id}</span>
                        {m.isVision && (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold flex items-center gap-1 ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-800 dark:bg-white/20 dark:text-white'
                          }`}>
                            <Eye className="w-3 h-3" />
                            <span>Vision</span>
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Custom Model Input Override */}
              <div className="mt-2">
                <input
                  type="text"
                  placeholder="Or enter any exact model ID (e.g. google/gemma-3-27b-it)"
                  value={modelInput}
                  onChange={(e) => setModelInput(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-lg border font-mono text-xs transition-all ${
                    highContrast
                      ? 'bg-black text-white border-white'
                      : 'bg-[#faf9f6] text-[#1a2b4a] border-[#ded7c5]'
                  }`}
                />
              </div>
            </div>

            {statusMessage && (
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <CheckCircle className="w-4 h-4" />
                <span>{statusMessage}</span>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-[#ded7c5] dark:border-white/20">
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                Reset Defaults
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-xs font-semibold border border-[#ded7c5] dark:border-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-lg text-xs font-bold text-white transition-all shadow-sm ${
                    highContrast
                      ? 'bg-black text-yellow-400 border-2 border-yellow-400 hover:bg-yellow-400 hover:text-black'
                      : 'bg-[#0d9488] hover:bg-[#0f766e]'
                  }`}
                >
                  Save &amp; Activate Provider
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
