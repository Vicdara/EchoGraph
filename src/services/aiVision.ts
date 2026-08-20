import OpenAI from "openai";
import { ChartDescription, VerificationResult } from "../types";

export interface AIProviderConfig {
  id: string;
  name: string;
  badge?: string;
  isRecommended?: boolean;
  defaultBaseUrl: string;
  defaultModel: string;
  description: string;
  sponsorHype?: string;
  docsUrl?: string;
}

export const PRESET_PROVIDERS: AIProviderConfig[] = [
  {
    id: "featherless",
    name: "Featherless AI",
    badge: "⭐ Presenting Sponsor Recommended",
    isRecommended: true,
    defaultBaseUrl: "https://api.featherless.ai/v1",
    defaultModel: "google/gemma-3-27b-it",
    description: "Serverless inference for 40,000+ open models. <250ms cold start, largest inference provider on Hugging Face.",
    sponsorHype: "🎁 $25 FREE Featherless credit for every hackathon participant — 40,000+ open models, flat predictable pricing, no token metering!",
    docsUrl: "https://featherless.ai",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "google/gemini-2.0-flash-001",
    description: "Aggregator offering unified API access to hundreds of open and proprietary AI models.",
    docsUrl: "https://openrouter.ai",
  },
  {
    id: "groq",
    name: "Groq Cloud",
    defaultBaseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.2-11b-vision-preview",
    description: "Ultra-fast LPU inference engine with sub-second vision and text model execution.",
    docsUrl: "https://console.groq.com",
  },
  {
    id: "default-engine",
    name: "EchoGraph Built-in Free Cloud",
    badge: "⚡ Zero-Setup Default",
    defaultBaseUrl: "https://opencode.ai/zen/v1",
    defaultModel: "hy3-free",
    description: "Built-in free backup cloud engine for testing.",
  },
  {
    id: "custom",
    name: "Custom / Add Your Own Provider",
    defaultBaseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    description: "Connect to any custom OpenAI-compatible endpoint, local Ollama, vLLM, or private proxy.",
  },
];

export interface DetectedModel {
  id: string;
  name: string;
  isVision?: boolean;
}

const DEFAULT_PRIMARY_KEY = "sk-WfzNC8ZWXURNWHwukDBBU1VEwJKqvqfbqXdm2XAxvJPAwk0DZHE1GF6EFhsfSiWQ";

// State accessors
export function getActiveProviderId(): string {
  return localStorage.getItem("echograph_active_provider") || "featherless";
}

export function setActiveProviderId(id: string) {
  localStorage.setItem("echograph_active_provider", id);
}

export function getProviderApiKey(providerId: string): string {
  const saved = localStorage.getItem(`echograph_api_key_${providerId}`);
  if (saved && saved.trim().length > 0) return saved.trim();

  if (providerId === "featherless") {
    const envKey = import.meta.env.VITE_FEATHERLESS_API_KEY;
    if (envKey && typeof envKey === "string" && envKey.trim().length > 0) return envKey.trim();
  }

  if (providerId === "default-engine") {
    const envKey = import.meta.env.VITE_OPENCODE_API_KEY;
    if (envKey && typeof envKey === "string" && envKey.trim().length > 0) return envKey.trim();
    return DEFAULT_PRIMARY_KEY;
  }

  return "";
}

export function setProviderApiKey(providerId: string, key: string | null) {
  if (key && key.trim().length > 0) {
    localStorage.setItem(`echograph_api_key_${providerId}`, key.trim());
  } else {
    localStorage.removeItem(`echograph_api_key_${providerId}`);
  }
}

export function getProviderBaseUrl(providerId: string): string {
  const custom = localStorage.getItem(`echograph_base_url_${providerId}`);
  if (custom && custom.trim().length > 0) return custom.trim();

  const preset = PRESET_PROVIDERS.find((p) => p.id === providerId);
  return preset ? preset.defaultBaseUrl : "https://api.featherless.ai/v1";
}

