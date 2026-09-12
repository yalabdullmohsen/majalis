/**
 * تحليلات تجربة البحث (محلي خفيف).
 * latency · open rate · empty · failed
 */
const KEY = "majalis-search-ux-metrics";

type Bucket = {
  queries: number;
  opens: number;
  empties: number;
  errors: number;
  latencySum: number;
  latencyCount: number;
  updatedAt: number;
};

export type SearchUxPayload = {
  latencyMs?: number;
  resultCount?: number;
  empty?: boolean;
  scope?: string;
  query?: string;
  kind?: string;
  href?: string;
  message?: string;
  value?: string;
};

function read(): Bucket {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      return {
        queries: 0,
        opens: 0,
        empties: 0,
        errors: 0,
        latencySum: 0,
        latencyCount: 0,
        updatedAt: Date.now(),
      };
    }
    return { ...(JSON.parse(raw) as Bucket), updatedAt: Date.now() };
  } catch {
    return {
      queries: 0,
      opens: 0,
      empties: 0,
      errors: 0,
      latencySum: 0,
      latencyCount: 0,
      updatedAt: Date.now(),
    };
  }
}

function write(b: Bucket) {
  try {
    localStorage.setItem(KEY, JSON.stringify(b));
  } catch {
    /* quota */
  }
}

/** أحداث UX: search_completed | result_open | search_empty | search_failed | suggestion_used */
export function trackSearchUx(type: string, payload: SearchUxPayload = {}): void {
  if (typeof window === "undefined") return;
  const b = read();

  if (type === "search_completed" || type === "query") {
    b.queries += 1;
    const ms = Math.max(0, payload.latencyMs ?? 0);
    b.latencySum += ms;
    b.latencyCount += 1;
    if (payload.empty || payload.resultCount === 0) b.empties += 1;
  } else if (type === "result_open" || type === "open") {
    b.opens += 1;
  } else if (type === "search_failed" || type === "error") {
    b.errors += 1;
  } else if (type === "search_empty" || type === "empty") {
    b.empties += 1;
  }

  b.updatedAt = Date.now();
  write(b);
}

export function getSearchUxSnapshot(): Bucket & { avgLatencyMs: number; openRate: number } {
  const b = read();
  return {
    ...b,
    avgLatencyMs: b.latencyCount ? Math.round(b.latencySum / b.latencyCount) : 0,
    openRate: b.queries ? b.opens / b.queries : 0,
  };
}
