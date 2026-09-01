import type { StructuredDiagram } from "../src/types/diagram";
import { buildFriendlyData, buildFriendlyStructure, formatStructuredList } from "../src/utils/structuredText";

export interface VisionAnalysis {
  structured: StructuredDiagram;
  raw: string;
  model: string;
}

function formatAxes(axes: StructuredDiagram["axes"]): string {
  const parts: string[] = [];
  if (axes?.x?.label) parts.push(`X: ${axes.x.label}${axes.x.units ? ` (${axes.x.units})` : ""}${axes.x.scale ? `, ${axes.x.scale} scale` : ""}`);
  if (axes?.y?.label) parts.push(`Y: ${axes.y.label}${axes.y.units ? ` (${axes.y.units})` : ""}${axes.y.scale ? `, ${axes.y.scale} scale` : ""}`);
  return parts.join(" | ");
}

function joinDetails(...values: unknown[]): string {
  return values.map(value => formatStructuredList(value)).filter(Boolean).join(" | ");
}

export function buildVisionResponse(vision: VisionAnalysis) {
  const diagram = vision.structured;
  const summary = diagram.summary || diagram.title || "Diagram analyzed";
  const structure = buildFriendlyStructure(diagram);
  const data = buildFriendlyData(diagram);
  const whyMatters = formatStructuredList(diagram.important_findings, " ") || summary;
  const visualDetails = joinDetails(formatAxes(diagram.axes), diagram.hierarchy, diagram.spatial_layout, diagram.visual_details, diagram.objects, diagram.arrows, diagram.relationships, diagram.labels);
  return { ...vision, summary, structure, data, whyMatters, visualDetails };
}
