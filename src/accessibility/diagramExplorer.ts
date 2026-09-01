import type { StructuredDiagram } from "../types/diagram";
import { formatStructuredList } from "../utils/structuredText";

// ponytail: deterministic order per diagram_type, no extra deps

function chartSteps(d: StructuredDiagram): string[] {
  const s: string[] = [];
  if (d.title) s.push(`Title: ${d.title}`);
  s.push(`Type: ${d.diagram_type} — ${d.summary}`);
  if (d.axes && Object.keys(d.axes).length) s.push(`Axes: ${JSON.stringify(d.axes)}`);
  if (d.labels?.length) s.push(`Labels: ${formatStructuredList(d.labels, ", ")}`);
  if (d.data_points?.length) s.push(`Data points: ${d.data_points.map(p=>JSON.stringify(p)).slice(0,8).join(" | ")}`);
  if (d.trends?.length) s.push(`Trends: ${formatStructuredList(d.trends)}`);
  if (d.important_findings?.length) s.push(`Important: ${formatStructuredList(d.important_findings)}`);
  if (d.uncertain_elements?.length) s.push(`Uncertain: ${formatStructuredList(d.uncertain_elements)}`);
  if (d.spatial_layout?.length) s.push(...d.spatial_layout.map((x,i)=>`Region ${i+1}: ${formatStructuredList(x)}`));
  return s;
}
function flowchartSteps(d: StructuredDiagram): string[] {
  if (d.sequence?.length) return [`Title: ${d.title||d.diagram_type}`, ...d.sequence.map((s,i)=>`Step ${i+1}: ${formatStructuredList(s)}`), ...(d.arrows?.length? [`Connections: ${d.arrows.map(a=>`${a.from} -> ${a.to}${a.label?` (${a.label})`:''}`).join(", ")}`]:[])];
  return chartSteps(d);
}
function scienceSteps(d: StructuredDiagram): string[] {
  const s: string[] = [];
  s.push(`Whole: ${d.title||d.diagram_type} — ${d.summary}`);
  if (d.objects?.length) s.push(`Major regions: ${formatStructuredList(d.objects, ", ")}`);
  if (d.labels?.length) s.push(`Labels: ${formatStructuredList(d.labels, ", ")}`);
  if (d.relationships?.length) s.push(`Relationships: ${formatStructuredList(d.relationships)}`);
  if (d.arrows?.length) s.push(`Arrows: ${d.arrows.map(a=>`${a.from} -> ${a.to} (${a.label||a.direction||''})`).join(", ")}`);
  if (d.important_findings?.length) s.push(`Findings: ${formatStructuredList(d.important_findings)}`);
  return s;
}

export function buildExploreSteps(d: StructuredDiagram): string[] {
  const t = (d.diagram_type||"").toLowerCase();
  if (t.includes("flow")) return flowchartSteps(d);
  if (t.includes("labeled")||t.includes("biology")||t.includes("illustration")||t.includes("circuit")||t.includes("map")) return scienceSteps(d);
  return chartSteps(d);
}

export class DiagramExplorer {
  steps: string[];
  pos = 0;
  constructor(public diagram: StructuredDiagram) { this.steps = buildExploreSteps(diagram); }
  current(): string { return this.steps[this.pos] ?? ""; }
  next(): string { if(this.pos < this.steps.length-1) this.pos++; return this.current(); }
  previous(): string { if(this.pos>0) this.pos--; return this.current(); }
  index(): number { return this.pos; }
  count(): number { return this.steps.length; }
}
