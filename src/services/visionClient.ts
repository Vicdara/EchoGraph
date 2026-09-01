import type { StructuredDiagram } from "../types/diagram";
import { loadPrefs } from "./preferences";
import { friendlyError } from "./statusBus";
import { parseEnrichedDescription } from "../utils/structuredText";
import { apiFetch } from "./api";

async function parseJsonOrFriendly(res: Response): Promise<unknown> {
  if (res.ok) return res.json();
  const raw = await res.text().catch(()=>"request failed");
  throw new Error(friendlyError(raw));
}

export async function analyzeViaServer(imageDataUrl: string, userLanguage?: string): Promise<{ structured: StructuredDiagram; summary: string; structure: string; data: string; whyItMatters: string; raw: string; model: string }> {
  const lang = userLanguage ?? loadPrefs().language;
  const res = await apiFetch("vision", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageDataUrl, userLanguage: lang }), signal: AbortSignal.timeout(52_000) });
  return parseJsonOrFriendly(res) as Promise<{ structured: StructuredDiagram; summary: string; structure: string; data: string; whyItMatters: string; raw: string; model: string }>;
}

export async function enrichDescriptionViaServer(structured: StructuredDiagram, userLanguage?: string): Promise<ReturnType<typeof parseEnrichedDescription>> {
  const question = `Using ONLY this diagram JSON, produce a comprehensive accessible description. Include every extracted heading, caption, small-text block, subcategory, relationship, visual detail, and uncertain element; do not compress subordinate details into a generic summary. Preserve all units, symbols, and formulas. Format exactly:\n[SUMMARY] 2-3 specific sentences\n[STRUCTURE] spatial layout, hierarchy, icons, colors, arrows, branches, and grouping\n[THE DATA] every extracted label, caption, value, sequence, trend, and comparison\n[WHY IT MATTERS] explain the diagram's message and how its parts support it in 2-4 sentences`;
  const result = await askTutorViaServer({ structured, history: [], question, level: "Detailed", userLanguage });
  return parseEnrichedDescription(result.answer);
}
export async function askTutorViaServer(opts: { structured: StructuredDiagram; history: Array<{role:"user"|"assistant",content:string}>; question: string; level?: string; userLanguage?: string }): Promise<{ answer: string; model: string }> {
  const payload = { ...opts, userLanguage: opts.userLanguage ?? loadPrefs().language } as typeof opts & { userLanguage: string };
  const res = await apiFetch("tutor", { method: "POST", headers: { "Content-Type":"application/json" }, body: JSON.stringify(payload), signal: AbortSignal.timeout(26_000) });
  return parseJsonOrFriendly(res) as Promise<{ answer: string; model: string }>;
}
