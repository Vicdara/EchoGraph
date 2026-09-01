import type { StructuredDiagram } from "../types/diagram";
import { formatStructuredList } from "./structuredText.ts";

export function buildLocalTutorAnswer(diagram: StructuredDiagram, question: string): string {
  const query = question.toLowerCase();
  const summary = diagram.summary || diagram.title || "The image has been analyzed.";
  const labels = formatStructuredList(diagram.labels, ", ");
  const values = formatStructuredList(diagram.data_points, "; ") || formatStructuredList(diagram.trends);
  const structure = formatStructuredList(diagram.spatial_layout) || formatStructuredList(diagram.objects) || formatStructuredList(diagram.relationships);
  const findings = formatStructuredList(diagram.important_findings, " ");

  if (/quiz|test me/.test(query)) return `Quick quiz: Based on the image, what is the main idea described here: ${summary}`;
  if (/values?|data|numbers?|compare/.test(query) && values) return `The visible data is: ${values}.${findings ? ` Key finding: ${findings}` : ""}`;
  if (/labels?|read/.test(query) && labels) return `Visible labels: ${labels}.`;
  if (/structure|layout|where|position|arrow/.test(query) && structure) return `The image is arranged like this: ${structure}.`;

  return [summary, structure && `Layout: ${structure}.`, values && `Data: ${values}.`, findings && `Key finding: ${findings}`].filter(Boolean).join(" ");
}
