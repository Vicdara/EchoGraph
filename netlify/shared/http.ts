type ErrorCategory = "auth" | "busy" | "timeout" | "unavailable" | "unknown";

export function json(status: number, value: unknown): Response {
  return Response.json(value, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export function clientError(status: number, message: string): Response {
  return json(status, { success: false, message, error: message });
}

function categorize(error: unknown): ErrorCategory {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (message.includes("401") || message.includes("403") || message.includes("auth")) return "auth";
  if (message.includes("429") || message.includes("rate")) return "busy";
  if (message.includes("timeout") || message.includes("abort")) return "timeout";
  if (message.includes("502") || message.includes("503") || message.includes("unavailable")) return "unavailable";
  return "unknown";
}

function publicMessage(category: ErrorCategory): string {
  if (category === "busy") return "The AI service is busy. Please try again in a moment.";
  if (category === "timeout") return "The AI service took too long. Please try again.";
  return "We couldn't process that right now. Please try again.";
}

export function serverError(operation: string, error: unknown, status = 502): Response {
  const category = categorize(error);
  console.error(`[EchoGraph Netlify:${operation}]`, {
    category,
    errorType: error instanceof Error ? error.name : typeof error,
  });
  return clientError(status, publicMessage(category));
}

export async function readJson(request: Request, maxBytes: number): Promise<Record<string, unknown> | null> {
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > maxBytes) return null;
  const raw = await request.text();
  if (raw.length > maxBytes) return null;
  try {
    const value = JSON.parse(raw || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
  } catch {
    return null;
  }
}
