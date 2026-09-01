// Voice command matcher - maps transcript to intent, allows natural phrasing
export type VoiceIntent =
  | "describe" | "detailed" | "explainSimply" | "explore" | "askQuestion"
  | "readLabels" | "readValues" | "next" | "previous" | "repeat" | "stop"
  | "slower" | "faster" | "summarize" | "compare" | "quiz" | "help"
  | "freeform";

const PATTERNS: Array<{ intent: VoiceIntent; re: RegExp }> = [
  { intent: "describe", re: /\bdescribe\b/i },
  { intent: "detailed", re: /detailed|more detail|walk ?through/i },
  { intent: "explainSimply", re: /explain simply|simple|beginner|eli5/i },
  { intent: "explore", re: /\bexplore\b/i },
  { intent: "readLabels", re: /read labels?/i },
  { intent: "readValues", re: /read values?|data points?/i },
  { intent: "next", re: /\bnext(\s+item)?\b/i },
  { intent: "previous", re: /previous|go back|backwards/i },
  { intent: "repeat", re: /\brepeat\b/i },
  { intent: "stop", re: /stop speaking|stop|pause|cancel/i },
  { intent: "slower", re: /slower|slow down/i },
  { intent: "faster", re: /faster|speed up/i },
  { intent: "summarize", re: /summar(y|ize)/i },
  { intent: "compare", re: /\bcompare\b/i },
  { intent: "quiz", re: /quiz me|test me|ask me/i },
  { intent: "help", re: /\bhelp\b/i },
];

export function matchVoiceIntent(transcript: string): VoiceIntent {
  const t = transcript.trim().toLowerCase();
  // question-like -> freeform unless exact command
  for (const p of PATTERNS) if (p.re.test(t)) return p.intent;
  if (t.endsWith("?") || t.startsWith("what ") || t.startsWith("why ") || t.startsWith("how ") || t.startsWith("which ")) return "freeform";
  return "freeform";
}
