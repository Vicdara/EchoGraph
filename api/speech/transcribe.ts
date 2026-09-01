import { transcribeWithGroq, transcribeWithMistral } from "../../server/whisper";
import { publicError, readBuffer, sendJson, type ApiRequest, type ApiResponse } from "../http";

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== "POST") return sendJson(res, 405, { error: "POST only" });
  try {
    const audio = await readBuffer(req);
    if (audio.length < 100) return sendJson(res, 400, { error: "The recording is too short." });
    if (audio.length > 8_000_000) return sendJson(res, 413, { error: "The recording is too large." });
    const languageHeader = req.headers["x-language"];
    const language = Array.isArray(languageHeader) ? languageHeader[0] : languageHeader;
    try {
      const text = await transcribeWithGroq(audio, "recording.webm", String(req.headers["content-type"] || "audio/webm"), language);
      sendJson(res, 200, { text });
    } catch {
      const text = await transcribeWithMistral(audio, language);
      sendJson(res, 200, { text });
    }
  } catch (error) {
    sendJson(res, 502, { error: publicError(error) });
  }
}
