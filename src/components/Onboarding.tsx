import React, { useEffect, useMemo, useRef, useState } from "react";
import { Accessibility, BookOpen, Check, Gauge, Languages, MessageCircle, Sparkles, Volume2 } from "lucide-react";
import type { AppPreferences } from "../services/preferences";
import { ttsProvider } from "../services/tts";
import { languagesWithVoices, rankVoicesForLanguage, supportsCloudTts } from "../utils/voiceSelection";

const LANGUAGES = ["English", "French", "Spanish", "German", "Arabic", "Hindi", "Portuguese", "Chinese", "Japanese", "Korean", "Russian", "Italian", "Dutch"];
const VOICE_PREVIEWS: Record<string, string> = {
  English: "Here is your EchoGraph voice preview.", French: "Voici votre aperçu vocal EchoGraph.", Spanish: "Esta es la vista previa de voz de EchoGraph.",
  German: "Hier ist Ihre EchoGraph-Stimmvorschau.", Arabic: "هذه معاينة صوت إيكوغراف.", Hindi: "यह आपकी इकोग्राफ आवाज़ का नमूना है।",
  Portuguese: "Esta é a prévia da voz do EchoGraph.", Chinese: "这是您的 EchoGraph 语音预览。", Japanese: "これは EchoGraph の音声プレビューです。",
  Korean: "EchoGraph 음성 미리 듣기입니다.", Russian: "Это пример выбранного голоса EchoGraph.", Italian: "Questa è l'anteprima della voce EchoGraph.",
  Dutch: "Dit is uw EchoGraph-stemvoorbeeld.",
};
const LEVELS: Array<{ value: AppPreferences["explanationLevel"]; title: string; description: string }> = [
  { value: "Simple", title: "Simple", description: "Short sentences and beginner-friendly language." },
  { value: "Standard", title: "Standard", description: "Clear explanations with the important details." },
  { value: "Detailed", title: "Detailed", description: "Full walkthroughs, relationships, values, and context." },
];

