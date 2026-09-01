import { synthesizeWithMistral } from "../../server/ttsProvider";
import { publicError, readJson, sendJson, type ApiRequest, type ApiResponse } from "../http";

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== "POST") return sendJson(res, 405, { error: "POST only" });
  try {
    const body = await readJson(req);
    const text = typeof body.text === "string" ? body.text.trim() : "";
    if (!text) return sendJson(res, 400, { error: "Text is required." });
    const language = typeof body.language === "string" ? body.language : "English";
    try {
      const audio = await synthesizeWithMistral(text, language);
      res.statusCode = 200;
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Content-Length", String(audio.length));
      res.end(audio);
    } catch {
      sendJson(res, 200, { fallback: true, text });
    }
  } catch (error) {
    sendJson(res, 500, { error: publicError(error) });
  }
}
