import type { StructuredDiagram } from "../src/types/diagram";
import { mistralPool } from "./providerManager";

const VISION_MODELS = ["mistral-small-latest", "ministral-8b-latest"] as const;

const VISION_PROMPT = (userLanguage = "English") => `You are EchoGraph Vision for blind students. Analyze the image and return ONLY valid JSON with this shape (adapt per diagram type, omit irrelevant keys but keep all that apply):
{
  "diagram_type": "chart|flowchart|geometry|biology|map|circuit|table|photo|other",
  "title": "",
  "summary": "2-3 sentences explaining the subject, purpose, and overall takeaway in ${userLanguage}",
  "labels": [],
  "original_labels": [],
  "translated_labels": [],
  "detected_diagram_language": "English|French|...",
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
Rules: first perform exhaustive OCR across the entire image, including title, headings, arrow labels, captions, subtitles, legends, bullets, annotations, and small text beneath icons. Never omit a readable text block merely because it is subordinate. Store each block in text_blocks and connect it to its parent section. Describe icons, colors, grouping, indentation, and visual hierarchy in visual_details and hierarchy. For flowcharts, capture every main step, branch, subcategory, connector, and explanatory caption. Never invent labels/values; preserve original scientific values/symbols/formulas/units exactly — do not translate numbers/units/formulas; put translated human labels in translated_labels only; never silently alter values; distinguish observation from inference; put partially or fully unreadable text in uncertain_elements with its position and confidence instead of guessing. Make important_findings specific and comprehensive. Return JSON only, no markdown.`;

export async function analyzeWithMistral(base64DataUrl: string, userLanguage = "English"): Promise<{ structured: StructuredDiagram; raw: string; model: string }> {
  let lastError = "No Mistral keys configured (MISTRAL_API_KEYS)";

  for (let attempt = 0; attempt < VISION_MODELS.length; attempt++) {
    const model = VISION_MODELS[attempt];
    const entry = mistralPool.pick();
    if (!entry) break;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 18_000);
    const start = Date.now();
    let status: number | undefined;

    try {
      const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${entry.key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: [{ type: "text", text: VISION_PROMPT(userLanguage) }, { type: "image_url", image_url: { url: base64DataUrl } }] }],
          temperature: 0.2, max_tokens: 1800, response_format: { type: "json_object" } as unknown as object,
        }),
        signal: controller.signal,
      });
      status = res.status;
      if (!res.ok) throw new Error(`${res.status}: ${(await res.text()).slice(0,300)}`);

      const j = await res.json();
      const content: string = j.choices?.[0]?.message?.content || "";
      let structured: StructuredDiagram;
      try { structured = JSON.parse(content); } catch {
        const match = content.match(/\{[\s\S]*\}/);
        if (!match) throw new Error("Vision did not return JSON");
        structured = JSON.parse(match[0]);
      }
      mistralPool.markSuccess(entry, Date.now() - start);
      return { structured, raw: content, model };
    } catch (error) {
      lastError = (error as Error).name === "AbortError" ? "Mistral request timed out" : ((error as Error).message || "vision failed");
      mistralPool.markFailure(entry, lastError, status);
      console.warn(`[EchoGraph Vision] ${model} failed`, {
        status: status || "network-or-timeout",
        errorType: error instanceof Error ? error.name : typeof error,
      });
      if (status === 401 || status === 403) break;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error(lastError);
}
