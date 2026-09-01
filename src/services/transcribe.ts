import { loadPrefs } from "./preferences";
import { friendlyError } from "./statusBus";
import { languageCodeFor } from "../utils/voiceSelection";
import { apiFetch } from "./api";

function getGroqKeys(): string[] {
  const envRaw =
    import.meta.env.VITE_GROQ_API_KEYS ||
    import.meta.env.VITE_GROQ_API_KEY ||
    "";
  return envRaw.split(",").map((s: string) => s.trim()).filter(Boolean);
}

export async function transcribeAudio(blob: Blob): Promise<string> {
  const lang = languageCodeFor(loadPrefs().language);

  // 1. Try serverless endpoint
  try {
    const res = await apiFetch("transcribe", {
      method: "POST",
      headers: { "Content-Type": blob.type || "audio/webm", "X-Language": lang },
      body: blob,
      signal: AbortSignal.timeout(15_000),
    });
    if (res.ok) {
      const j = await res.json();
      const text = (j.text || j.transcript || "").trim();
      if (text) return text;
    }
  } catch (e) {
    console.warn("[EchoGraph] Transcribe endpoint unreachable, using direct Whisper fallback:", e);
  }

  // 2. Direct Groq Whisper API fallback
  const groqKeys = getGroqKeys();
  for (const key of groqKeys) {
    try {
      const formData = new FormData();
      formData.append("file", blob, "audio.webm");
      formData.append("model", "whisper-large-v3-turbo");
      formData.append("response_format", "json");

      const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}` },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        return (data.text || "").trim();
      }
    } catch {}
  }

  throw new Error(friendlyError("transcription failed"));
}
