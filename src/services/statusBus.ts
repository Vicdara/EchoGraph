// Central status bus + friendly error mapping + ARIA announcements
export type AppStatus = "ready"|"uploading"|"analyzing"|"ready-to-explore"|"listening"|"transcribing"|"thinking"|"speaking"|"trying-another-service"|"connection-unavailable"|"error";

const FRIENDLY: Record<string,string> = {
  "429": "I'm having trouble processing that right now. Trying another service.",
  "401": "I'm having trouble processing that right now. Trying another service.",
  "rate": "I'm still working on it.",
};

export function friendlyError(raw: string): string {
  const low = raw.toLowerCase();
  if (low.includes("429") || low.includes("rate")) return FRIENDLY["429"];
  if (low.includes("401") || low.includes("auth")) return FRIENDLY["401"];
  if (low.includes("timeout") || low.includes("econnreset") || low.includes("provider")) return "I'm still working on it.";
  if (low.includes("json") || low.includes("decode")) return "I couldn't understand that part of the diagram clearly. Try uploading a clearer image.";
  if (low.includes("transcrib")) return "Voice recognition is temporarily unavailable. You can type your question instead.";
  return "Something went wrong. Please try again.";
}

let listeners: Array<(s: AppStatus, msg?: string)=>void> = [];
export function onStatus(cb: (s: AppStatus, msg?: string)=>void) { listeners.push(cb); return ()=>{ listeners=listeners.filter(x=>x!==cb); }; }
export function emitStatus(s: AppStatus, msg?: string) { for(const cb of listeners) cb(s, msg); }
