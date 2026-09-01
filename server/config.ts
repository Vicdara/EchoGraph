export const OPENCODE_MODEL_ORDER = (process.env.OPENCODE_MODEL_ORDER || "nemotron-ultra,laguna").split(",").map(s=>s.trim().toLowerCase()).filter(Boolean);
// map short names to actual OpenCode model ids
export const OPENCODE_MODEL_IDS: Record<string,string> = {
  hy3: "hy3-free",
  laguna: "laguna-s-2.1-free",
  nemotron: "nemotron-3-ultra-free",
  "nemotron-ultra": "nemotron-3-ultra-free",
  "nemotron-lightning": "nemotron-3.5-lightning-free",
};
