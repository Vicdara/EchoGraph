export type ProviderHealthState = "healthy" | "degraded" | "rate_limited" | "temporarily_unavailable" | "disabled";

export interface ProviderHealth {
  state: ProviderHealthState;
  failures: number;
  lastError?: string;
  latencyMs?: number;
  cooldownUntil?: number;
}

export interface ProviderSpec {
  id: string;
  baseUrl: string;
  keys: string[];
}

export interface ProviderManagerConfig {
  timeoutMs: number;
  maxRetries: number;
}
