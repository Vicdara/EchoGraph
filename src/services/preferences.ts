export type AppLanguage = string; // e.g. "English", "French"
export interface AppPreferences {
  language: AppLanguage;
  voiceURI?: string; // legacy single-voice preference
  summaryVoiceURI?: string;
  assistantVoiceURI?: string;
  speechEnabled: "auto" | "on-demand" | "off";
  speechRate: number;
  explanationLevel: "Simple" | "Standard" | "Detailed";
  highContrast: boolean;
  reducedMotion: boolean;
  onboardingDone: boolean;
}
const KEY = "echograph_prefs";
const DEFAULTS: AppPreferences = {
  language: "English",
  speechEnabled: "auto",
  speechRate: 1,
  explanationLevel: "Standard",
  highContrast: false,
  reducedMotion: false,
  onboardingDone: false,
};
export function loadPrefs(): AppPreferences {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULTS };
}
export function savePrefs(p: AppPreferences) {
  localStorage.setItem(KEY, JSON.stringify(p));
}

export function updatePrefs(patch: Partial<AppPreferences>): AppPreferences {
  const next = { ...loadPrefs(), ...patch };
  savePrefs(next);
  return next;
}
