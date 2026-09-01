import { loadPrefs } from "./preferences";
import { friendlyError } from "./statusBus";
import { languageCodeFor } from "../utils/voiceSelection";
import { apiFetch } from "./api";

export async function transcribeAudio(blob: Blob): Promise<string> {
  const lang = languageCodeFor(loadPrefs().language);
  const res = await apiFetch("transcribe", { method: "POST", headers: { "Content-Type": blob.type || "audio/webm", "X-Language": lang }, body: blob, signal: AbortSignal.timeout(30_000) });
  if (!res.ok) {
    const raw = await res.text().catch(() => `HTTP ${res.status}`);
    try { const j=JSON.parse(raw); throw new Error(friendlyError(j.error||raw)); } catch { throw new Error(friendlyError(raw)); }
  }
  const j = await res.json();
  return (j.text || j.transcript || "").trim();
}
