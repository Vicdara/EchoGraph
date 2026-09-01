import type { ProviderHealth, ProviderHealthState } from "../types/provider";

// ponytail: minimal key pool + health, no extra deps, stdlib only
type Entry = { key: string; health: ProviderHealth; idx: number };

const COOLDOWN_RATE_LIMIT = 60_000;
const COOLDOWN_UNAVAILABLE = 30_000;
const HEALTHY_RESET_AFTER = 5 * 60_000;

function now() { return Date.now(); }

export class ProviderPool {
  private entries: Entry[];
  private cursor = 0;

  constructor(keys: string[]) {
    this.entries = keys.map((k, i) => ({
      key: k,
      idx: i,
      health: { state: "healthy" as ProviderHealthState, failures: 0 },
    }));
  }

  private isHealthy(e: Entry): boolean {
    const h = e.health;
    if (h.cooldownUntil && now() < h.cooldownUntil) return false;
    if (h.state === "disabled") return false;
    // auto-restore after cooldown
    if (h.cooldownUntil && now() >= h.cooldownUntil) {
      h.state = "healthy";
      h.cooldownUntil = undefined;
      h.failures = Math.max(0, h.failures - 1);
    }
    // decay healthy
    if (h.state === "healthy" && h.failures > 0 && h.lastError && now() - (h as unknown as { _lastFailAt?: number })._lastFailAt! > HEALTHY_RESET_AFTER) {
      h.failures = 0;
    }
    return h.state !== "rate_limited" || !h.cooldownUntil || now() >= h.cooldownUntil;
  }

  pick(): Entry | null {
    // round-robin over healthy
    for (let attempts = 0; attempts < this.entries.length; attempts++) {
      const e = this.entries[this.cursor % this.entries.length];
      this.cursor++;
      if (this.isHealthy(e)) return e;
    }
    // all rate-limited -> return least-recently cooled
    const sorted = [...this.entries].sort((a, b) => (a.health.cooldownUntil ?? 0) - (b.health.cooldownUntil ?? 0));
    if (sorted.length) return sorted[0];
    return null;
  }

  markSuccess(entry: Entry, latencyMs: number) {
    entry.health.failures = 0;
    entry.health.latencyMs = latencyMs;
    entry.health.lastError = undefined;
    entry.health.state = "healthy";
    entry.health.cooldownUntil = undefined;
  }

  markFailure(entry: Entry, errText: string, status?: number) {
    entry.health.failures++;
    entry.health.lastError = errText.slice(0, 300);
    (entry.health as unknown as { _lastFailAt?: number })._lastFailAt = now();
    const is429 = status === 429 || /429|rate.?limit|TPM/i.test(errText);
    const is5xx = status ? status >= 500 && status < 600 : /502|503|504|temporarily/i.test(errText);
    if (is429) {
      entry.health.state = "rate_limited";
      entry.health.cooldownUntil = now() + COOLDOWN_RATE_LIMIT;
    } else if (is5xx) {
      entry.health.state = entry.health.failures >= 3 ? "temporarily_unavailable" : "degraded";
      entry.health.cooldownUntil = now() + COOLDOWN_UNAVAILABLE;
    } else if (entry.health.failures >= 5) {
      entry.health.state = "degraded";
    }
  }

  // for diagnostics, never expose keys
  snapshot() {
    return this.entries.map(e => ({ idx: e.idx, state: e.health.state, failures: e.health.failures, cooldownUntil: e.health.cooldownUntil }));
  }
}

export async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try {
    // allow caller to use signal if they thread it, but we also race
    return await Promise.race([
      p,
      new Promise<never>((_, rej) => ac.signal.addEventListener("abort", () => rej(new Error(`timeout after ${ms}ms`)))),
    ]);
  } finally { clearTimeout(t); }
}