export const Onboarding: React.FC<{ onDone: (preferences: AppPreferences) => void }> = ({ onDone }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState(1);
  const [language, setLanguage] = useState("English");
  const [speechEnabled, setSpeechEnabled] = useState<AppPreferences["speechEnabled"]>("auto");
  const [speechRate, setSpeechRate] = useState(1);
  const [summaryVoiceURI, setSummaryVoiceURI] = useState("");
  const [assistantVoiceURI, setAssistantVoiceURI] = useState("");
  const [explanationLevel, setExplanationLevel] = useState<AppPreferences["explanationLevel"]>("Standard");
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [filter, setFilter] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener?.("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener?.("voiceschanged", load);
  }, []);
  useEffect(() => { dialogRef.current?.showModal(); }, []);

  const languageVoices = useMemo(() => rankVoicesForLanguage(voices, language), [language, voices]);
  const availableLanguages = useMemo(() => voices.length > 0 ? languagesWithVoices(LANGUAGES, voices) : LANGUAGES, [voices]);
  const otherVoices = useMemo(() => voices.filter(voice => !languageVoices.some(match => match.voiceURI === voice.voiceURI)), [languageVoices, voices]);
  const cloudTtsAvailable = supportsCloudTts(language);
  useEffect(() => {
    const recommended = languageVoices[0];
    const alternative = languageVoices[1] ?? recommended;
    setSummaryVoiceURI(recommended?.voiceURI ?? "");
    setAssistantVoiceURI(alternative?.voiceURI ?? "");
  }, [language, languageVoices]);
  useEffect(() => {
    if (voices.length > 0 && availableLanguages.length > 0 && !availableLanguages.includes(language)) {
      setLanguage(availableLanguages[0]);
    }
  }, [availableLanguages, language, voices.length]);
  const filteredLanguages = availableLanguages.filter(item => item.toLowerCase().includes(filter.toLowerCase()));
  const preview = (channel: "summary" | "assistant", voiceURI: string) => ttsProvider.speakText(
    VOICE_PREVIEWS[language] ?? `EchoGraph voice preview in ${language}.`,
    { channel, voiceURI: voiceURI || undefined, rate: speechRate, lang: language, force: true },
  );
  const finish = () => onDone({
    language,
    summaryVoiceURI: summaryVoiceURI || undefined,
    assistantVoiceURI: assistantVoiceURI || undefined,
    speechEnabled,
    speechRate,
    explanationLevel,
    highContrast,
    reducedMotion,
    onboardingDone: true,
  });

  return (
    <dialog ref={dialogRef} aria-labelledby="onboarding-title" onCancel={event => event.preventDefault()} className="modal bg-black/60 p-3">
      <div className="modal-box flex max-h-[calc(100dvh-1rem)] w-full max-w-3xl min-w-0 flex-col overflow-hidden bg-base-100 p-0 text-base-content shadow-2xl">
        <header className="shrink-0 border-b border-base-300 px-4 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-content"><Sparkles className="size-5" /></span>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-base-content/55 sm:tracking-[0.16em]">Personalize EchoGraph</p>
              <h1 id="onboarding-title" className="text-xl font-bold sm:text-2xl">Set up your learning experience</h1>
            </div>
          </div>
          <ul className="steps steps-horizontal mt-5 w-full text-[10px] sm:text-xs" aria-label={`Setup step ${step} of 4`}>
            {["Welcome", "Language", "Detail", "Voice"].map((label, index) => <li key={label} className={`step min-w-0 ${step > index ? "step-primary" : ""}`}><span className="hidden min-[380px]:inline">{label}</span><span className="min-[380px]:hidden">{index + 1}</span></li>)}
          </ul>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-7 sm:py-6">
          {step === 1 && <section className="space-y-5">
            <div>
              <h2 className="text-2xl font-bold">See less. Understand everything.</h2>
              <p className="mt-2 max-w-2xl text-base-content/70">Upload any chart, diagram, worksheet, or image. EchoGraph describes it aloud and lets you explore it through conversation.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                [BookOpen, "Structured descriptions", "Hear the layout, visible data, and key takeaway."],
                [MessageCircle, "Ask follow-up questions", "Compare elements, read labels, or request a quiz."],
                [Accessibility, "Built for access", "Voice input, keyboard controls, contrast, and adjustable speech."],
              ].map(([Icon, title, text]) => <article key={String(title)} className="card card-border bg-base-100"><div className="card-body gap-2 p-4"><Icon className="size-5 text-primary" /><h3 className="font-bold">{String(title)}</h3><p className="text-sm text-base-content/65">{String(text)}</p></div></article>)}
            </div>
          </section>}

          {step === 2 && <section className="space-y-4">
            <div className="flex items-start gap-3"><Languages className="mt-1 size-6 text-primary" /><div><h2 className="text-xl font-bold">Choose your learning language</h2><p className="text-sm text-base-content/65">Descriptions and assistant answers use this language while scientific values stay unchanged.</p></div></div>
            <input aria-label="Search languages" placeholder="Search languages…" value={filter} onChange={event => setFilter(event.target.value)} className="w-full rounded-lg border border-base-300 bg-base-100 px-4 py-3" />
            <div role="listbox" aria-label="Language" className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto min-[360px]:grid-cols-2 sm:grid-cols-3">
              {filteredLanguages.map(item => <button key={item} role="option" aria-selected={language === item} onClick={() => setLanguage(item)} className={`btn min-w-0 justify-start ${language === item ? "btn-primary" : "btn-ghost border border-base-300"}`}>{language === item && <Check className="size-4 shrink-0" />}{item}</button>)}
            </div>
            {voices.length > 0 && <p className="text-xs text-base-content/60">Only languages with a voice available in this browser are shown.</p>}
          </section>}

          {step === 3 && <section className="space-y-4">
            <div className="flex items-start gap-3"><Gauge className="mt-1 size-6 text-primary" /><div><h2 className="text-xl font-bold">How should EchoGraph explain things?</h2><p className="text-sm text-base-content/65">This controls every assistant answer. You can still ask for more or less detail anytime.</p></div></div>
            <div className="grid gap-3 sm:grid-cols-3">
              {LEVELS.map(level => <button key={level.value} aria-pressed={explanationLevel === level.value} onClick={() => setExplanationLevel(level.value)} className={`card card-border text-left transition ${explanationLevel === level.value ? "border-primary bg-primary/5 ring-2 ring-primary" : "bg-base-100"}`}><div className="card-body gap-2 p-4"><span className="flex items-center justify-between font-bold">{level.title}{explanationLevel === level.value && <Check className="size-5 text-primary" />}</span><span className="text-sm text-base-content/65">{level.description}</span></div></button>)}
            </div>
          </section>}

          {step === 4 && <section className="space-y-5">
            <div className="flex items-start gap-3"><Volume2 className="mt-1 size-6 text-primary" /><div><h2 className="text-xl font-bold">Choose a voice for each task</h2><p className="text-sm text-base-content/65">Use different voices for image summaries and assistant answers, then preview them before starting.</p></div></div>
            <div className="grid gap-4 sm:grid-cols-2">
              {([
                ["Image summaries", summaryVoiceURI, setSummaryVoiceURI, "summary"],
                ["Assistant answers", assistantVoiceURI, setAssistantVoiceURI, "assistant"],
              ] as const).map(([label, value, setter, channel]) => <div key={label} className="card card-border min-w-0 bg-base-100"><div className="card-body min-w-0 gap-3 p-4">
                <label className="font-bold" htmlFor={`${channel}-voice`}>{label}</label>
                <select id={`${channel}-voice`} value={value} onChange={event => setter(event.target.value)} className="select w-full border-base-300">
                  <option value="">Automatic {language} browser voice</option>
                  {languageVoices.length > 0 && <optgroup label={`Recommended ${language} voices`}>{languageVoices.map((voice, index) => <option key={voice.voiceURI} value={voice.voiceURI}>{index === 0 ? "★ " : ""}{voice.name} · {voice.lang}{voice.default ? " · System default" : ""}</option>)}</optgroup>}
                  {otherVoices.length > 0 && <optgroup label="Other installed language voices">{otherVoices.map(voice => <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} · {voice.lang}</option>)}</optgroup>}
                </select>
                <p className="text-xs text-base-content/60">{languageVoices.length ? `Recommended automatically: ${languageVoices[0].name}` : `The browser will request an automatic ${language} voice; install one in system settings if it cannot speak.`} {cloudTtsAvailable ? "Mistral supports this language when a cloud voice profile is configured." : `Mistral cloud TTS does not support ${language}.`}</p>
                <button onClick={() => preview(channel, value)} className="btn btn-sm btn-outline"><Volume2 className="size-4" />Preview voice</button>
              </div></div>)}
            </div>
            <div className="card card-border bg-base-100"><div className="card-body gap-4 p-4">
              <fieldset><legend className="font-bold">When should speech play?</legend><div className="mt-2 grid gap-2 sm:grid-cols-3">{([['auto','Automatically'],['on-demand','When I press play'],['off','Keep speech off']] as const).map(([value, label]) => <button key={value} aria-pressed={speechEnabled === value} onClick={() => setSpeechEnabled(value)} className={`btn btn-sm ${speechEnabled === value ? "btn-primary" : "btn-ghost border border-base-300"}`}>{label}</button>)}</div></fieldset>
              <label className="font-bold" htmlFor="speech-rate">Speech speed <span className="font-normal text-base-content/60">{speechRate.toFixed(1)}×</span></label>
              <input id="speech-rate" type="range" min={0.7} max={1.4} step={0.1} value={speechRate} onChange={event => setSpeechRate(Number(event.target.value))} className="w-full accent-primary" />
              <div className="grid gap-2 sm:grid-cols-2"><button aria-pressed={highContrast} onClick={() => setHighContrast(value => !value)} className={`btn btn-sm ${highContrast ? "btn-primary" : "btn-ghost border border-base-300"}`}>High contrast {highContrast ? "on" : "off"}</button><button aria-pressed={reducedMotion} onClick={() => setReducedMotion(value => !value)} className={`btn btn-sm ${reducedMotion ? "btn-primary" : "btn-ghost border border-base-300"}`}>Reduced motion {reducedMotion ? "on" : "off"}</button></div>
            </div></div>
          </section>}
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-base-300 bg-base-200 px-4 py-3 sm:px-7 sm:py-4">
          <button onClick={() => setStep(current => Math.max(1, current - 1))} disabled={step === 1} className="btn btn-ghost">Back</button>
          {step < 4 ? <button autoFocus={step === 1} onClick={() => setStep(current => current + 1)} className="btn btn-primary min-w-28">Continue</button> : <button onClick={finish} className="btn btn-primary min-w-36"><Sparkles className="size-4" />Start exploring</button>}
        </footer>
      </div>
    </dialog>
  );
};
