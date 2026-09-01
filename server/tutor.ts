import { opencodePool } from "./providerManager";
import { OPENCODE_MODEL_ORDER, OPENCODE_MODEL_IDS } from "./config";
import type { StructuredDiagram, ExplanationLevel } from "../src/types/diagram";
import { buildLocalTutorAnswer } from "../src/utils/assistantFallback.ts";

const LEVEL_HINT: Record<ExplanationLevel,string> = {
  Simple: "Use simple vocabulary, short sentences, beginner-friendly. Do not change facts.",
  Standard: "Clear, standard explanation.",
  Detailed: "Thorough, detailed explanation with specifics.",
};

function tutorSystemPrompt(level: ExplanationLevel, userLanguage = "English"): string {
  return `You are EchoGraph Tutor, an accessibility tutor for blind/low-vision students. Respond in ${userLanguage} (unless the user asks otherwise) while preserving original diagram language for labels. Never translate scientific values/symbols/formulas/units.\n${LEVEL_HINT[level]}\nRules: answer only from provided diagram JSON where the question depends on the diagram; never invent labels/values/directions/arrows; if uncertain say so; handle intents: describe/explain simply/detail/highest/compare/arrow/labels/walkthrough/what-next/why/quiz; for quiz, ask one question at a time.`;
}

export async function askTutor(opts: {
  structured: StructuredDiagram;
  history: Array<{role:"user"|"assistant", content:string}>;
  question: string;
  level?: ExplanationLevel;
  userLanguage?: string;
}): Promise<{ answer: string; model: string }> {
  const level = opts.level || "Standard";
  const system = tutorSystemPrompt(level, opts.userLanguage || "English");
  const diagramBlock = JSON.stringify(opts.structured);
  const messages = [
    { role: "system" as const, content: system },
    { role: "user" as const, content: `DIAGRAM JSON:\n${diagramBlock}` },
    ...opts.history.slice(-6).map(m=> ({ role: m.role as "user"|"assistant", content: m.content })),
    { role: "user" as const, content: opts.question },
  ];

  let lastErr = "";
  for (const short of OPENCODE_MODEL_ORDER) {
    const model = OPENCODE_MODEL_IDS[short] || short;
    const entry = opencodePool.pick();
    if (!entry) { lastErr = "No OpenCode keys"; break; }
    const ac = new AbortController();
    const t = setTimeout(()=>ac.abort(), 8000);
    const start = Date.now();
    try {
      const res = await fetch("https://opencode.ai/zen/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${entry.key}`, "Content-Type":"application/json" },
        body: JSON.stringify({ model, messages, temperature: 0.3, max_tokens: level === "Simple" ? 300 : level === "Detailed" ? 750 : 500 }),
        signal: ac.signal,
      });
      clearTimeout(t);
      if (!res.ok) {
        const txt = await res.text();
        lastErr = `${model} ${res.status}: ${txt.slice(0,200)}`;
        opencodePool.markFailure(entry, txt.slice(0,300), res.status);
        if (res.status===429 || res.status>=500) continue; // try next model
        continue;
      }
      const j: unknown = await res.json();
      const content = (j as {choices?: Array<{message?:{content?:string}}>})?.choices?.[0]?.message?.content || "";
      if (!content) { lastErr = `${model} empty`; continue; }
      opencodePool.markSuccess(entry, Date.now()-start);
      return { answer: content, model };
    } catch (e: unknown) {
      clearTimeout(t);
      const msg = (e as Error).message || String(e);
      lastErr = `${model}: ${msg.slice(0,200)}`;
      opencodePool.markFailure(entry, msg);
      continue;
    }
  }
  console.warn("[EchoGraph Tutor] OpenCode unavailable; using local diagram answer", {
    category: /429|rate/i.test(lastErr) ? "rate-limited" : /timeout|abort/i.test(lastErr) ? "timeout" : "unavailable",
  });
  return { answer: buildLocalTutorAnswer(opts.structured, opts.question), model: "local-fallback" };
}
