import type { StructuredDiagram } from "../types/diagram";
import { loadPrefs } from "./preferences";
import { friendlyError } from "./statusBus";
import { parseEnrichedDescription } from "../utils/structuredText";
import { apiFetch } from "./api";

function getMistralKeys(): string[] {
  const envRaw =
    import.meta.env.VITE_MISTRAL_API_KEYS ||
    import.meta.env.VITE_MISTRAL_API_KEY ||
    "";
  return envRaw.split(",").map((s: string) => s.trim()).filter(Boolean);
}

function getGroqKeys(): string[] {
  const envRaw =
    import.meta.env.VITE_GROQ_API_KEYS ||
    import.meta.env.VITE_GROQ_API_KEY ||
    "";
  return envRaw.split(",").map((s: string) => s.trim()).filter(Boolean);
}

function getOpencodeKeys(): string[] {
  const envRaw =
    import.meta.env.VITE_OPENCODE_API_KEYS ||
    import.meta.env.VITE_OPENCODE_API_KEY ||
    "";
  return envRaw.split(",").map((s: string) => s.trim()).filter(Boolean);
}

async function analyzeViaDirectMistral(
  imageDataUrl: string,
  userLanguage = "English"
): Promise<{
  structured: StructuredDiagram;
  summary: string;
  structure: string;
  data: string;
  whyItMatters: string;
  raw: string;
  model: string;
}> {
  const keys = getMistralKeys();
  if (!keys.length) {
    throw new Error(
      "No Mistral API keys found. Please add VITE_MISTRAL_API_KEYS to Cloudflare Pages Environment Variables and click Retry deployment."
    );
  }

  const prompt = `You are EchoGraph Vision for blind students. Analyze the image and return ONLY valid JSON with this shape:
{
  "diagram_type": "chart|flowchart|geometry|biology|map|circuit|table|photo|other",
  "title": "",
  "summary": "2-3 sentences explaining the subject, purpose, and overall takeaway in ${userLanguage}",
  "labels": [],
  "original_labels": [],
  "translated_labels": [],
  "detected_diagram_language": "English",
  "user_language": "${userLanguage}",
  "axes": {"x": {"label":"", "units":"", "scale":""}, "y": {"label":"", "units":"", "scale":""}},
  "data_points": [{"label":"", "value": "", "units":""}],
  "objects": [],
  "text_blocks": [{"heading":"", "text":"", "position":"", "parent":""}],
  "visual_details": [],
  "hierarchy": [],
  "relationships": [],
  "arrows": [{"from":"", "to":"", "label":"", "direction":""}],
  "sequence": [],
  "trends": [],
  "important_findings": [],
  "spatial_layout": [],
  "uncertain_elements": []
}
Rules: perform exhaustive OCR, describe all visuals, return valid JSON only without markdown codeblocks.`;

  const models = ["mistral-small-latest", "ministral-8b-latest", "pixtral-12b-2409"];
  let lastErr = "";

  for (const key of keys) {
    for (const model of models) {
      try {
        const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: prompt },
                  { type: "image_url", image_url: { url: imageDataUrl } },
                ],
              },
            ],
            temperature: 0.2,
            max_tokens: 2200,
            response_format: { type: "json_object" },
          }),
        });

        if (!res.ok) {
          lastErr = `${model} ${res.status}: ${(await res.text()).slice(0, 200)}`;
          continue;
        }

        const data = await res.json();
        const content = data.choices?.[0]?.message?.content || "";
        let structured: any;
        try {
          structured = JSON.parse(content);
        } catch {
          const cleaned = content.replace(/^```json/i, "").replace(/```$/, "").trim();
          structured = JSON.parse(cleaned);
        }

        return {
          structured,
          raw: content,
          model,
          summary: structured.summary || "Diagram analysis complete.",
          structure: "",
          data: "",
          whyItMatters: "",
        };
      } catch (err: any) {
        lastErr = err.message || String(err);
      }
    }
  }

  throw new Error(friendlyError(lastErr || "Vision analysis failed"));
}

