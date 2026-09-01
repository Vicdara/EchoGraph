import { askTutor } from "../../server/tutor";
import type { ExplanationLevel, StructuredDiagram } from "../../src/types/diagram";
import { clientError, json, readJson, serverError } from "../shared/http";

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") return clientError(405, "POST only");
  try {
    const body = await readJson(request, 1_000_000);
    if (!body || !body.structured || typeof body.question !== "string") return clientError(400, "A diagram and question are required.");
    const question = body.question.trim().slice(0, 5_000);
    if (!question) return clientError(400, "A question is required.");
    const level: ExplanationLevel = body.level === "Simple" || body.level === "Detailed" ? body.level : "Standard";
    const history = Array.isArray(body.history) ? body.history.slice(-6).filter((entry): entry is { role: "user" | "assistant"; content: string } => {
      if (!entry || typeof entry !== "object") return false;
      const item = entry as { role?: unknown; content?: unknown };
      return (item.role === "user" || item.role === "assistant") && typeof item.content === "string";
    }).map(entry => ({ ...entry, content: entry.content.slice(0, 5_000) })) : [];
    const result = await askTutor({
      structured: body.structured as StructuredDiagram,
      history,
      question,
      level,
      userLanguage: typeof body.userLanguage === "string" ? body.userLanguage.slice(0, 80) : "English",
    });
    return json(200, result);
  } catch (error) {
    return serverError("tutor", error);
  }
}
