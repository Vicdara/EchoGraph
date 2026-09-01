import { buildVisionResponse } from "../../server/description";
import { analyzeWithMistral } from "../../server/vision";
import { clientError, json, readJson, serverError } from "../shared/http";

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") return clientError(405, "POST only");
  try {
    const body = await readJson(request, 5_500_000);
    if (!body) return clientError(400, "A valid request is required.");
    const imageDataUrl = typeof body.imageDataUrl === "string" ? body.imageDataUrl : "";
    if (!imageDataUrl.startsWith("data:image/")) return clientError(400, "A valid image is required.");
    if (imageDataUrl.length > 5_000_000) return clientError(413, "The image is too large. Please use an image under 3.5 MB.");
    const language = typeof body.userLanguage === "string" ? body.userLanguage.slice(0, 80) : "English";
    const vision = await analyzeWithMistral(imageDataUrl, language);
    return json(200, buildVisionResponse(vision));
  } catch (error) {
    return serverError("vision", error);
  }
}
