// Server TTS via Mistral Voxtral Mini TTS 2603
import { mistralPool } from "./providerManager";
import { supportsCloudTts } from "../src/utils/voiceSelection";

export async function synthesizeWithMistral(text: string, language = "English"): Promise<Buffer> {
  if (!supportsCloudTts(language)) throw new Error(`Cloud speech is unavailable for ${language}`);
  const entry = mistralPool.pick();
  if (!entry) throw new Error("No Mistral keys configured");
  const voiceId = process.env.MISTRAL_VOICE_ID;
  if (!voiceId) throw new Error("No Mistral cloud voice profile configured");
  const clean = text.replace(/[*_#`~]/g,"").replace(/\[([^\]]+)\]/g,"$1").slice(0, 3500);
  const res = await fetch("https://api.mistral.ai/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${entry.key}`, "Content-Type":"application/json" },
    body: JSON.stringify({ model: "voxtral-mini-tts-2603", input: clean, voice_id: voiceId }),
  });
  if (!res.ok) {
    const t = await res.text();
    // Fallback: try chat TTS endpoint variation
    if (res.status===404) {
      const r2 = await fetch("https://api.mistral.ai/v1/audio/speech", {
        method: "POST",
        headers: { Authorization: `Bearer ${entry.key}`, "Content-Type":"application/json" },
        body: JSON.stringify({ model: "voxtral-mini-tts-2603", input: clean, voice_id: voiceId }),
      });
      if (!r2.ok) { const t2=await r2.text(); mistralPool.markFailure(entry, t2.slice(0,300), r2.status); throw new Error(`${r2.status}: ${t2.slice(0,300)}`); }
      mistralPool.markSuccess(entry, 0);
      return Buffer.from(await r2.arrayBuffer());
    }
    mistralPool.markFailure(entry, t.slice(0,300), res.status);
    throw new Error(`${res.status}: ${t.slice(0,300)}`);
  }
  mistralPool.markSuccess(entry, 0);
  return Buffer.from(await res.arrayBuffer());
}
