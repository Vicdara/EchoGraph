import { speechService } from "./speech";
import type { ChartDescription } from "../types";
import { loadPrefs } from "./preferences";
import { languageCodeFor, rankVoicesForLanguage, supportsCloudTts } from "../utils/voiceSelection";
import { apiFetch } from "./api";

export interface TTSOptions { rate?: number; voiceURI?: string; lang?: string; channel?: "summary" | "assistant"; force?: boolean; }

function stripSymbolsForSpeech(text: string): string {
  return text
    .replace(/[*_#`~]/g, "")
    .replace(/\[([^\]]+)\]/g, "$1")
    .replace(/[|]{2,}/g, ", ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function resolveVoiceForChannel(prefsLang: string, channel: "summary" | "assistant", voiceURI?: string): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = speechSynthesis.getVoices();
  if (voices.length===0) return null;
  // Channel-distinct default: summary -> female-coded (Google UK Female / Samantha / Natural), assistant -> male-coded (Google UK Male / Daniel / etc)
  const lower = (n: string)=> n.toLowerCase();
  const femaleHints = ["female","samantha","karen","zira","natural"];
  const maleHints = ["male","daniel","david","james","alex"];
  const ranked = rankVoicesForLanguage(voices, prefsLang);
  if (!voiceURI) {
    // try channel-preferred
    const hints = channel==="summary" ? femaleHints : maleHints;
    for (const h of hints) {
      const v = ranked.find(x=> lower(x.name).includes(h));
      if (v) return v;
    }
    // fallback: pick distinct by index so they are not same
    if (ranked.length) return channel==="summary" ? ranked[0] : ranked[1] ?? ranked[0];
  }
  if (voiceURI) {
    const v = voices.find(x=> x.voiceURI===voiceURI);
    if (v) return v;
  }
  const byLang = ranked[0];
  if (byLang) return byLang;
  return null;
}

export class TTSProvider {
  private audioEl: HTMLAudioElement | null = null;
  private audioUrl: string | null = null;

  private clearAudio(): void {
    this.audioEl?.pause();
    if (this.audioUrl) URL.revokeObjectURL(this.audioUrl);
    this.audioEl = null;
    this.audioUrl = null;
  }

  async speakText(text: string, opts: TTSOptions = {}): Promise<void> {
    const prefs = loadPrefs();
    if (prefs.speechEnabled === "off" && !opts.force) return;
    const lang = opts.lang || prefs.language;
    const channel = opts.channel || "summary";
    const selectedVoiceURI = opts.voiceURI ?? (channel === "summary" ? prefs.summaryVoiceURI : prefs.assistantVoiceURI) ?? prefs.voiceURI;
    const clean = stripSymbolsForSpeech(text);
    speechService.stop();
    this.clearAudio();
    // An explicitly selected browser voice must win; otherwise use the cloud voice first.
    if (!selectedVoiceURI && supportsCloudTts(lang) && (typeof window === "undefined" || !("speechSynthesis" in window))) try {
      const res = await apiFetch("tts", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ text: clean, language: lang }) });
      if (res.ok && res.headers.get("content-type")?.includes("audio")) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        await new Promise<void>((resolve)=>{
          const a = new Audio(url);
          this.audioEl = a;
          this.audioUrl = url;
          a.onended = () => { this.clearAudio(); resolve(); };
          a.onerror = () => { this.clearAudio(); resolve(); };
          a.play().catch(()=> { this.clearAudio(); resolve(); });
        });
        return;
      }
      // fallback json
      if (res.ok) {
        const j = await res.json().catch(()=>null) as {fallback?:boolean}|null;
        if (j?.fallback) {/* fall through to browser TTS */}
      }
    } catch {}
    const voice = resolveVoiceForChannel(lang, channel, selectedVoiceURI);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      await new Promise<void>(resolve => {
        const u = new SpeechSynthesisUtterance(clean);
        if (voice) u.voice = voice;
        u.lang = voice?.lang ?? languageCodeFor(lang); u.rate = opts.rate ?? prefs.speechRate ?? 1; u.pitch = channel==="assistant"? 1.05 : 1;
        let started = false;
        const startTimeout = window.setTimeout(() => { if (!started) resolve(); }, 2500);
        u.onstart = () => { started = true; window.clearTimeout(startTimeout); };
        u.onend = () => { window.clearTimeout(startTimeout); resolve(); };
        u.onerror = () => { window.clearTimeout(startTimeout); resolve(); };
        window.setTimeout(() => { speechSynthesis.resume(); speechSynthesis.speak(u); }, 50);
      });
      return;
    }
    await speechService.speak(clean, opts.rate ?? prefs.speechRate ?? 1);
  }
  async speakDescription(desc: ChartDescription, opts: TTSOptions = {}): Promise<void> {
    const ch = (opts.channel as "summary"|"assistant") || "summary";
    const script = `${stripSymbolsForSpeech(desc.summary)}. ${stripSymbolsForSpeech(desc.structure)}. ${stripSymbolsForSpeech(desc.data)}. ${stripSymbolsForSpeech(desc.whyItMatters)}`;
    await this.speakText(script, { ...opts, channel: ch });
  }
  async speakAssistant(text: string, opts: TTSOptions = {}): Promise<void> {
    await this.speakText(text, { ...opts, channel: "assistant" });
  }
  stop(): void { speechService.stop(); try{ speechSynthesis.cancel(); }catch{} this.clearAudio(); }
  isSpeaking(): boolean { return Boolean(this.audioEl && !this.audioEl.paused) || speechService.getIsSpeaking(); }
  listVoices(): SpeechSynthesisVoice[] {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
    return speechSynthesis.getVoices();
  }
}
export const ttsProvider = new TTSProvider();
export function speakText(text: string, opts?: TTSOptions) { return ttsProvider.speakText(text, opts); }
export function stopSpeaking() { ttsProvider.stop(); }
