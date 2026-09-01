export async function onRequestPost(context: { request: Request; env: Record<string, string> }) {
  try {
    const groqKeys = (
      context.env.GROQ_API_KEYS ||
      context.env.VITE_GROQ_API_KEYS ||
      context.env.GROQ_API_KEY ||
      ""
    )
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);

    const formData = await context.request.formData().catch(() => null);
    if (!formData) {
      return new Response(
        JSON.stringify({ error: "Invalid form data request." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const audio = formData.get("audio");
    if (!audio) {
      return new Response(
        JSON.stringify({ error: "Audio file field 'audio' is required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    for (const key of groqKeys) {
      try {
        const groqBody = new FormData();
        groqBody.append("file", audio);
        groqBody.append("model", "whisper-large-v3-turbo");
        groqBody.append("response_format", "json");

        const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}` },
          body: groqBody,
        });

        if (res.ok) {
          const data: any = await res.json();
          return new Response(JSON.stringify({ text: data.text || "" }), {
            status: 200,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          });
        }
      } catch {}
    }

    return new Response(
      JSON.stringify({ error: "Transcription service unavailable. Check Groq API keys." }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