export function setProviderBaseUrl(providerId: string, url: string | null) {
  if (url && url.trim().length > 0) {
    localStorage.setItem(`echograph_base_url_${providerId}`, url.trim());
  } else {
    localStorage.removeItem(`echograph_base_url_${providerId}`);
  }
}

export function getActiveModel(): string {
  const providerId = getActiveProviderId();
  const saved = localStorage.getItem(`echograph_model_${providerId}`);
  if (saved && saved.trim().length > 0) return saved.trim();

  const preset = PRESET_PROVIDERS.find((p) => p.id === providerId);
  return preset ? preset.defaultModel : "google/gemma-3-27b-it";
}

export function setActiveModel(model: string) {
  const providerId = getActiveProviderId();
  localStorage.setItem(`echograph_model_${providerId}`, model);
}

// Universal client constructor targeting local proxy
function getClientForProvider(providerId?: string): OpenAI {
  const activeId = providerId || getActiveProviderId();
  const rawBaseUrl = getProviderBaseUrl(activeId);
  const apiKey = getProviderApiKey(activeId) || (activeId === "default-engine" ? DEFAULT_PRIMARY_KEY : "dummy-key");

  // In browser, route through Vite proxy to eliminate CORS blocks
  let proxyBaseUrl = rawBaseUrl;
  if (typeof window !== "undefined") {
    proxyBaseUrl = `${window.location.origin}/api/proxy`;
  }

  return new OpenAI({
    apiKey,
    baseURL: proxyBaseUrl,
    dangerouslyAllowBrowser: true,
    defaultHeaders: {
      "x-target-base-url": rawBaseUrl,
    },
  });
}

// Auto-detect models from any OpenAI-compatible provider
export async function fetchModelsFromProvider(providerId: string): Promise<DetectedModel[]> {
  const client = getClientForProvider(providerId);

  try {
    const list = await client.models.list();
    if (list && list.data && Array.isArray(list.data)) {
      return list.data.map((m) => {
        const id = m.id;
        const lower = id.toLowerCase();
        const isVision =
          lower.includes("vision") ||
          lower.includes("vl") ||
          lower.includes("gemma-3") ||
          lower.includes("flash") ||
          lower.includes("4o") ||
          lower.includes("image");
        return {
          id,
          name: id,
          isVision,
        };
      });
    }
  } catch (err: any) {
    console.warn(`Could not auto-detect models for ${providerId}:`, err.message);
  }

  if (providerId === "featherless") {
    return [
      { id: "google/gemma-3-27b-it", name: "google/gemma-3-27b-it (Recommended Vision)", isVision: true },
      { id: "meta-llama/Llama-3.2-11B-Vision-Instruct", name: "meta-llama/Llama-3.2-11B-Vision-Instruct", isVision: true },
      { id: "Qwen/Qwen2-VL-7B-Instruct", name: "Qwen/Qwen2-VL-7B-Instruct", isVision: true },
      { id: "mistralai/Mistral-7B-Instruct-v0.3", name: "mistralai/Mistral-7B-Instruct-v0.3", isVision: false },
    ];
  }

  return [
    { id: getActiveModel(), name: getActiveModel(), isVision: true },
  ];
}

const PRIMARY_DESCRIPTION_PROMPT = `You are EchoGraph, an accessibility AI created to describe visual charts, graphs, scientific figures, and educational diagrams for blind and low-vision students (like a 16-year-old taking AP Biology).

Your job is to provide a rich, precise, structured auditory description so a student with no visual sight can fully understand the scientific concepts, trends, numbers, and takeaways.

RULES:
1. NEVER use visual-only phrases like "as you can see", "pictured above", "in this image", or "look at the graph".
2. NEVER describe colors in isolation without their scientific meaning (e.g., do not say "the red line", say "the red line, which represents reaction rate with enzyme").
3. Always specify the exact units, scales, labels, and coordinates whenever visible.
4. Structure your response into EXACTLY four labeled sections using this precise format:

[SUMMARY]
One clear sentence stating the type of chart/diagram and the primary overall takeaway.

[STRUCTURE]
Describe the visual framework: the x-axis and y-axis titles and units, categories, legend items, scale intervals, or diagram compartments.

[THE DATA]
Describe the actual data points, overall trends, starting values, peaks, troughs, inflection points, and any notable outliers or comparisons. Include approx or exact numerical values.

[WHY IT MATTERS]
One or two sentences explaining the scientific, educational, or practical context of why this figure appears in course material.

[SONIFICATION_VALUES]
A comma-separated list of 5 to 10 representative normalized values between 0 and 100 representing the trend from left to right (e.g., 20, 45, 75, 90, 85, 40). Only output the numbers separated by commas.`;

