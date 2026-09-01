import React, { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, ChevronLeft, ChevronRight, CircleStop, Gauge, HelpCircle, Tags, Loader2, MessageCircleQuestion, Play, RotateCcw, Send, Sparkles, Volume2 } from "lucide-react";
import { matchVoiceIntent } from "../accessibility/commands";
import { DiagramExplorer } from "../accessibility/diagramExplorer";
import type { AppPreferences } from "../services/preferences";
import { ttsProvider } from "../services/tts";
import { VoiceMic } from "./VoiceMic";
import { rankVoicesForLanguage } from "../utils/voiceSelection";

interface Props {
  explorer: DiagramExplorer;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  onAsk: (question: string) => Promise<string>;
  preferences: AppPreferences;
  onPreferencesChange: (patch: Partial<AppPreferences>) => void;
  highContrast?: boolean;
}

const QUICK_ACTIONS = [
  { label: "Describe", icon: BookOpen, prompt: "Describe this image from the whole picture to the important details." },
  { label: "Explain simply", icon: Sparkles, prompt: "Explain this simply for a beginner." },
  { label: "Read labels", icon: Tags, prompt: "Read every visible label and explain where it is." },
  { label: "Compare", icon: Gauge, prompt: "Compare the most important elements, values, or regions." },
  { label: "Quiz me", icon: MessageCircleQuestion, prompt: "Quiz me with one question at a time about this image." },
] as const;

