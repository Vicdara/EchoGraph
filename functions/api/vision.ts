export async function onRequestPost(context: { request: Request; env: Record<string, string> }) {
  try {
    const rawKeys =
      context.env.MISTRAL_API_KEYS ||
      context.env.VITE_MISTRAL_API_KEYS ||
      context.env.MISTRAL_API_KEY ||
      context.env.VITE_MISTRAL_API_KEY ||
      "";
    const keys = rawKeys
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);

    if (!keys.length) {
      return new Response(
        JSON.stringify({
          error: "No Mistral API keys found. Please add MISTRAL_API_KEYS to Cloudflare Pages Environment Variables.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body: any = await context.request.json().catch(() => null);
    if (!body || typeof body.imageDataUrl !== "string") {
      return new Response(
        JSON.stringify({ error: "A valid image data URL is required." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const imageDataUrl = body.imageDataUrl;
    if (!imageDataUrl.startsWith("data:image/")) {
      return new Response(
        JSON.stringify({ error: "Image must be a valid data:image URI." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const userLanguage =
      typeof body.userLanguage === "string" ? body.userLanguage : "English";

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
Rules: first perform exhaustive OCR across the entire image including titles, headings, arrow labels, captions, subtitles, legends, bullets, and annotations. Describe colors, visual flow, and hierarchy. Never invent numbers; preserve original scientific symbols/units. Return JSON only with no markdown wrapper.`;

    const models = ["mistral-small-latest", "ministral-8b-latest", "pixtral-12b-2409"];
    let lastError = "";

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
            const errTxt = await res.text();
            lastError = `${model} ${res.status}: ${errTxt.slice(0, 200)}`;
            continue;
          }

          const data: any = await res.json();
          const content = data.choices?.[0]?.message?.content || "";
          let structured: any;
          try {
            structured = JSON.parse(content);
          } catch {
            const cleaned = content.replace(/^```json/i, "").replace(/```$/, "").trim();
            structured = JSON.parse(cleaned);
          }

          const payload = {
            structured,
            raw: content,
            model,
            summary: structured.summary || "Diagram analysis complete.",
            key_takeaways: structured.important_findings || [],
            labels: structured.labels || [],
            data_points: structured.data_points || [],
            hierarchy: structured.hierarchy || [],
            relationships: structured.relationships || [],
            uncertain_elements: structured.uncertain_elements || [],
          };

          return new Response(JSON.stringify(payload), {
            status: 200,
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              "Access-Control-Allow-Origin": "*",
            },
          });
        } catch (err: any) {
          lastError = err.message || String(err);
        }
      }
    }

    return new Response(
      JSON.stringify({
        error: `Vision model request failed. Details: ${lastError}`,
      }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error: error.message || "An unexpected error occurred during image processing.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