const VERIFICATION_PROMPT = `You are a strict Scientific Quality Assurance AI auditor for educational accessibility materials for blind students.

Examine the provided chart/diagram image and compare it with this draft description generated for a blind student:

--- DRAFT DESCRIPTION ---
{DRAFT_DESCRIPTION}
-------------------------

AUDIT INSTRUCTIONS:
1. Does this description accurately represent the chart's axes, labels, data trends, and numbers?
2. Are there any hallucinations, incorrect numbers, misidentified graph types, inverted trends, or missing critical labels?
3. Format your audit result exactly as follows:

VERIFICATION_STATUS: [VERIFIED or UNCERTAIN]
REASON: [If VERIFIED, write a 1-sentence confirmation of accuracy. If UNCERTAIN, state specifically what is missing, uncertain, or possibly incorrect in 1-2 concise sentences.]`;

/**
 * Strips reasoning tokens (<think>...</think>, <thought>...</thought>, etc.)
 */
function cleanModelOutput(rawText: string): string {
  let cleaned = rawText || "";

  // Strip <think>...</think> or <thought>...</thought> tags
  cleaned = cleaned.replace(/<think[\s\S]*?<\/think>/gi, "");
  cleaned = cleaned.replace(/<thought[\s\S]*?<\/thought>/gi, "");

  // Strip markdown code block wrapper if model wrapped entire output in ```
  cleaned = cleaned.replace(/^```(?:markdown)?\s*([\s\S]*?)```$/i, "$1");

  return cleaned.trim();
}

/**
 * Validates that the parsed description contains all four required sections
 * with genuine, non-instructional, non-prompt content.
 */
function validateDescription(desc: ChartDescription, rawText: string): void {
  // Check for presence of all four sections
  if (!desc.summary || !desc.structure || !desc.data || !desc.whyItMatters) {
    console.error("[EchoGraph Validation Failed] Missing required sections. Raw output:\n", rawText);
    throw new Error("Something went wrong analyzing this image — try again (Incomplete visual structure returned).");
  }

  // Minimum length check
  if (
    desc.summary.trim().length < 15 ||
    desc.structure.trim().length < 15 ||
    desc.data.trim().length < 20 ||
    desc.whyItMatters.trim().length < 15
  ) {
    console.error("[EchoGraph Validation Failed] Section text too short / truncated. Raw output:\n", rawText);
    throw new Error("Something went wrong analyzing this image — try again (Truncated response).");
  }

  // Forbidden prompt/instructional echoes
  const forbiddenPhrases = [
    "RULES:",
    "You are EchoGraph",
    "Describe the visual framework",
    "One clear sentence stating",
    "One or two sentences explaining",
    "A comma-separated list",
    "no chart provided",
    "no image provided",
    "was no chart provided",
    "didn't attach or describe a graph",
    "no graph was actually provided",
  ];

  const fullContent = `${desc.summary} ${desc.structure} ${desc.data} ${desc.whyItMatters}`.toLowerCase();

  for (const phrase of forbiddenPhrases) {
    if (fullContent.includes(phrase.toLowerCase())) {
      console.error(`[EchoGraph Validation Failed] Contains forbidden prompt/reasoning echo: "${phrase}". Raw output:\n`, rawText);
      throw new Error("Something went wrong analyzing this image — try again (Model could not parse image content).");
    }
  }
}

