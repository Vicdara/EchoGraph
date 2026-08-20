export interface ChartDescription {
  summary: string;
  structure: string;
  data: string;
  whyItMatters: string;
  rawText?: string;
}

export interface VerificationResult {
  isVerified: boolean;
  notes?: string;
  uncertainty?: string;
  rawCheck?: string;
}

export interface AnalysisRecord {
  id: string;
  timestamp: number;
  fileName: string;
  imageUrl: string;
  description: ChartDescription;
  verification: VerificationResult;
  extractedValues?: number[]; // For sonification audio tones
  modelUsed?: string;
}

export interface SampleGraph {
  id: string;
  title: string;
  category: 'Biology' | 'Chemistry' | 'Physics' | 'Math';
  type: string;
  description: string;
  imageUrl: string;
  precomputedValues?: number[];
}
