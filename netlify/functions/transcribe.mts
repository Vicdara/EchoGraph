import { transcribeWithGroq, transcribeWithMistral } from "../../server/whisper";
import { clientError, json, serverError } from "../shared/http";

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") return clientError(405, "POST only");
  try {
    const declaredLength = Number(request.headers.get("content-length") || 0);
    if (declaredLength > 4_500_000) return clientError(413, "The recording is too large.");
    const audio = Buffer.from(await request.arrayBuffer());
    if (audio.length < 100) return clientError(400, "The recording is too short.");
    if (audio.length > 4_500_000) return clientError(413, "The recording is too large.");
    const language = request.headers.get("x-language")?.slice(0, 30);
    const mime = request.headers.get("content-type") || "audio/webm";
    try {
      const text = await transcribeWithGroq(audio, "recording.webm", mime, language);
      return json(200, { text });
    } catch {
      const text = await transcribeWithMistral(audio, language);
      return json(200, { text });
    }
  } catch (error) {
    return serverError("transcribe", error);
  }
}
