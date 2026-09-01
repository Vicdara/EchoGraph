import { synthesizeWithMistral } from "../../server/ttsProvider";
import { clientError, json, readJson, serverError } from "../shared/http";

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") return clientError(405, "POST only");
  try {
    const body = await readJson(request, 20_000);
    if (!body) return clientError(400, "A valid request is required.");
    const text = typeof body.text === "string" ? body.text.trim().slice(0, 3_500) : "";
    if (!text) return clientError(400, "Text is required.");
    const language = typeof body.language === "string" ? body.language.slice(0, 80) : "English";
    try {
      const audio = await synthesizeWithMistral(text, language);
      return new Response(Uint8Array.from(audio), {
        status: 200,
        headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
      });
    } catch {
      return json(200, { fallback: true, text });
    }
  } catch (error) {
    return serverError("tts", error, 500);
  }
}
