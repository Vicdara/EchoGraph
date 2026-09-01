// Central status bus + friendly error mapping + ARIA announcements
export type AppStatus =
  | "ready"
  | "uploading"
  | "analyzing"
  | "ready-to-explore"
  | "listening"
  | "transcribing"
  | "thinking"
  | "speaking"
  | "trying-another-service"
  | "connection-unavailable"
  | "error";

const FRIENDLY: Record<string, string> = {
  "429": "The AI service is busy (rate limit). Retrying in a moment...",
  "401": "Invalid API key or authentication error. Please verify your Mistral API keys.",
  rate: "The AI service is processing multiple requests. Please wait a moment.",
};

export function friendlyError(raw: string): string {
  const low = raw.toLowerCase();
  if (low.includes("no mistral") || low.includes("no key") || low.includes("keys configured")) {
    return "API keys not detected. Please ensure VITE_MISTRAL_API_KEYS is set in Cloudflare Pages environment variables and click Retry Deployment.";
  }
  if (low.includes("429") || low.includes("rate")) return FRIENDLY["429"];
  if (low.includes("401") || low.includes("auth")) return FRIENDLY["401"];
  if (low.includes("timeout") || low.includes("econnreset") || low.includes("provider"))
    return "The AI service took too long to respond. Please try uploading again.";
  if (low.includes("json") || low.includes("decode"))
    return "I couldn't understand that part of the diagram clearly. Try uploading a clearer screenshot or image.";
  if (low.includes("transcrib"))
    return "Voice recognition is temporarily unavailable. You can type your question instead.";
  if (raw && raw.length > 5 && raw.length < 200 && !raw.includes("<!DOCTYPE")) {
    return raw;
  }
  return "Could not process the diagram. Please ensure VITE_MISTRAL_API_KEYS is configured in Cloudflare Pages.";
}

let listeners: Array<(s: AppStatus, msg?: string) => void> = [];
export function onStatus(cb: (s: AppStatus, msg?: string) => void) {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((x) => x !== cb);
  };
}
export function emitStatus(s: AppStatus, msg?: string) {
  for (const cb of listeners) cb(s, msg);
}
