import { groqPool, mistralPool } from "./providerManager";
import { languageCodeFor } from "../src/utils/voiceSelection";

export async function transcribeWithGroq(audioBuffer: Buffer, filename="audio.webm", mime="audio/webm", language?: string): Promise<string> {
  const entry = groqPool.pick();
  if (!entry) throw new Error("No Groq keys configured (GROQ_API_KEYS)");
  const fd = new FormData();
  fd.append("file", new Blob([new Uint8Array(audioBuffer)], { type: mime }), filename);
  fd.append("model", "whisper-large-v3");
  if (language) fd.append("language", languageCodeFor(language));
  fd.append("temperature", "0");
  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${entry.key}` } as unknown as Record<string,string>,
    body: fd as unknown as BodyInit,
  });
  if (!res.ok) {
    const t = await res.text();
    groqPool.markFailure(entry, t.slice(0,300), res.status);
    throw new Error(`${res.status}: ${t.slice(0,300)}`);
  }
  const j = await res.json() as {text?:string};
  groqPool.markSuccess(entry, 0);
  return (j.text||"").trim();
}

export async function transcribeWithMistral(audioBuffer: Buffer, language?: string): Promise<string> {
  const entry = mistralPool.pick();
  if (!entry) throw new Error("No Mistral keys configured (MISTRAL_API_KEYS)");
  const fd = new FormData();
  fd.append("file", new Blob([new Uint8Array(audioBuffer)], { type: "audio/webm" }), "recording.webm");
  fd.append("model", "voxtral-mini-2602");
  if (language) fd.append("language", languageCodeFor(language));
  const res = await fetch("https://api.mistral.ai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${entry.key}` },
    body: fd,
  });
  if (!res.ok) {
    const t = await res.text();
    mistralPool.markFailure(entry, t.slice(0,300), res.status);
    throw new Error(`${res.status}: ${t.slice(0,300)}`);
  }
  const j = await res.json() as {text?:string};
  mistralPool.markSuccess(entry, 0);
  return (j.text||"").trim();
}