const cleanDisplayText = (text: string) => text.replace(/\*\*(.*?)\*\*/g, "$1").replace(/^#{1,6}\s+/gm, "").replace(/`([^`]+)`/g, "$1");

export const TutorPanel: React.FC<Props> = ({ explorer, history, onAsk, preferences, onPreferencesChange, highContrast }) => {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [explorerPosition, setExplorerPosition] = useState(explorer.index());
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener?.("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener?.("voiceschanged", load);
  }, []);
  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: preferences.reducedMotion ? "auto" : "smooth" }); }, [history, notice, preferences.reducedMotion]);
  useEffect(() => {
    const update = () => setIsSpeaking(ttsProvider.isSpeaking());
    update();
    const timer = window.setInterval(update, 200);
    return () => window.clearInterval(timer);
  }, []);

  const matchingVoices = useMemo(() => {
    const ranked = rankVoicesForLanguage(voices, preferences.language);
    return ranked.length ? ranked : voices;
  }, [preferences.language, voices]);

  const send = async (rawQuestion: string) => {
    const question = rawQuestion.trim();
    if (!question || busy) return;
    setBusy(true);
    setNotice(null);
    setInput("");
    try { await onAsk(question); }
    catch (error) { setNotice((error as Error).message || "The assistant could not answer that question."); }
    finally { setBusy(false); }
  };
  const speakExploreStep = async (direction: "next" | "previous" | "repeat") => {
    const text = direction === "next" ? explorer.next() : direction === "previous" ? explorer.previous() : explorer.current();
    setExplorerPosition(explorer.index());
    setNotice(`${direction === "repeat" ? "Repeating" : direction === "next" ? "Next item" : "Previous item"}: ${text.slice(0, 180)}`);
    await ttsProvider.speakAssistant(text, { force: true });
  };
  const changeRate = (amount: number) => {
    const speechRate = Math.min(1.5, Math.max(0.6, Number((preferences.speechRate + amount).toFixed(1))));
    onPreferencesChange({ speechRate });
    setNotice(`Speech speed set to ${speechRate.toFixed(1)} times.`);
    void ttsProvider.speakAssistant(`Speech speed is now ${speechRate.toFixed(1)} times.`, { rate: speechRate, force: true });
  };
  const handleTranscript = async (text: string) => {
    setNotice(`Heard: ${text}`);
    const intent = matchVoiceIntent(text);
    if (intent === "stop") { ttsProvider.stop(); setNotice("Speech stopped."); return; }
    if (intent === "next" || intent === "previous" || intent === "repeat") { await speakExploreStep(intent); return; }
    if (intent === "slower" || intent === "faster") { changeRate(intent === "slower" ? -0.1 : 0.1); return; }
    await send(text);
  };

  return (
    <section aria-label="Diagram assistant" className={`flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-box border ${highContrast ? "border-white bg-black text-white" : "border-base-300 bg-base-100 text-base-content"}`}>
      <header className="flex shrink-0 flex-col gap-3 border-b border-base-300 bg-base-100 p-2 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="hidden min-w-0 items-center gap-3 sm:flex"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-content"><Sparkles className="size-5" /></span><div className="min-w-0"><h3 className="font-bold">Diagram assistant</h3><p className="text-xs text-base-content/60">Ask, listen, compare, or explore step by step</p></div></div>
        <div className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:flex sm:w-auto sm:flex-wrap">
          <label className="sr-only" htmlFor="assistant-detail">Answer detail</label>
          <select id="assistant-detail" value={preferences.explanationLevel} onChange={event => onPreferencesChange({ explanationLevel: event.target.value as AppPreferences["explanationLevel"] })} className="select select-sm w-full min-w-0 border-base-300 sm:w-auto" aria-label="Answer detail">
            <option value="Simple">Simple answers</option><option value="Standard">Standard answers</option><option value="Detailed">Detailed answers</option>
          </select>
          <span className="badge badge-outline badge-sm">{preferences.speechRate.toFixed(1)}× voice</span>
        </div>
      </header>

      <nav aria-label="Quick questions" className="flex max-w-full shrink-0 flex-nowrap gap-2 overflow-x-auto border-b border-base-300 bg-base-200 p-2.5 [scrollbar-width:none] sm:p-3">
        {QUICK_ACTIONS.map(({ label, icon: Icon, prompt }) => <button key={label} onClick={() => send(prompt)} disabled={busy} className="btn btn-sm shrink-0 bg-base-100"><Icon className="size-4" />{label}</button>)}
        <button onClick={() => setNotice("Try Describe, Read labels, Compare, or Quiz me. You can also say next, previous, repeat, slower, faster, or stop.")} className="btn btn-sm shrink-0 bg-base-100"><HelpCircle className="size-4" />Help</button>
      </nav>

      <div ref={logRef} role="log" aria-live="polite" aria-busy={busy} className="min-h-32 min-w-0 flex-1 overflow-y-auto bg-base-200/60 p-3 sm:p-4">
        {history.length === 0 && <div className="mx-auto mt-8 max-w-md text-center"><MessageCircleQuestion className="mx-auto size-8 text-primary" /><h4 className="mt-3 font-bold">What would you like to understand?</h4><p className="mt-1 text-sm text-base-content/60">Choose a quick question, type your own, or use the microphone.</p></div>}
        {history.map((message, index) => <article key={`${message.role}-${index}`} className={`chat ${message.role === "user" ? "chat-end" : "chat-start"}`}>
          <div className="chat-header mb-1 text-xs font-semibold">{message.role === "user" ? "You" : "EchoGraph"}</div>
          <div className={`chat-bubble max-w-[92%] whitespace-pre-wrap break-words [overflow-wrap:anywhere] sm:max-w-[88%] ${message.role === "user" ? "chat-bubble-primary" : "bg-base-100 text-base-content shadow-sm"}`}>{cleanDisplayText(message.content.slice(0, 4000))}</div>
          {message.role === "assistant" && <div className="chat-footer mt-1"><button onClick={() => ttsProvider.speakAssistant(message.content, { force: true })} className="btn btn-ghost btn-xs"><Play className="size-3" />Play answer</button></div>}
        </article>)}
        {busy && <div className="chat chat-start"><div className="chat-bubble bg-base-100 text-base-content"><span className="loading loading-dots loading-sm" aria-label="Assistant is thinking" /></div></div>}
        {notice && <div role="status" className="mt-3 rounded-lg border border-base-300 bg-base-100 p-3 text-sm">{notice}</div>}
      </div>

      <div className="shrink-0 border-t border-base-300 bg-base-100 p-2 sm:p-4">
        <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
          <VoiceMic onTranscript={handleTranscript} onError={setNotice} disabled={busy} />
          <input value={input} onChange={event => setInput(event.target.value)} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); void send(input); } }} placeholder="Ask about this diagram…" className="input input-md min-w-0 flex-1 border-base-300 sm:input-lg" aria-label="Ask about this diagram" />
          <button onClick={() => send(input)} disabled={busy || !input.trim()} className="btn btn-primary btn-square btn-md sm:btn-lg" aria-label="Send question">{busy ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}</button>
        </div>
        <div className="mt-3 flex flex-col gap-3 border-t border-base-300 pt-3">
          <div role="toolbar" aria-label="Diagram navigation" className="flex max-w-full flex-nowrap items-center gap-2 overflow-x-auto [scrollbar-width:none]">
            <button onClick={() => speakExploreStep("previous")} disabled={explorerPosition === 0} className="btn btn-sm group shrink-0 transition-transform motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0" title="Read the previous diagram item"><ChevronLeft className="size-4 transition-transform motion-safe:group-hover:-translate-x-0.5" />Previous</button>
            <button onClick={() => speakExploreStep("next")} disabled={explorerPosition >= explorer.count() - 1} className="btn btn-neutral btn-sm group shrink-0 transition-transform motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0" title="Read the next diagram item">Next<ChevronRight className="size-4 transition-transform motion-safe:group-hover:translate-x-0.5" /></button>
            <button onClick={() => speakExploreStep("repeat")} className="btn btn-sm group shrink-0 transition-transform motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0" title="Read the current item again"><RotateCcw className="size-4 transition-transform motion-safe:group-hover:-rotate-45" />Repeat</button>
            <button onClick={() => { ttsProvider.stop(); setIsSpeaking(false); setNotice("Speech stopped."); }} disabled={!isSpeaking} className={`btn btn-sm group shrink-0 transition-transform motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 ${isSpeaking ? "btn-error btn-soft" : ""}`} title={isSpeaking ? "Stop all speech" : "No speech is playing"}><CircleStop className={`size-4 transition-transform motion-safe:group-hover:scale-110 ${isSpeaking ? "animate-pulse" : ""}`} />{isSpeaking ? "Stop speech" : "No speech"}</button>
            <span className="badge badge-ghost shrink-0 text-xs sm:ml-auto" aria-label={`Diagram item ${explorerPosition + 1} of ${Math.max(1, explorer.count())}`}>{explorerPosition + 1} / {Math.max(1, explorer.count())}</span>
          </div>
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-box bg-base-200/60 p-1.5 sm:p-2">
            <label className="sr-only" htmlFor="assistant-voice">Assistant voice</label>
            <select id="assistant-voice" title={matchingVoices.find(voice => voice.voiceURI === preferences.assistantVoiceURI)?.name || "EchoGraph cloud voice"} value={preferences.assistantVoiceURI || ""} onChange={event => onPreferencesChange({ assistantVoiceURI: event.target.value || undefined })} className="select select-sm w-full min-w-0 border-base-300">
              <option value="">EchoGraph cloud voice</option>{matchingVoices.map(voice => <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name}</option>)}
            </select>
            <div className="flex shrink-0 justify-end gap-1.5"><button onClick={() => changeRate(-0.1)} className="btn btn-sm btn-square" aria-label="Speak slower">−</button><button onClick={() => changeRate(0.1)} className="btn btn-sm btn-square" aria-label="Speak faster">+</button><button onClick={() => ttsProvider.speakAssistant("This is your selected assistant voice.", { force: true })} className="btn btn-sm btn-square" aria-label="Preview assistant voice"><Volume2 className="size-4" /></button></div>
          </div>
        </div>
      </div>
      <div aria-live="polite" className="sr-only">{busy ? "Assistant is thinking" : "Assistant ready"}</div>
    </section>
  );
};
