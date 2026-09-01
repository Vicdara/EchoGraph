import { ProviderPool } from "../src/services/providerManager";

// server-side pools for GROQ whisper + MISTRAL vision + OPENCODE reasoning
// parses MISTRAL_API_KEYS,GROQ_API_KEYS,OPENCODE_API_KEYS comma-separated
function parseKeys(envVal?: string): string[] {
  if (!envVal) return [];
  return envVal.split(",").map(s=>s.trim()).filter(Boolean);
}

export const groqPool = new ProviderPool(parseKeys(process.env.GROQ_API_KEYS));
export const mistralPool = new ProviderPool(parseKeys(process.env.MISTRAL_API_KEYS));
export const opencodePool = new ProviderPool(parseKeys(process.env.OPENCODE_API_KEYS));