export async function analyzeViaServer(
  imageDataUrl: string,
  userLanguage?: string
): Promise<{
  structured: StructuredDiagram;
  summary: string;
  structure: string;
  data: string;
  whyItMatters: string;
  raw: string;
  model: string;
}> {
  const lang = userLanguage ?? loadPrefs().language;

  try {
    const res = await apiFetch("vision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageDataUrl, userLanguage: lang }),
      signal: AbortSignal.timeout(35_000),
    });

    if (res.ok) {
      const parsed = await res.json();
      if (parsed && (parsed.structured || parsed.summary)) {
        return parsed as {
          structured: StructuredDiagram;
          summary: string;
          structure: string;
          data: string;
          whyItMatters: string;
          raw: string;
          model: string;
        };
      }
    }
  } catch (e) {
    console.warn("[EchoGraph] Serverless vision endpoint unreachable, falling back to direct AI client:", e);
  }

  // Direct client fallback
  return analyzeViaDirectMistral(imageDataUrl, lang);
}

export async function enrichDescriptionViaServer(
  structured: StructuredDiagram,
  userLanguage?: string
): Promise<ReturnType<typeof parseEnrichedDescription>> {
  const question = `Using ONLY this diagram JSON, produce a comprehensive accessible description. Include every extracted heading, caption, small-text block, subcategory, relationship, visual detail, and uncertain element; do not compress subordinate details into a generic summary. Preserve all units, symbols, and formulas. Format exactly:\n[SUMMARY] 2-3 specific sentences\n[STRUCTURE] spatial layout, hierarchy, icons, colors, arrows, branches, and grouping\n[THE DATA] every extracted label, caption, value, sequence, trend, and comparison\n[WHY IT MATTERS] explain the diagram's message and how its parts support it in 2-4 sentences`;
  const result = await askTutorViaServer({ structured, history: [], question, level: "Detailed", userLanguage });
  return parseEnrichedDescription(result.answer);
}

export async function askTutorViaServer(opts: {
  structured: StructuredDiagram;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  question: string;
  level?: string;
  userLanguage?: string;
}): Promise<{ answer: string; model: string }> {
  const payload = { ...opts, userLanguage: opts.userLanguage ?? loadPrefs().language };

  try {
    const res = await apiFetch("tutor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20_000),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.answer) return data;
    }
  } catch (e) {
    console.warn("[EchoGraph] Tutor server endpoint unreachable, falling back to direct AI tutor:", e);
  }

  // Direct client AI tutor fallback
  const opencodeKeys = getOpencodeKeys();
  const groqKeys = getGroqKeys();
  const mistralKeys = getMistralKeys();

  const messages = [
    {
      role: "system",
      content: `You are EchoGraph Tutor, an accessibility assistant for blind students. Respond in ${payload.userLanguage}. Answer accurately based on the diagram JSON.`,
    },
    { role: "user", content: `DIAGRAM DATA:\n${JSON.stringify(payload.structured)}` },
    ...payload.history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: payload.question },
  ];

  // 1. OpenCode
  for (const key of opencodeKeys) {
    for (const model of ["nemotron-3-ultra-free", "laguna-s-2.1-free", "gpt-4o-mini"]) {
      try {
        const res = await fetch("https://opencode.ai/zen/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model, messages, temperature: 0.3, max_tokens: 800 }),
        });
        if (res.ok) {
          const j = await res.json();
          const answer = j.choices?.[0]?.message?.content?.trim();
          if (answer) return { answer, model };
        }
      } catch {}
    }
  }

  // 2. Groq
  for (const key of groqKeys) {
    for (const model of ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"]) {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model, messages, temperature: 0.3, max_tokens: 800 }),
        });
        if (res.ok) {
          const j = await res.json();
          const answer = j.choices?.[0]?.message?.content?.trim();
          if (answer) return { answer, model };
        }
      } catch {}
    }
  }

  // 3. Mistral
  for (const key of mistralKeys) {
    for (const model of ["mistral-small-latest", "ministral-8b-latest"]) {
      try {
        const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model, messages, temperature: 0.3, max_tokens: 800 }),
        });
        if (res.ok) {
          const j = await res.json();
          const answer = j.choices?.[0]?.message?.content?.trim();
          if (answer) return { answer, model };
        }
      } catch {}
    }
  }

  return {
    answer: "I am ready to answer your questions about this diagram. What specific data point or section would you like to explore?",
    model: "EchoGraph Built-in Tutor",
  };
}
