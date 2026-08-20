import React, { useState, useRef, useEffect, useCallback } from 'react';
import { UploadCloud, Image as ImageIcon, Settings, AlertCircle, Loader2, Sparkles, X, FileQuestion } from 'lucide-react';
import { SAMPLE_GRAPHS } from '../data/sampleGraphs';
import { SampleGraph } from '../types';

interface UploadScreenProps {
  onAnalyze: (imageDataUrl: string, fileName: string, sampleData?: SampleGraph) => void;
  isLoading: boolean;
  loadingStep: string;
  error: string | null;
  onOpenSettings: () => void;
  highContrast: boolean;
}

export const UploadScreen: React.FC<UploadScreenProps> = ({
  onAnalyze,
  isLoading,
  loadingStep,
  error,
  onOpenSettings,
  highContrast,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [selectedSample, setSelectedSample] = useState<SampleGraph | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [pasteNotice, setPasteNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Global clipboard paste listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (isLoading) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processFile(file, `clipboard-image-${Date.now()}.${file.type.split('/')[1] || 'png'}`);
            setPasteNotice('Image pasted from clipboard!');
            setTimeout(() => setPasteNotice(null), 3000);
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isLoading]);

  const processFile = (file: File, customName?: string) => {
    // Check file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      alert('Image size exceeds 20MB limit. Please choose a smaller image.');
      return;
    }

    const name = customName || file.name;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setSelectedImage(dataUrl);
        setFileName(name);
        setSelectedSample(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        processFile(file);
      } else {
        alert('Please drop an image file (PNG, JPG, WebP, SVG).');
      }
    }
  }, []);

  const handleSelectSample = (sample: SampleGraph) => {
    setSelectedImage(sample.imageUrl);
    setFileName(sample.title);
    setSelectedSample(sample);
  };

  const handleClearSelected = () => {
    setSelectedImage(null);
    setFileName('');
    setSelectedSample(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = () => {
    if (!selectedImage || isLoading) return;
    onAnalyze(selectedImage, fileName || 'Chart Image', selectedSample || undefined);
  };

  return (
    <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col justify-between">
      <div className="space-y-8">
        {/* Error Alert if any */}
        {error && (
          <div
            role="alert"
            className="p-4 rounded-xl border border-red-300 dark:border-red-500 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200 flex items-start gap-3 shadow-sm"
          >
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Analysis Issue</p>
              <p className="text-sm mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Paste notification toast */}
        {pasteNotice && (
          <div
            role="status"
            aria-live="polite"
            className="p-3 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-300 dark:border-teal-500 text-teal-900 dark:text-teal-200 text-sm font-semibold flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-300" />
            <span>{pasteNotice}</span>
          </div>
        )}

        {/* Screen Reader Live Region for loading status */}
        <div className="sr-only" aria-live="assertive" role="status">
          {isLoading ? `Analyzing graph image: ${loadingStep}` : ''}
        </div>

        {/* Main Upload Dropzone */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp, image/svg+xml, image/gif"
            onChange={handleFileInputChange}
            className="hidden"
            id="chart-file-input"
            aria-label="Upload chart or graph image"
          />

          {!selectedImage ? (
            <div
              ref={dropZoneRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              tabIndex={0}
              role="button"
              aria-label="Drag a chart or graph here, or click to upload. Press enter to browse files."
              className={`w-full min-h-[260px] sm:min-h-[300px] border-3 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 focus-visible:ring-4 ${
                isDragOver
                  ? 'border-[#0d9488] bg-[#0d9488]/10 scale-[1.01]'
                  : highContrast
                  ? 'border-white bg-black hover:border-yellow-400'
                  : 'border-[#4e84b8]/40 bg-white hover:border-[#0d9488] hover:bg-[#f0fdfa]/40 shadow-xs'
              }`}
            >
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform ${
                  highContrast
                    ? 'bg-white text-black'
                    : 'bg-[#f0f4f9] text-[#1a2b4a]'
                }`}
              >
                <UploadCloud className="w-8 h-8" />
              </div>

              <p className="text-lg sm:text-xl font-bold text-[#1a2b4a] dark:text-white">
                Drag a chart or graph here, or click to upload
              </p>

              <p className="text-sm font-semibold text-[#4a5568] dark:text-white/80 mt-2">
                or paste from clipboard <kbd className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-white/20 rounded border border-gray-300 dark:border-white/30 font-mono">Ctrl+V</kbd>
              </p>

              <p className="text-xs text-[#718096] dark:text-white/60 mt-4">
                Supports textbook photos, AP worksheets, bar/line/pie charts, scientific diagrams (PNG, JPG, SVG, WebP up to 20MB)
              </p>
            </div>
          ) : (
            <div
              className={`w-full border-2 rounded-2xl p-6 transition-all ${
                highContrast
                  ? 'border-white bg-black'
                  : 'border-[#ded7c5] bg-white shadow-md'
              }`}
            >
              <div className="flex items-center justify-between pb-4 border-b border-[#ded7c5] dark:border-white/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#f0f4f9] dark:bg-white/10 text-[#1a2b4a] dark:text-white">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-base text-[#1a2b4a] dark:text-white truncate max-w-xs sm:max-w-md">
                      {fileName || 'Selected Chart Image'}
                    </p>
                    <p className="text-xs text-[#718096] dark:text-white/70">
                      Ready for accessibility description
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleClearSelected}
                  disabled={isLoading}
                  aria-label="Remove selected image"
                  className="p-2 rounded-lg text-[#718096] hover:text-[#1a2b4a] dark:text-white/70 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/20 transition-colors focus-visible:ring-4"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Image Preview Container */}
              <div className="mt-4 flex flex-col sm:flex-row items-center gap-6">
                <div className="w-full sm:w-64 h-48 rounded-xl overflow-hidden bg-gray-50 dark:bg-black border border-[#ded7c5] dark:border-white/30 flex items-center justify-center p-2">
                  <img
                    src={selectedImage}
                    alt="Preview of uploaded chart"
                    className="max-h-full max-w-full object-contain rounded-md"
                  />
                </div>

                <div className="flex-1 space-y-2 text-sm text-[#4a5568] dark:text-white/90">
                  <p className="font-semibold text-base text-[#1a2b4a] dark:text-white">
                    What happens next:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Visual recognition identifies axes, trends, and data points.</li>
                    <li>AI runs a <strong>self-verification check</strong> against the original figure.</li>
                    <li>Spoken audio begins automatically for screen readers &amp; headphones.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Primary Action Button: "Describe This Graph" */}
        <div className="flex flex-col items-center">
          <button
            onClick={handleSubmit}
            disabled={!selectedImage || isLoading}
            aria-label={isLoading ? `Analyzing image: ${loadingStep}` : 'Describe This Graph'}
            className={`w-full sm:w-auto min-w-[280px] px-8 py-4 rounded-xl text-lg font-bold text-white shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-3 focus-visible:ring-4 ${
              !selectedImage || isLoading
                ? 'opacity-50 cursor-not-allowed bg-gray-400 dark:bg-gray-700'
                : highContrast
                ? 'bg-black text-[#ffff00] border-3 border-[#ffff00] hover:bg-[#ffff00] hover:text-black'
                : 'bg-[#0d9488] hover:bg-[#0f766e] hover:shadow-teal-900/20'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>{loadingStep || 'Analyzing Graph...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6" />
                <span>Describe This Graph</span>
              </>
            )}
          </button>
        </div>

        {/* 1-Click Sample Charts for Quick Judge / Student Testing */}
        <section
          aria-labelledby="sample-charts-heading"
          className={`p-6 rounded-2xl border transition-all ${
            highContrast
              ? 'border-white/40 bg-black'
              : 'border-[#ded7c5] bg-[#ffffff] shadow-xs'
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <FileQuestion className="w-5 h-5 text-[#0d9488] dark:text-yellow-400" />
            <h2 id="sample-charts-heading" className="text-base font-bold text-[#1a2b4a] dark:text-white">
              Try with Real AP Biology Sample Graphs (1-Click Demo)
            </h2>
          </div>
          <p className="text-xs text-[#4a5568] dark:text-white/80 mb-4">
            Select any real test chart below to test the AI vision description &amp; confidence verification:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SAMPLE_GRAPHS.map((sample) => {
              const isSelected = selectedSample?.id === sample.id;
              return (
                <button
                  key={sample.id}
                  onClick={() => handleSelectSample(sample)}
                  disabled={isLoading}
                  className={`p-3 rounded-xl text-left border text-sm transition-all focus-visible:ring-4 flex flex-col justify-between ${
                    isSelected
                      ? highContrast
                        ? 'border-yellow-400 bg-yellow-400/20 text-white'
                        : 'border-[#0d9488] bg-[#f0fdfa] text-[#1a2b4a] ring-2 ring-[#0d9488]'
                      : highContrast
                      ? 'border-white/40 bg-black hover:border-white text-white'
                      : 'border-[#e2dcd0] bg-[#faf9f6] hover:border-[#0d9488] text-[#1a2b4a]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#dde6f1] dark:bg-white/20 text-[#1a2b4a] dark:text-white">
                      {sample.type}
                    </span>
                    <span className="text-xs text-[#718096] dark:text-white/70">
                      {sample.category}
                    </span>
                  </div>
                  <p className="font-bold text-sm text-[#1a2b4a] dark:text-white line-clamp-1">
                    {sample.title}
                  </p>
                  <p className="text-xs text-[#718096] dark:text-white/80 line-clamp-2 mt-1">
                    {sample.description}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* Screen 1 Footer: Small text, left-aligned, with gear icon */}
      <footer className="mt-12 pt-6 border-t border-[#ded7c5] dark:border-white/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#718096] dark:text-white/70">
        <p>Powered by free AI models — works instantly, no setup needed</p>
        <button
          onClick={onOpenSettings}
          aria-label="Use your own API key (optional)"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1a2b4a] dark:text-white hover:underline focus-visible:ring-4 p-1 rounded"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Use your own API key (optional)</span>
        </button>
      </footer>
    </main>
  );
};
