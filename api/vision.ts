import { buildVisionResponse } from "../server/description";
import { analyzeWithMistral } from "../server/vision";
import { publicError, readJson, sendJson, type ApiRequest, type ApiResponse } from "./http";

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== "POST") return sendJson(res, 405, { error: "POST only" });
  try {
    const body = await readJson(req);
    const imageDataUrl = typeof body.imageDataUrl === "string" ? body.imageDataUrl : "";
    if (!imageDataUrl.startsWith("data:image/")) return sendJson(res, 400, { error: "A valid image is required." });
    if (imageDataUrl.length > 5_000_000) return sendJson(res, 413, { error: "The image is too large. Please use an image under 3.5 MB." });
    const language = typeof body.userLanguage === "string" ? body.userLanguage : "English";
    const vision = await analyzeWithMistral(imageDataUrl, language);
    sendJson(res, 200, buildVisionResponse(vision));
  } catch (error) {
    sendJson(res, 502, { error: publicError(error) });
  }
}