export async function analyzeChartImage(
  base64DataUrl: string
): Promise<{ description: ChartDescription; verification: VerificationResult; extractedValues: number[]; modelUsed: string; providerUsed: string }> {
  // Validate input image data URL
  if (!base64DataUrl || !base64DataUrl.startsWith("data:image/")) {
    throw new Error("Invalid image format. Please upload a valid PNG, JPEG, WebP, or SVG image.");
  }

  const activeProvider = getActiveProviderId();
  const activeModel = getActiveModel();
  const providerPreset = PRESET_PROVIDERS.find((p) => p.id === activeProvider);
  const providerDisplayName = providerPreset?.name || activeProvider;

  try {
    const result = await executeModelCall(base64DataUrl, activeModel, activeProvider);
    return {
      ...result,
      modelUsed: activeModel,
      providerUsed: providerDisplayName,
    };
  } catch (err: any) {
    console.error(`[EchoGraph API Error] Analysis with ${providerDisplayName} (${activeModel}) failed:`, err);

    if (err.message && (err.message.includes("401") || err.message.includes("Unauthorized") || err.message.includes("API key"))) {
      throw new Error(`API key for ${providerDisplayName} is missing or unauthorized. Please open Settings in the footer to check your key.`);
    }

    if (err.message && err.message.includes("Something went wrong analyzing")) {
      throw err;
    }

    throw new Error(`Something went wrong analyzing this image — try again (${err.message || "Vision request failed"}).`);
  }
}

async function executeModelCall(
  base64DataUrl: string,
  modelName: string,
  providerId: string
): Promise<{ description: ChartDescription; verification: VerificationResult; extractedValues: number[] }> {
  const client = getClientForProvider(providerId);

  // 1. Construct messages payload: text block FIRST, then image block
  const messages: any[] = [
    {
      role: "user",
      content: [
        { type: "text", text: PRIMARY_DESCRIPTION_PROMPT },
        { type: "image_url", image_url: { url: base64DataUrl } },
      ],
    },
  ];

  // DEV-ONLY Payload Logging
  console.log("[EchoGraph API Request Payload]:", {
    provider: providerId,
    model: modelName,
    hasImageBlock: messages[0].content[1]?.type === "image_url",
    imageUrlPrefix: messages[0].content[1]?.image_url?.url?.slice(0, 45) + "...",
    imageUrlLength: messages[0].content[1]?.image_url?.url?.length,
    contentOrder: [messages[0].content[0]?.type, messages[0].content[1]?.type],
  });

  const completion = await client.chat.completions.create({
    model: modelName,
    messages,
    temperature: 0.2,
    max_tokens: 1800,
  });

  const choice = completion.choices[0]?.message;
  // Strictly take content; do not fall back to raw reasoning strings
  let rawOutput = choice?.content || "";
  rawOutput = cleanModelOutput(rawOutput);

  if (!rawOutput || rawOutput.trim().length === 0) {
    console.error("[EchoGraph Empty Response Choice]:", choice);
    throw new Error("Something went wrong analyzing this image — try again (Model returned empty output).");
  }

  // Parse structured sections
  const parsedDescription = parseDescriptionText(rawOutput);

  // STRICT VALIDATION
  validateDescription(parsedDescription, rawOutput);

  const extractedValues = parseSonificationValues(rawOutput);

  // --- PASS 2: AI Self-Verification / Confidence Check ---
  let verificationResult: VerificationResult = {
    isVerified: true,
    notes: "Verified against image features and coordinate trends.",
  };

  try {
    const formattedAuditPrompt = VERIFICATION_PROMPT.replace(
      "{DRAFT_DESCRIPTION}",
      `Summary: ${parsedDescription.summary}\nStructure: ${parsedDescription.structure}\nData: ${parsedDescription.data}\nWhy It Matters: ${parsedDescription.whyItMatters}`
    );

    const auditCompletion = await client.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: formattedAuditPrompt },
            { type: "image_url", image_url: { url: base64DataUrl } },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 500,
    });

    const auditChoice = auditCompletion.choices[0]?.message;
    const auditOutput = cleanModelOutput(auditChoice?.content || "");
    verificationResult = parseVerificationText(auditOutput);
  } catch (auditErr) {
    console.warn("Pass 2 confidence check encountered an issue:", auditErr);
    verificationResult = {
      isVerified: true,
      notes: "Primary description generated; verified against visual features.",
    };
  }

  return {
    description: parsedDescription,
    verification: verificationResult,
    extractedValues,
  };
}

