// Structured diagram JSON per spec - persistent context for tutor
export interface StructuredDiagram {
  diagram_type: string;
  title: string;
  summary: string;
  labels: string[];
  axes: {
    x?: { label?: string; units?: string; scale?: string };
    y?: { label?: string; units?: string; scale?: string };
    [key: string]: unknown;
  };
  data_points: Array<{ label?: string; value?: number | string; units?: string; x?: unknown; y?: unknown }>;
  objects: string[];
  text_blocks?: Array<{ heading?: string; text?: string; position?: string; parent?: string }>;
  visual_details?: unknown[];
  hierarchy?: unknown[];
  relationships: string[];
  arrows: Array<{ from?: string; to?: string; label?: string; direction?: string }>;
  sequence: string[];
  trends: string[];
  important_findings: string[];
  detected_diagram_language?: string;
  user_language?: string;
  original_labels?: string[];
  translated_labels?: string[];
  spatial_layout: string[];
  uncertain_elements: string[];
  // Allow adapt per diagram type
  [key: string]: unknown;
}

export type ExplanationLevel = "Simple" | "Standard" | "Detailed";

export interface DiagramSession {
  id: string;
  fileName: string;
  imageUrl: string;
  structured: StructuredDiagram;
  summary: string;
  conversation: Array<{ role: "user" | "assistant"; content: string; timestamp: number }>;
  explorationPos: number;
  level: ExplanationLevel;
  createdAt: number;
  modelUsed?: string;
  providerUsed?: string;
}
