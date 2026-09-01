const LANGUAGE_CODES: Record<string, string> = {
  English: "en", French: "fr", Spanish: "es", German: "de", Arabic: "ar", Hindi: "hi",
  Portuguese: "pt", Chinese: "zh", Japanese: "ja",
  Korean: "ko", Russian: "ru", Italian: "it", Dutch: "nl",
};

const CLOUD_TTS_CODES = new Set(["en", "fr", "es", "pt", "it", "nl", "de", "hi", "ar"]);
const QUALITY_HINTS = ["natural", "neural", "enhanced", "premium", "online", "google", "microsoft"];

export function languageCodeFor(language: string): string {
  return LANGUAGE_CODES[language] ?? language.trim().slice(0, 2).toLowerCase();
}

export function supportsCloudTts(language: string): boolean {
  return CLOUD_TTS_CODES.has(languageCodeFor(language));
}

export function rankVoicesForLanguage<T extends { lang: string; name: string; voiceURI: string; default?: boolean; localService?: boolean }>(voices: T[], language: string): T[] {
  const code = languageCodeFor(language);
  return voices
    .filter(voice => voice.lang.toLowerCase().split(/[-_]/)[0] === code)
    .map((voice, index) => ({ voice, index, score: (voice.default ? 25 : 0) + (voice.localService ? 5 : 0) + QUALITY_HINTS.reduce((score, hint) => score + (voice.name.toLowerCase().includes(hint) ? 30 : 0), 0) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(item => item.voice);
}

export function languagesWithVoices<T extends { lang: string; name: string; voiceURI: string; default?: boolean; localService?: boolean }>(languages: string[], voices: T[]): string[] {
  return languages.filter(language => rankVoicesForLanguage(voices, language).length > 0);
}
