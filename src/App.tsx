import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Header } from './components/Header';
import { UploadScreen } from './components/UploadScreen';
import { ResultsScreen } from './components/ResultsScreen';
import { HistoryDrawer } from './components/HistoryDrawer';
import { TutorPanel } from './components/TutorPanel';
import { Onboarding } from './components/Onboarding';
import { ttsProvider } from './services/tts';
import { AnalysisRecord, SampleGraph } from './types';
import { analyzeViaServer, askTutorViaServer, enrichDescriptionViaServer } from './services/visionClient';
import { DiagramExplorer } from './accessibility/diagramExplorer';
import type { StructuredDiagram } from './types/diagram';
import { speechService } from './services/speech';
import { loadPrefs, savePrefs, updatePrefs } from './services/preferences';
import { friendlyError, emitStatus } from './services/statusBus';
import { buildFriendlyData, buildFriendlyStructure, extractNumericValues, formatStructuredList } from './utils/structuredText';
import { X } from 'lucide-react';

export const App: React.FC = () => {
  const [prefs, setPrefs] = useState(() => loadPrefs());
  const [highContrast, setHighContrast] = useState<boolean>(() => loadPrefs().highContrast || localStorage.getItem('echograph_high_contrast') === 'true');
  const [activeScreen, setActiveScreen] = useState<'upload' | 'results'>('upload');
  const [currentRecord, setCurrentRecord] = useState<AnalysisRecord | null>(null);
  const [structured, setStructured] = useState<StructuredDiagram | null>(null);
  const [conversation, setConversation] = useState<Array<{role:"user"|"assistant",content:string}>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [appStatus, setAppStatus] = useState("Ready");
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const assistantDialogRef = useRef<HTMLDialogElement>(null);

  const explorer = useMemo(()=> structured ? new DiagramExplorer(structured) : null, [structured]);

  useEffect(() => {
    if (highContrast) document.documentElement.classList.add('high-contrast','dark');
    else document.documentElement.classList.remove('high-contrast','dark');
    document.documentElement.dataset.theme = highContrast ? 'dark' : 'light';
    localStorage.setItem('echograph_high_contrast', String(highContrast));
    const cur = loadPrefs(); savePrefs({ ...cur, highContrast });
    setPrefs(loadPrefs());
  }, [highContrast]);

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', prefs.reducedMotion);
  }, [prefs.reducedMotion]);

  useEffect(() => {
    if (assistantOpen) assistantDialogRef.current?.showModal();
  }, [assistantOpen]);

  const handlePreferencesChange = (patch: Partial<typeof prefs>) => setPrefs(updatePrefs(patch));

  const handleAnalyze = async (imageDataUrl: string, fileName: string, sampleData?: SampleGraph) => {
    setIsLoading(true); setError(null); setLoadingStep('Analyzing diagram...'); emitStatus("analyzing"); setAppStatus("Analyzing diagram");
    try {
      const vision = await analyzeViaServer(imageDataUrl, prefs.language);
      const sd = vision.structured;
      const desc = {
        summary: (vision as unknown as {summary?:string}).summary || sd.summary || sd.title || 'Diagram analyzed',
        structure: (vision as unknown as {structure?:string}).structure || buildFriendlyStructure(sd),
        data: buildFriendlyData(sd),
        whyItMatters: (vision as unknown as {whyMatters?:string}).whyMatters || formatStructuredList(sd.important_findings, " ") || sd.summary || '',
        visualDetails: (vision as unknown as {visualDetails?:string}).visualDetails || formatStructuredList(sd.spatial_layout),
        rawText: vision.raw,
      };
      const numericValues = extractNumericValues(sd);
      const rec: AnalysisRecord = {
        id:`analysis-${Date.now()}`, timestamp: Date.now(), fileName, imageUrl: imageDataUrl,
        description: desc as AnalysisRecord["description"],
        verification: { isVerified: !sd.uncertain_elements?.length, uncertainty: sd.uncertain_elements?.length ? formatStructuredList(sd.uncertain_elements) : undefined, notes: sd.uncertain_elements?.length ? 'The vision model flagged details for review.' : 'The vision model reported no uncertain elements.' },
        extractedValues: numericValues.length ? numericValues : sampleData?.precomputedValues ?? [], modelUsed: vision.model, providerUsed: 'Mistral Vision',
        // @ts-ignore extra
        structured: sd,
      };
      setStructured(sd);
      setConversation([]);
      setCurrentRecord(rec);
      setHistory(prev=>[rec,...prev]);
      setActiveScreen('results');
      setAssistantOpen(false);
      emitStatus("ready-to-explore"); setAppStatus("Ready to explore");
      if (prefs.speechEnabled === "auto") setTimeout(()=> ttsProvider.speakText(`${desc.summary}. ${desc.structure}. ${desc.data}. ${desc.whyItMatters}`, { channel: "summary" }), 400);
      void enrichDescriptionViaServer(sd, prefs.language).then(enriched => {
        if (!Object.keys(enriched).length) return;
        setCurrentRecord(current => current?.id === rec.id ? { ...current, description: { ...current.description, ...enriched }, providerUsed: 'Mistral Vision + OpenCode tutor' } : current);
        setHistory(records => records.map(record => record.id === rec.id ? { ...record, description: { ...record.description, ...enriched }, providerUsed: 'Mistral Vision + OpenCode tutor' } : record));
      }).catch(error => console.warn('[EchoGraph] Background explanation skipped:', (error as Error).message));
    } catch(err) {
      const msg = friendlyError((err as Error).message || 'Analysis failed');
      setError(msg); emitStatus("error", msg); setAppStatus(msg);
      if (prefs.speechEnabled !== "off") setTimeout(()=> ttsProvider.speakText(msg), 200);
    } finally { setIsLoading(false); setLoadingStep(''); }
  };

  const handleAsk = async (q: string): Promise<string> => {
    if (!structured) throw new Error(friendlyError("No diagram loaded — upload a diagram first."));
    setConversation(prev=>[...prev, {role:"user",content:q}]);
    emitStatus("thinking"); setAppStatus("Thinking");
    try {
      const res = await askTutorViaServer({ structured, history: [...conversation, {role:"user",content:q}], question: q, level: prefs.explanationLevel, userLanguage: prefs.language });
      setConversation(prev=>[...prev, {role:"assistant",content: res.answer}]);
      emitStatus("speaking"); setAppStatus("Speaking");
      if (prefs.speechEnabled === "auto") ttsProvider.speakAssistant(res.answer).catch(()=>{});
      return res.answer;
    } catch(e) {
      const msg = friendlyError((e as Error).message);
      setConversation(prev=>[...prev, {role:"assistant",content: msg}]);
      emitStatus("error", msg); setAppStatus(msg);
      throw new Error(msg);
    }
  };
  // voice mic now only inside TutorPanel (assistant center modal), not homepage
  void ttsProvider;

  if (!prefs.onboardingDone) {
    return <Onboarding onDone={np => { savePrefs(np); setPrefs(np); setHighContrast(np.highContrast); }} />;
  }

  return (
    <div className="flex min-h-screen min-w-0 flex-col justify-between overflow-x-hidden">
      <Header highContrast={highContrast} onToggleHighContrast={()=>setHighContrast(v=>!v)} onOpenHistory={()=>setIsHistoryOpen(true)} historyCount={history.length}/>
      <div className="sr-only" aria-live="polite" role="status">{appStatus}{error? `: ${error}` : ""}</div>
      {error && <div role="alert" className="mx-auto w-full max-w-4xl min-w-0 px-4"><div className="break-words rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm text-base-content">{error}</div></div>}
      {activeScreen==='upload' || !currentRecord ? (
        <UploadScreen onAnalyze={handleAnalyze} isLoading={isLoading} loadingStep={loadingStep} error={error} highContrast={highContrast}/>
      ) : (
        <div className="mx-auto w-full max-w-4xl min-w-0 space-y-3 px-4">
          <ResultsScreen record={currentRecord} onNewGraph={()=>{speechService.stop(); ttsProvider.stop(); setActiveScreen('upload'); setError(null); setStructured(null); setConversation([]); emitStatus("ready"); setAppStatus("Ready");}} highContrast={highContrast}/>
          <div className="flex justify-center">
            <button onClick={()=> setAssistantOpen(v=>!v)} className="px-6 py-2.5 rounded-xl bg-[#0d9488] text-white text-sm font-bold shadow">{assistantOpen?"Hide Assistant":"Open Assistant"}</button>
          </div>
          {assistantOpen && structured && explorer && (
            <dialog ref={assistantDialogRef} aria-labelledby="assistant-title" onCancel={()=>setAssistantOpen(false)} className="modal bg-black/55 p-3 backdrop-blur-sm">
              <div className="modal-box flex h-[min(92dvh,860px)] w-full max-w-5xl min-w-0 flex-col overflow-hidden bg-base-100 p-0 text-base-content shadow-2xl">
                <div className="sticky top-0 z-30 flex shrink-0 items-center justify-between gap-2 border-b border-base-300 bg-base-100 px-3 py-2 sm:px-5 sm:py-3">
                  <div className="min-w-0"><p className="hidden text-xs font-bold uppercase tracking-[0.1em] text-primary min-[420px]:block sm:tracking-[0.14em]">Interactive learning</p><h2 id="assistant-title" className="break-words text-base font-bold sm:text-lg">Assistant — ask about this diagram</h2></div>
                  <button onClick={()=>setAssistantOpen(false)} className="btn btn-ghost btn-square shrink-0" aria-label="Close assistant"><X className="size-5" /></button>
                </div>
                <div className="min-h-0 flex-1 p-2 sm:p-4">
                  <TutorPanel explorer={explorer} history={conversation} onAsk={handleAsk} preferences={prefs} onPreferencesChange={handlePreferencesChange} highContrast={highContrast}/>
                </div>
              </div>
              <form method="dialog" className="modal-backdrop"><button onClick={()=>setAssistantOpen(false)}>Close assistant</button></form>
            </dialog>
          )}
        </div>
      )}
      <HistoryDrawer isOpen={isHistoryOpen} onClose={()=>setIsHistoryOpen(false)} history={history} onSelectRecord={r=>{speechService.stop(); setCurrentRecord(r); const s=(r as unknown as {structured?:StructuredDiagram}).structured; if(s){setStructured(s); setConversation([]);} setActiveScreen('results');}} onClearHistory={()=>setHistory([])} highContrast={highContrast}/>
    </div>
  );
};
export default App;
