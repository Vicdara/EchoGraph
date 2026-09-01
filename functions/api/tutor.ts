export async function onRequestPost(context: { request: Request; env: Record<string, string> }) {
  try {
    const opencodeKeys = (
      context.env.OPENCODE_API_KEYS ||
      context.env.VITE_OPENCODE_API_KEYS ||
      context.env.OPENCODE_API_KEY ||
      ""
    )
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);

    const groqKeys = (
      context.env.GROQ_API_KEYS ||
      context.env.VITE_GROQ_API_KEYS ||
      context.env.GROQ_API_KEY ||
      ""
    )
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);

    const mistralKeys = (
      context.env.MISTRAL_API_KEYS ||
      context.env.VITE_MISTRAL_API_KEYS ||
      context.env.MISTRAL_API_KEY ||
      ""
    )
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);

    const body: any = await context.request.json().catch(() => null);
    if (!body || typeof body.question !== "string") {
      return new Response(
        JSON.stringify({ error: "A valid question is required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const question = body.question;
    const structured = body.structured || {};
    const history = Array.isArray(body.history) ? body.history : [];
    const level = body.level || "Standard";
    const userLanguage = body.userLanguage || "English";

    const levelHint: Record<string, string> = {
      Simple: "Use simple vocabulary, short sentences, beginner-friendly. Do not change facts.",
      Standard: "Clear, standard explanation.",
      Detailed: "Thorough, detailed explanation with specifics.",
    };

    const systemPrompt = `You are EchoGraph Tutor, an accessibility tutor for blind/low-vision students. Respond in ${userLanguage} while preserving original diagram labels and numbers.\n${
      levelHint[level] || levelHint.Standard
    }\nRules: Answer only from the provided diagram JSON when the question relates to the diagram; never invent values/labels; if uncertain say so clearly.`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `DIAGRAM DATA:\n${JSON.stringify(structured)}` },
      ...history.slice(-6).map((m: any) => ({ role: m.role, content: m.content })),
      { role: "user", content: question },
    ];

    // 1. Try OpenCode
    for (const key of opencodeKeys) {
      for (const model of ["nemotron-3-ultra-free", "laguna-s-2.1-free", "gpt-4o-mini"]) {
        try {
          const res = await fetch("https://opencode.ai/zen/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model,
              messages,
              temperature: 0.3,
              max_tokens: level === "Simple" ? 300 : level === "Detailed" ? 750 : 500,
            }),
          });
          if (res.ok) {
            const data: any = await res.json();
            const answer = data.choices?.[0]?.message?.content?.trim();
            if (answer) {
              return new Response(JSON.stringify({ answer, model }), {
                status: 200,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
              });
            }
          }
        } catch {}
      }
    }

    // 2. Try Groq
    for (const key of groqKeys) {
      for (const model of ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"]) {
        try {
          const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model,
              messages,
              temperature: 0.3,
              max_tokens: level === "Simple" ? 300 : level === "Detailed" ? 750 : 500,
            }),
          });
          if (res.ok) {
            const data: any = await res.json();
            const answer = data.choices?.[0]?.message?.content?.trim();
            if (answer) {
              return new Response(JSON.stringify({ answer, model }), {
                status: 200,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
              });
            }
          }
        } catch {}
      }
    }

    // 3. Try Mistral
    for (const key of mistralKeys) {
      for (const model of ["mistral-small-latest", "ministral-8b-latest"]) {
        try {
          const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model,
              messages,
              temperature: 0.3,
              max_tokens: level === "Simple" ? 300 : level === "Detailed" ? 750 : 500,
            }),
          });
          if (res.ok) {
            const data: any = await res.json();
            const answer = data.choices?.[0]?.message?.content?.trim();
            if (answer) {
              return new Response(JSON.stringify({ answer, model }), {
                status: 200,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
              });
            }
          }
        } catch {}
      }
    }

    return new Response(
      JSON.stringify({
        error: "AI tutor service temporarily unavailable. Please verify API keys in Cloudflare Pages.",
      }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
