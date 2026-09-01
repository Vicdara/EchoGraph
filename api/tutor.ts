import { askTutor } from "../server/tutor";
import type { ExplanationLevel, StructuredDiagram } from "../src/types/diagram";
import { publicError, readJson, sendJson, type ApiRequest, type ApiResponse } from "./http";

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== "POST") return sendJson(res, 405, { error: "POST only" });
  try {
    const body = await readJson(req);
    if (!body.structured || typeof body.question !== "string") return sendJson(res, 400, { error: "A diagram and question are required." });
    const level: ExplanationLevel = body.level === "Simple" || body.level === "Detailed" ? body.level : "Standard";
    const result = await askTutor({
      structured: body.structured as StructuredDiagram,
      history: Array.isArray(body.history) ? body.history as Array<{ role: "user" | "assistant"; content: string }> : [],
      question: body.question,
      level,
      userLanguage: typeof body.userLanguage === "string" ? body.userLanguage : "English",
    });
    sendJson(res, 200, result);
  } catch (error) {
    sendJson(res, 502, { error: publicError(error) });
  }
}
