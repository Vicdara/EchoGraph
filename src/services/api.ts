export type ApiEndpoint = "vision" | "tutor" | "transcribe" | "tts";

export async function apiFetch(endpoint: ApiEndpoint, init: RequestInit): Promise<Response> {
  const primaryUrl = `/api/${endpoint}`;
  try {
    const res = await fetch(primaryUrl, { ...init, credentials: "same-origin" });
    if (res.status !== 404) return res;
  } catch {}

  const fallbackUrl = `/.netlify/functions/${endpoint}`;
  return fetch(fallbackUrl, { ...init, credentials: "same-origin" });
}

