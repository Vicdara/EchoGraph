import type { StructuredDiagram } from "../types/diagram";

function labelFor(key: string): string {
  return key.replace(/_/g, " ").replace(/^./, (letter) => letter.toUpperCase());
}

export function formatStructuredValue(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return formatStructuredList(value, ", ");
  if (typeof value !== "object") return "";

  return Object.entries(value)
    .map(([key, entry]) => {
      const text = formatStructuredValue(entry);
      return text ? `${labelFor(key)}: ${text}` : "";
    })
    .filter(Boolean)
    .join("; ");
}

export function formatStructuredList(value: unknown, separator = " | "): string {
  if (!Array.isArray(value)) return formatStructuredValue(value);
  return value.map(formatStructuredValue).filter(Boolean).join(separator);
}

export function buildFriendlyStructure(diagram: StructuredDiagram): string {
  const hierarchy = Array.isArray(diagram.hierarchy) ? diagram.hierarchy.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object")) : [];
  const centralEntry = hierarchy.find(item => item.level === 0 || String(item.type).toLowerCase() === "central");
  const surroundingEntry = hierarchy.find(item => item.level === 1 || String(item.type).toLowerCase() === "surrounding");
  const central = formatStructuredValue(centralEntry?.element ?? centralEntry?.label ?? "");
  const surrounding = formatStructuredValue(surroundingEntry?.elements ?? diagram.labels ?? "");
  if (central && surrounding) return `The diagram places “${central}” at the center. Arranged around it are ${surrounding}. This layout presents the surrounding concepts as major parts of the central idea and helps the reader see how they belong together.`;

  if (diagram.sequence?.length > 1) return `The diagram follows a clear sequence: ${formatStructuredList(diagram.sequence, " → ")}. Arrows guide the reader through the process in that order.`;

  if (diagram.arrows?.length) {
    const connections = diagram.arrows.map(arrow => [arrow.from, arrow.to].filter(Boolean).join(" to ")).filter(Boolean);
    if (connections.length) return `The diagram is organized by connected elements. Its main connections run from ${connections.join(", and from ")}.`;
  }

  const layout = Array.isArray(diagram.spatial_layout) ? diagram.spatial_layout.slice(0, 2).map(visualItem).filter(Boolean) : [];
  if (layout.length) return layout.map(finishSentence).join(" ");
  if (diagram.objects?.length) return `The main visible parts are ${diagram.objects.map(visualItem).filter(Boolean).join(", ")}.`;
  return diagram.summary || "The diagram groups its main ideas into a clear visual layout.";
}

function finishSentence(text: string): string {
  const clean = text.trim();
  return clean && !/[.!?]$/.test(clean) ? `${clean}.` : clean;
}

function plainItem(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) return formatStructuredValue(value);
  const item = value as Record<string, unknown>;
  const preferred = item.description ?? item.text ?? item.finding ?? item.label;
  if (preferred != null) return formatStructuredValue(preferred);
  return Object.entries(value)
    .filter(([key, entry]) => typeof entry !== "boolean" && !["position", "parent", "direction", "confidence"].includes(key))
    .map(([, entry]) => formatStructuredValue(entry))
    .filter(Boolean)
    .join(": ");
}

function visualItem(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) return formatStructuredValue(value);
  const item = value as Record<string, unknown>;
  const name = formatStructuredValue(item.label ?? item.element ?? item.heading ?? item.description ?? item.text);
  const position = formatStructuredValue(item.position ?? item.region);
  return name && position ? `${name} at ${position}` : name || plainItem(value);
}

export function buildFriendlyData(diagram: StructuredDiagram): string {
  const sections: string[] = [];
  const xAxis = diagram.axes?.x;
  const yAxis = diagram.axes?.y;
  const axes = [
    xAxis?.label ? `The horizontal axis shows ${xAxis.label}${xAxis.units && !xAxis.label.includes(xAxis.units) ? ` in ${xAxis.units}` : ""}` : "",
    yAxis?.label ? `the vertical axis shows ${yAxis.label}${yAxis.units && !yAxis.label.includes(yAxis.units) ? ` in ${yAxis.units}` : ""}` : "",
  ].filter(Boolean);
  if (axes.length) sections.push(finishSentence(axes.join(axes.length > 1 ? ", while " : "")));

  const points = (diagram.data_points ?? []).map(point => {
    const value = point.value ?? point.y;
    const label = point.label ?? point.x;
    if (value == null) return "";
    return `${label != null ? `${label}: ` : ""}${value}${point.units ? ` ${point.units}` : ""}`;
  }).filter(Boolean);
  if (points.length) sections.push(`Key values are ${points.join("; ")}.`);

  const textBlocks = (diagram.text_blocks ?? []).map(block => {
    const heading = formatStructuredValue(block.heading);
    const text = formatStructuredValue(block.text);
    return heading && text ? `${heading}: ${text}` : heading || text;
  }).filter(Boolean);
  if (textBlocks.length) sections.push(`Visible text includes ${textBlocks.map(text => text.replace(/[.!?]+$/, "")).join("; ")}.`);

  const sequence = (diagram.sequence ?? []).map(plainItem).filter(Boolean);
  if (sequence.length) sections.push(`The sequence is ${sequence.join(" to ")}.`);
  const trends = (diagram.trends ?? []).map(plainItem).filter(Boolean);
  if (trends.length) sections.push(trends.map(finishSentence).join(" "));
  const findings = (diagram.important_findings ?? []).map(plainItem).filter(Boolean);
  if (findings.length) sections.push(findings.map(finishSentence).join(" "));

  return sections.join(" ") || diagram.summary || "No readable values were detected in this image.";
}

export function extractNumericValues(diagram: StructuredDiagram): number[] {
  return (diagram.data_points ?? []).map(point => point.value ?? point.y).flatMap(value => {
    if (typeof value === "number" && Number.isFinite(value)) return [value];
    if (typeof value !== "string" || !/^-?[\d,]+(?:\.\d+)?%?$/.test(value.trim())) return [];
    const parsed = Number(value.replace(/[,%]/g, ""));
    return Number.isFinite(parsed) ? [parsed] : [];
  });
}

export function parseEnrichedDescription(answer: string): Partial<{ summary: string; structure: string; data: string; whyItMatters: string }> {
  const section = (tag: string): string => answer.match(new RegExp(`\\[${tag}\\]([\\s\\S]*?)(?=\\[(?:SUMMARY|STRUCTURE|THE DATA|WHY IT MATTERS)\\]|$)`, "i"))?.[1].trim() || "";
  const entries = [
    ["summary", section("SUMMARY")],
    ["structure", section("STRUCTURE")],
    ["data", section("THE DATA")],
    ["whyItMatters", section("WHY IT MATTERS")],
  ].filter((entry): entry is [string, string] => entry[1].length > 30);
  return Object.fromEntries(entries);
}
