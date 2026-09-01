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
  BookOpen, 
  Layers, 
  Activity, 
  HelpCircle 
} from 'lucide-react';
import { AnalysisRecord } from '../types';
import { speechService } from '../services/speech';
import { ttsProvider } from '../services/tts';
import { sonificationService } from '../services/sonification';
import type { StructuredDiagram } from '../types/diagram';
import { buildFriendlyStructure } from '../utils/structuredText';

interface ResultsScreenProps {
  record: AnalysisRecord;
  onNewGraph: () => void;
  highContrast: boolean;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  record,
  onNewGraph,
  highContrast,
}) => {
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isPlayingTones, setIsPlayingTones] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [descriptionTab, setDescriptionTab] = useState<"explanation" | "visual">("explanation");

  const { description, verification, imageUrl, fileName, extractedValues } = record;
  const storedDiagram = (record as AnalysisRecord & { structured?: StructuredDiagram }).structured;
  const structureLooksRaw = /(?:^|\|)\s*(?:Level|Element|Type|Position|Description):/i.test(description.structure);
  const friendlyStructure = structureLooksRaw && storedDiagram ? buildFriendlyStructure(storedDiagram) : description.structure;
  const visualDetails = description.visualDetails || (structureLooksRaw ? description.structure : 'No additional visual metadata was returned for this image.');
  const hasSonificationData = Boolean(extractedValues?.length);

  // Track speech state from both Web Speech and Voxtral audio
  useEffect(() => {
    const unsub = speechService.onStateChange(s=> setIsSpeaking(s));
    const onStart = ()=> setIsSpeaking(true);
    const onEnd = ()=> setIsSpeaking(false);
    // ttsProvider audio element emits via speechService already for Voxtral fallback, but poll also
    const id = setInterval(()=> {
      const speaking = speechService.getIsSpeaking() || ttsProvider.isSpeaking();
      setIsSpeaking(prev=> prev!==speaking ? speaking : prev);
    }, 300);
    window.addEventListener("tts-start", onStart);
    window.addEventListener("tts-end", onEnd);
    return () => { unsub(); clearInterval(id); window.removeEventListener("tts-start", onStart); window.removeEventListener("tts-end", onEnd); speechService.stop(); ttsProvider.stop(); };
  }, []);

  const handleReplayAudio = async () => {
    if (isSpeaking) {
      ttsProvider.stop();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    try {
      await ttsProvider.speakDescription({ ...description, structure: friendlyStructure }, { channel: "summary", force: true });
    } finally { setIsSpeaking(false); }
  };

  const handlePlaySonification = async () => {
    if (isPlayingTones || !extractedValues?.length) return;
    setIsPlayingTones(true);
    speechService.stop();
    
    try {
      await sonificationService.playDataCurve(extractedValues, 0.28);
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
${friendlyStructure}

[THE DATA]
${description.data}

[WHY IT MATTERS]
${description.whyItMatters}

[VERIFICATION STATUS]
${verification.isVerified ? 'Uncertainty check: The vision model reported no uncertain elements.' : `Review recommended: ${verification.uncertainty}`}
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
    <div className="mx-auto flex w-full max-w-4xl min-w-0 flex-1 flex-col justify-between overflow-x-hidden px-4 py-6 sm:py-10">
      <div className="space-y-8">
        {/* Screen 2 Top Bar */}
        <div className="flex min-w-0 items-center justify-between gap-3 border-b border-[#ded7c5] pb-4 dark:border-white/20">
          <div className="flex items-center gap-3">
            <button
              onClick={onNewGraph}
              className={`btn btn-ghost btn-sm group gap-2 transition-transform motion-safe:hover:-translate-x-0.5 ${
                highContrast
                  ? 'text-white hover:text-warning'
                  : 'text-primary'
              }`}
              aria-label="Return to upload screen and analyze a new graph"
            >
              <ArrowLeft className="size-5 transition-transform motion-safe:group-hover:-translate-x-1" />
              <span>New graph</span>
            </button>
          </div>

          <span className="min-w-0 flex-1 break-all text-right text-xs font-semibold text-[#718096] dark:text-white/70 sm:text-sm">
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
          <div className="flex w-full min-w-0 items-center gap-3 sm:w-auto sm:gap-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-gray-100 dark:bg-black border border-[#ded7c5] dark:border-white/30 shrink-0 flex items-center justify-center p-1">
              <img
                src={imageUrl}
                alt="Thumbnail of uploaded chart"
                className="max-h-full max-w-full object-contain rounded-md"
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wider text-[#718096] dark:text-white/70">
                Audited Visual Target
              </p>
              <h2 className="break-all text-lg font-bold text-[#1a2b4a] dark:text-white sm:text-xl">
                {fileName}
              </h2>
              <p className="mt-0.5 break-words text-xs text-[#718096] dark:text-white/60 [overflow-wrap:anywhere]">
                Analyzed {record.providerUsed ? `with ${record.providerUsed}` : ''} {record.modelUsed ? `(${record.modelUsed})` : ''}
              </p>
            </div>
          </div>

          {/* Verification Status Badge (Real Confidence Check Result) */}
          <div className="w-full min-w-0 self-start sm:w-auto sm:self-center">
            {verification.isVerified ? (
              <div
                role="status"
                className={`alert group w-full min-w-0 gap-3 px-4 py-3 text-sm shadow-sm transition motion-safe:hover:-translate-y-0.5 hover:shadow-md sm:min-w-52 ${
                  highContrast
                    ? 'bg-black text-[#00ff00] border-2 border-[#00ff00]'
                    : 'alert-success alert-soft'
                }`}
              >
                <CheckCircle2 className="size-6 shrink-0 transition-transform motion-safe:group-hover:scale-110 motion-safe:group-hover:rotate-6" />
                <div className="text-left">
                  <p className="font-bold leading-tight">No uncertainty flagged</p>
                  <p className="mt-0.5 text-xs font-normal opacity-80">
                    Model output contains no marked uncertain details
                  </p>
                </div>
              </div>
            ) : (
              <div
                role="status"
                className={`alert group w-full min-w-0 gap-3 px-4 py-3 text-sm shadow-sm transition motion-safe:hover:-translate-y-0.5 hover:shadow-md sm:min-w-52 ${
                  highContrast
                    ? 'bg-black text-[#ffff00] border-2 border-[#ffff00]'
                    : 'alert-warning alert-soft'
                }`}
              >
                <AlertTriangle className="size-6 shrink-0 transition-transform motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-6" />
                <div className="text-left max-w-xs">
                  <p className="font-bold leading-tight">Review recommended</p>
                  <p className="mt-0.5 text-xs font-normal opacity-80">
                    {verification.uncertainty || 'Axis resolution or fine numbers'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          {/* Prominent teal "▶ Replay Audio" button */}
          <button
            onClick={handleReplayAudio}
            aria-label={isSpeaking ? "Pause spoken audio" : "Replay spoken audio description"}
            className={`inline-flex w-full min-w-0 items-center justify-center gap-2.5 rounded-xl px-4 py-3.5 text-base font-bold text-white shadow-md transition-all transform active:scale-95 focus-visible:ring-4 sm:w-auto sm:px-6 ${
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
            disabled={isPlayingTones || !hasSonificationData}
            aria-label={hasSonificationData ? "Play sonification data tones" : "Data tones unavailable because no numeric values were detected"}
            className={`inline-flex w-full min-w-0 items-center justify-center gap-2 rounded-xl border px-4 py-3.5 text-base font-bold transition-all transform active:scale-95 focus-visible:ring-4 sm:w-auto sm:px-5 ${
              isPlayingTones
                ? 'bg-[#dde6f1] dark:bg-white/20 text-[#1a2b4a] dark:text-white'
                : highContrast
                ? 'bg-black text-white border-white hover:border-yellow-400'
                : 'bg-white text-[#1a2b4a] border-[#ded7c5] hover:bg-[#f0f4f9]'
            }`}
          >
            <Music className={`w-5 h-5 ${isPlayingTones ? 'text-[#0d9488] animate-bounce' : 'text-[#4e84b8]'}`} />
            <span>{isPlayingTones ? 'Playing tones...' : hasSonificationData ? 'Play data tones' : 'No numeric data to play'}</span>
          </button>

          {/* Secondary text button "Copy as Text" */}
          <button
            onClick={handleCopyText}
            aria-label="Copy full text description to clipboard"
            className={`inline-flex w-full min-w-0 items-center justify-center gap-2 rounded-xl border px-4 py-3.5 text-base font-semibold transition-all focus-visible:ring-4 sm:w-auto sm:px-5 ${
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

        <div role="tablist" aria-label="Description view" className="tabs tabs-box grid w-full grid-cols-2 sm:w-fit">
          <button role="tab" aria-selected={descriptionTab === "explanation"} onClick={() => setDescriptionTab("explanation")} className={`tab min-w-0 gap-1 px-2 sm:gap-2 sm:px-4 ${descriptionTab === "explanation" ? "tab-active" : ""}`}><BookOpen className="size-4 shrink-0" />Explanation</button>
          <button role="tab" aria-selected={descriptionTab === "visual"} onClick={() => setDescriptionTab("visual")} className={`tab min-w-0 gap-1 px-2 sm:gap-2 sm:px-4 ${descriptionTab === "visual" ? "tab-active" : ""}`}><Layers className="size-4 shrink-0" />Visual details</button>
        </div>

        {descriptionTab === "explanation" ? <div className="space-y-5">
          {/* Section 1: Summary */}
          <section
            className={`break-words rounded-2xl border p-4 transition-all [overflow-wrap:anywhere] sm:p-6 ${
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
            className={`break-words rounded-2xl border p-4 transition-all [overflow-wrap:anywhere] sm:p-6 ${
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
              {friendlyStructure}
            </p>
          </section>

          {/* Section 3: The Data */}
          <section
            className={`break-words rounded-2xl border p-4 transition-all [overflow-wrap:anywhere] sm:p-6 ${
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
            className={`break-words rounded-2xl border p-4 transition-all [overflow-wrap:anywhere] sm:p-6 ${
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
        </div> : <section className={`min-w-0 rounded-2xl border p-4 sm:p-6 ${highContrast ? 'border-white bg-black text-white' : 'border-base-300 bg-base-100 shadow-xs'}`}>
          <div className="mb-3 flex min-w-0 items-start gap-2.5 border-b border-base-300 pb-3"><Layers className="size-5 shrink-0 text-primary" /><div className="min-w-0"><h3 className="text-lg font-bold">Exact visual details</h3><p className="text-xs text-base-content/60">Positions, colors, shapes, labels, and connections detected in the image.</p></div></div>
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-base-content/80 [overflow-wrap:anywhere]">{visualDetails}</p>
        </section>}
      </div>

      <footer className="mt-12 border-t border-base-300 pt-6 text-xs text-base-content/60">Powered by hosted AI services - judges do not need an API key.</footer>
    </div>
  );
};
