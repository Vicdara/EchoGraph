import assert from "node:assert/strict";
import test from "node:test";
import { buildFriendlyData, buildFriendlyStructure, extractNumericValues, formatStructuredList, formatStructuredValue, parseEnrichedDescription } from "../src/utils/structuredText.ts";
import { buildLocalTutorAnswer } from "../src/utils/assistantFallback.ts";
import { calculateVisionDimensions } from "../src/utils/imageOptimizer.ts";
import { languagesWithVoices, languageCodeFor, rankVoicesForLanguage, supportsCloudTts } from "../src/utils/voiceSelection.ts";

test("formats mixed AI response values without object coercion", () => {
  const spatialLayout = [
    { region: "center", description: "A hooded figure" },
    { region: "left", details: ["circuit lines", "blue glow"] },
  ];

  const result = formatStructuredList(spatialLayout);
  assert.equal(
    result,
    "Region: center; Description: A hooded figure | Region: left; Details: circuit lines, blue glow",
  );
  assert.equal(result.includes("[object Object]"), false);
  assert.equal(formatStructuredValue({ value: 42, units: "%" }), "Value: 42; Units: %");
});

test("keeps only substantive background explanation sections", () => {
  const parsed = parseEnrichedDescription(`[SUMMARY] This is a detailed visual summary long enough to replace the fallback.\n[STRUCTURE] too short\n[THE DATA] The image contains several concrete visual details arranged around its central subject.\n[WHY IT MATTERS] This illustration communicates a recognizable technology theme to its intended audience.`);
  assert.deepEqual(Object.keys(parsed), ["summary", "data", "whyItMatters"]);
});

test("local tutor fallback answers from diagram data", () => {
  const diagram = { title: "Sales", summary: "Sales rise each quarter.", labels: ["Q1", "Q2"], data_points: [{ label: "Q1", value: 10 }, { label: "Q2", value: 20 }], trends: [], spatial_layout: [], objects: [], relationships: [], important_findings: ["Q2 is highest"], diagram_type: "chart", axes: {}, arrows: [], sequence: [], uncertain_elements: [] };
  assert.match(buildLocalTutorAnswer(diagram, "read the values"), /Q1.*10.*Q2.*20/);
  assert.match(buildLocalTutorAnswer(diagram, "quiz me"), /Quick quiz/);
});

test("prepares small text-heavy images for OCR without oversizing large images", () => {
  assert.deepEqual(calculateVisionDimensions(270, 153), { width: 1000, height: 567 });
  assert.deepEqual(calculateVisionDimensions(2400, 1200), { width: 1600, height: 800 });
  assert.deepEqual(calculateVisionDimensions(1200, 800), { width: 1200, height: 800 });
});

test("recommends a quality voice in the selected language", () => {
  const voices = [
    { name: "Microsoft David", lang: "en-US", voiceURI: "david", default: true, localService: true },
    { name: "Russian Standard", lang: "ru-RU", voiceURI: "standard", default: true, localService: true },
    { name: "Microsoft Irina", lang: "ru-RU", voiceURI: "irina", default: false, localService: true },
  ];
  assert.equal(languageCodeFor("German"), "de");
  assert.equal(supportsCloudTts("Russian"), false);
  assert.equal(supportsCloudTts("German"), true);
  assert.deepEqual(rankVoicesForLanguage(voices, "Russian").map(voice => voice.voiceURI), ["irina", "standard"]);
  assert.deepEqual(languagesWithVoices(["English", "German", "Russian"], voices), ["English", "Russian"]);
});

test("turns hierarchy metadata into a learner-friendly explanation", () => {
  const diagram = { diagram_type: "concept map", title: "AI", summary: "AI concepts", labels: [], axes: {}, data_points: [], objects: [], relationships: [], arrows: [], sequence: [], trends: [], important_findings: [], spatial_layout: [], uncertain_elements: [], hierarchy: [{ level: 0, element: "Fundamental Concepts of AI", type: "central" }, { level: 1, elements: ["Machine Learning", "Computer Vision"], type: "surrounding" }] };
  const result = buildFriendlyStructure(diagram);
  assert.match(result, /at the center/);
  assert.match(result, /Machine Learning, Computer Vision/);
  assert.equal(result.includes("Level:"), false);
});

test("turns chart data into readable text and real sonification values", () => {
  const diagram = { diagram_type: "chart", title: "Temperature", summary: "A line chart.", labels: [], axes: { x: { label: "Temperature", units: "degrees Celsius" }, y: { label: "Reaction rate", units: "%" } }, data_points: [{ label: "20 C", value: "30", units: "%" }, { label: "37 C", value: 100, units: "%" }, { label: "range", value: "28-32" }], objects: [], relationships: [], arrows: [], sequence: [], trends: ["The rate rises, then falls."], important_findings: [], spatial_layout: [], uncertain_elements: [] };
  const explanation = buildFriendlyData(diagram);
  assert.match(explanation, /horizontal axis shows Temperature/);
  assert.match(explanation, /20 C: 30 %/);
  assert.equal(explanation.includes("Label:"), false);
  assert.deepEqual(extractNumericValues(diagram), [30, 100]);
});
