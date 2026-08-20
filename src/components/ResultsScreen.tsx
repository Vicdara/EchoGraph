import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  Music, 
  Settings, 
  BookOpen, 
  Layers, 
  Activity, 
  HelpCircle 
} from 'lucide-react';
import { AnalysisRecord } from '../types';
import { speechService } from '../services/speech';
import { sonificationService } from '../services/sonification';

interface ResultsScreenProps {
  record: AnalysisRecord;
  onNewGraph: () => void;
  onOpenSettings: () => void;
  highContrast: boolean;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  record,
  onNewGraph,
  onOpenSettings,
  highContrast,
}) => {
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isPlayingTones, setIsPlayingTones] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const { description, verification, imageUrl, fileName, extractedValues } = record;

  // Track speech synthesizer state
  useEffect(() => {
    const unsubscribe = speechService.onStateChange((speaking) => {
      setIsSpeaking(speaking);
    });
    return () => {
      unsubscribe();
      speechService.stop();
    };
  }, []);

  const handleReplayAudio = () => {
    if (isSpeaking) {
      speechService.stop();
    } else {
      speechService.speakDescription(description);
    }
  };

  const handlePlaySonification = async () => {
    if (isPlayingTones) return;
    setIsPlayingTones(true);
    speechService.stop();
    
    const values = extractedValues && extractedValues.length > 0
      ? extractedValues
      : [20, 40, 70, 95, 80, 50, 20];

    try {
      await sonificationService.playDataCurve(values, 0.28);
    } catch (e) {
      console.error("Sonification error:", e);
    } finally {
      setIsPlayingTones(false);
    }
  };

  const handleCopyText = async () => {
    const fullText = `ECHOGRAPH ACCESSIBLE DESCRIPTION
Chart: ${fileName}

[SUMMARY]
${description.summary}

[STRUCTURE]
${description.structure}

[THE DATA]
${description.data}

[WHY IT MATTERS]
${description.whyItMatters}

[VERIFICATION STATUS]
${verification.isVerified ? 'Verified: Confirmed accurate against chart features.' : `Uncertainty noted: ${verification.uncertainty}`}
`;

    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy description text:', err);
    }
  };

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 sm:py-10 flex flex-col justify-between">
      <div className="space-y-8">
        {/* Screen 2 Top Bar: App name with "← New graph" link */}
        <div className="flex items-center justify-between pb-4 border-b border-[#ded7c5] dark:border-white/20">
          <div className="flex items-center gap-3">
            <button
              onClick={onNewGraph}
              className={`inline-flex items-center gap-2 text-base font-bold transition-colors focus-visible:ring-4 p-1.5 rounded-lg ${
                highContrast
                  ? 'text-white hover:text-yellow-400 underline'
                  : 'text-[#0d9488] hover:text-[#0f766e] hover:underline'
              }`}
              aria-label="Return to upload screen and analyze a new graph"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>← New graph</span>
            </button>
          </div>

          <span className="text-xs sm:text-sm font-semibold text-[#718096] dark:text-white/70">
            {fileName}
          </span>
        </div>

        {/* Screen Reader Live Announcement */}
        <div className="sr-only" aria-live="polite" role="status">
          Description ready. Summary: {description.summary}. Structure: {description.structure}. Data: {description.data}. Why it matters: {description.whyItMatters}.
        </div>

        {/* Top Content Row: Image Thumbnail & Verification Status Badge */}
        <div
          className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
            highContrast
              ? 'border-white bg-black'
              : 'border-[#ded7c5] bg-white shadow-xs'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-gray-100 dark:bg-black border border-[#ded7c5] dark:border-white/30 shrink-0 flex items-center justify-center p-1">
              <img
                src={imageUrl}
                alt="Thumbnail of uploaded chart"
                className="max-h-full max-w-full object-contain rounded-md"
              />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#718096] dark:text-white/70">
                Audited Visual Target
              </p>
              <h2 className="text-lg sm:text-xl font-bold text-[#1a2b4a] dark:text-white truncate max-w-xs sm:max-w-md">
                {fileName}
              </h2>
              <p className="text-xs text-[#718096] dark:text-white/60 mt-0.5">
                AI pass 1 generated • AI pass 2 verified
              </p>
            </div>
          </div>

          {/* Verification Status Badge (Real Confidence Check Result) */}
          <div className="self-start sm:self-center">
            {verification.isVerified ? (
              <div
                role="status"
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold shadow-xs ${
                  highContrast
                    ? 'bg-black text-[#00ff00] border-2 border-[#00ff00]'
                    : 'bg-[#f0fdfa] text-[#0f766e] border border-[#99f6e4]'
                }`}
              >
                <CheckCircle2 className="w-5 h-5 text-[#0d9488] dark:text-[#00ff00] shrink-0" />
                <div className="text-left">
                  <p className="leading-tight">✓ Verified</p>
                  <p className="text-[11px] font-normal opacity-90">
                    Checked against axes &amp; data points
                  </p>
                </div>
              </div>
            ) : (
              <div
                role="status"
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold shadow-xs ${
                  highContrast
                    ? 'bg-black text-[#ffff00] border-2 border-[#ffff00]'
                    : 'bg-amber-50 text-amber-900 border border-amber-300'
                }`}
              >
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-yellow-400 shrink-0" />
                <div className="text-left max-w-xs">
                  <p className="leading-tight">⚠ Uncertain about:</p>
                  <p className="text-[11px] font-normal">
                    {verification.uncertainty || 'Axis resolution or fine numbers'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Prominent teal "▶ Replay Audio" button */}
          <button
            onClick={handleReplayAudio}
            aria-label={isSpeaking ? "Pause spoken audio" : "Replay spoken audio description"}
            className={`inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-base font-bold text-white shadow-md transition-all transform active:scale-95 focus-visible:ring-4 ${
              highContrast
                ? 'bg-black text-[#ffff00] border-3 border-[#ffff00] hover:bg-[#ffff00] hover:text-black'
                : isSpeaking
                ? 'bg-[#115e59] ring-4 ring-[#5eead4]'
                : 'bg-[#0d9488] hover:bg-[#0f766e]'
            }`}
          >
            {isSpeaking ? (
              <>
                <VolumeX className="w-5 h-5 animate-pulse" />
                <span>Pause Audio</span>
              </>
            ) : (
              <>
                <Volume2 className="w-5 h-5" />
                <span>▶ Replay Audio</span>
              </>
            )}
          </button>

          {/* Sonification Button (Play data curve tones) */}
          <button
            onClick={handlePlaySonification}
            disabled={isPlayingTones}
            aria-label="Play sonification data tones"
            className={`inline-flex items-center gap-2 px-5 py-3.5 rounded-xl text-base font-bold border transition-all transform active:scale-95 focus-visible:ring-4 ${
              isPlayingTones
                ? 'bg-[#dde6f1] dark:bg-white/20 text-[#1a2b4a] dark:text-white'
                : highContrast
                ? 'bg-black text-white border-white hover:border-yellow-400'
                : 'bg-white text-[#1a2b4a] border-[#ded7c5] hover:bg-[#f0f4f9]'
            }`}
          >
            <Music className={`w-5 h-5 ${isPlayingTones ? 'text-[#0d9488] animate-bounce' : 'text-[#4e84b8]'}`} />
            <span>{isPlayingTones ? 'Playing Tones...' : '🎵 Play Data Tones'}</span>
          </button>

          {/* Secondary text button "Copy as Text" */}
          <button
            onClick={handleCopyText}
            aria-label="Copy full text description to clipboard"
            className={`inline-flex items-center gap-2 px-5 py-3.5 rounded-xl text-base font-semibold border transition-all focus-visible:ring-4 ${
              copied
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-400'
                : highContrast
                ? 'bg-black text-white border-white hover:bg-white/20'
                : 'bg-[#faf9f6] text-[#1a2b4a] border-[#ded7c5] hover:bg-[#ede9df]'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-5 h-5 text-[#718096] dark:text-white" />
                <span>Copy as Text</span>
              </>
            )}
          </button>
        </div>

        {/* 4 Structured Description Sections */}
        <div className="space-y-5">
          {/* Section 1: Summary */}
          <section
            className={`p-6 rounded-2xl border transition-all ${
              highContrast
                ? 'border-white bg-black text-white'
                : 'border-[#ded7c5] bg-white shadow-xs'
            }`}
          >
            <div className="flex items-center gap-2.5 mb-2 pb-2 border-b border-[#ded7c5]/60 dark:border-white/20">
              <BookOpen className="w-5 h-5 text-[#0d9488] dark:text-yellow-400" />
              <h3 className="text-lg font-bold text-[#1a2b4a] dark:text-white">
                Summary
              </h3>
            </div>
            <p className="text-base sm:text-lg leading-relaxed text-[#1a2b4a] dark:text-white font-medium">
              {description.summary}
            </p>
          </section>

          {/* Section 2: Structure */}
          <section
            className={`p-6 rounded-2xl border transition-all ${
              highContrast
                ? 'border-white bg-black text-white'
                : 'border-[#ded7c5] bg-white shadow-xs'
            }`}
          >
            <div className="flex items-center gap-2.5 mb-2 pb-2 border-b border-[#ded7c5]/60 dark:border-white/20">
              <Layers className="w-5 h-5 text-[#0d9488] dark:text-yellow-400" />
              <h3 className="text-lg font-bold text-[#1a2b4a] dark:text-white">
                Structure
              </h3>
            </div>
            <p className="text-base leading-relaxed text-[#2d3748] dark:text-white/90 whitespace-pre-line">
              {description.structure}
            </p>
          </section>

          {/* Section 3: The Data */}
          <section
            className={`p-6 rounded-2xl border transition-all ${
              highContrast
                ? 'border-white bg-black text-white'
                : 'border-[#ded7c5] bg-white shadow-xs'
            }`}
          >
            <div className="flex items-center gap-2.5 mb-2 pb-2 border-b border-[#ded7c5]/60 dark:border-white/20">
              <Activity className="w-5 h-5 text-[#0d9488] dark:text-yellow-400" />
              <h3 className="text-lg font-bold text-[#1a2b4a] dark:text-white">
                The Data
              </h3>
            </div>
            <p className="text-base leading-relaxed text-[#2d3748] dark:text-white/90 whitespace-pre-line">
              {description.data}
            </p>
          </section>

          {/* Section 4: Why It Matters */}
          <section
            className={`p-6 rounded-2xl border transition-all ${
              highContrast
                ? 'border-white bg-black text-white'
                : 'border-[#ded7c5] bg-white shadow-xs'
            }`}
          >
            <div className="flex items-center gap-2.5 mb-2 pb-2 border-b border-[#ded7c5]/60 dark:border-white/20">
              <HelpCircle className="w-5 h-5 text-[#0d9488] dark:text-yellow-400" />
              <h3 className="text-lg font-bold text-[#1a2b4a] dark:text-white">
                Why It Matters
              </h3>
            </div>
            <p className="text-base leading-relaxed text-[#2d3748] dark:text-white/90 font-medium">
              {description.whyItMatters}
            </p>
          </section>
        </div>
      </div>

      {/* Screen 2 Footer: Matching Screen 1 */}
      <footer className="mt-12 pt-6 border-t border-[#ded7c5] dark:border-white/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#718096] dark:text-white/70">
        <p>Powered by free AI models — no API key required</p>
        <button
          onClick={onOpenSettings}
          aria-label="Use your own API key (optional)"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1a2b4a] dark:text-white hover:underline focus-visible:ring-4 p-1 rounded"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Use your own API key (optional)</span>
        </button>
      </footer>
    </div>
  );
};