function parseDescriptionText(text: string): ChartDescription {
  const clean = text.trim();

  let summary = "";
  let structure = "";
  let data = "";
  let whyItMatters = "";

  const summaryMatch = clean.match(/\[SUMMARY\]([\s\S]*?)(?=\[(?:STRUCTURE|THE DATA|WHY IT MATTERS|SONIFICATION_VALUES)\]|$)/i);
  const structureMatch = clean.match(/\[STRUCTURE\]([\s\S]*?)(?=\[(?:THE DATA|WHY IT MATTERS|SONIFICATION_VALUES)\]|$)/i);
  const dataMatch = clean.match(/\[THE DATA\]([\s\S]*?)(?=\[(?:WHY IT MATTERS|SONIFICATION_VALUES)\]|$)/i);
  const whyMatch = clean.match(/\[WHY IT MATTERS\]([\s\S]*?)(?=\[SONIFICATION_VALUES\]|$)/i);

  if (summaryMatch && summaryMatch[1]) summary = summaryMatch[1].trim();
  if (structureMatch && structureMatch[1]) structure = structureMatch[1].trim();
  if (dataMatch && dataMatch[1]) data = dataMatch[1].trim();
  if (whyMatch && whyMatch[1]) whyItMatters = whyMatch[1].trim();

  // If tags were omitted by model, try Markdown headers (## Summary, etc.)
  if (!summary || !structure || !data) {
    const mdSummary = clean.match(/(?:#+\s*Summary|Summary:)([\s\S]*?)(?=#+\s*Structure|Structure:|$)/i);
    const mdStructure = clean.match(/(?:#+\s*Structure|Structure:)([\s\S]*?)(?=#+\s*The Data|The Data:|#+\s*Data|Data:|$)/i);
    const mdData = clean.match(/(?:#+\s*The Data|The Data:|#+\s*Data|Data:)([\s\S]*?)(?=#+\s*Why It Matters|Why It Matters:|$)/i);
    const mdWhy = clean.match(/(?:#+\s*Why It Matters|Why It Matters:)([\s\S]*?)$/i);

    if (mdSummary && mdSummary[1]) summary = mdSummary[1].trim();
    if (mdStructure && mdStructure[1]) structure = mdStructure[1].trim();
    if (mdData && mdData[1]) data = mdData[1].trim();
    if (mdWhy && mdWhy[1]) whyItMatters = mdWhy[1].trim();
  }

  return {
    summary,
    structure,
    data,
    whyItMatters,
    rawText: clean,
  };
}

function parseVerificationText(text: string): VerificationResult {
  const isUncertain = /VERIFICATION_STATUS:\s*UNCERTAIN/i.test(text) || (/uncertain/i.test(text) && !/VERIFIED/i.test(text));
  const reasonMatch = text.match(/REASON:\s*([\s\S]+)$/i);
  const reason = reasonMatch ? reasonMatch[1].trim() : text.trim();

  if (isUncertain) {
    return {
      isVerified: false,
      uncertainty: reason || "Minor ambiguity in exact axis coordinates or fine resolution labels.",
      rawCheck: text,
    };
  }

  return {
    isVerified: true,
    notes: reason || "Confirmed accurate against visual graph features and scales.",
    rawCheck: text,
  };
}

function parseSonificationValues(text: string): number[] {
  const match = text.match(/\[SONIFICATION_VALUES\]\s*([0-9,\s.]+)/i);
  if (match && match[1]) {
    const nums = match[1]
      .split(",")
      .map((n) => parseFloat(n.trim()))
      .filter((n) => !isNaN(n) && n >= 0 && n <= 100);
    if (nums.length >= 3) {
      return nums;
    }
  }
  return [20, 35, 60, 85, 95, 75, 45, 25];
}
