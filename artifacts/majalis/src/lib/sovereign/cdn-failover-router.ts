/**
 * توجيه CDN صامت — إعادة ترتيب مرشّحي الصوت حسب صحة المصدر.
 */
const LS_HEALTH = "majalis-cdn-health-v1";
const PENALTY_MS = 6 * 60_000;
const MAX_PENALTY = 4;

type OriginHealth = {
  ok: number;
  fail: number;
  penalty: number;
  lastFailAt: number;
};

type HealthStore = Record<string, OriginHealth>;

function originOf(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return url;
  }
}

function loadHealth(): HealthStore {
  try {
    const raw = localStorage.getItem(LS_HEALTH);
    if (!raw) return {};
    return JSON.parse(raw) as HealthStore;
  } catch {
    return {};
  }
}

function saveHealth(store: HealthStore): void {
  try {
    localStorage.setItem(LS_HEALTH, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

function score(origin: string, store: HealthStore): number {
  const h = store[origin];
  if (!h) return 100;
  const age = Date.now() - (h.lastFailAt || 0);
  if (age > PENALTY_MS * 2) return 80 + h.ok;
  const penalty = h.penalty * 25;
  return Math.max(0, 80 + h.ok - penalty - h.fail * 5);
}

/** يرتّب URLs حسب صحة CDN — الأفضل أولًا. */
export function orderAudioUrlsByCdnHealth(urls: string[]): string[] {
  if (urls.length <= 1) return urls;
  const store = loadHealth();
  return [...urls].sort((a, b) => score(originOf(b), store) - score(originOf(a), store));
}

export function recordCdnSuccess(url: string): void {
  const origin = originOf(url);
  const store = loadHealth();
  const prev = store[origin] ?? { ok: 0, fail: 0, penalty: 0, lastFailAt: 0 };
  store[origin] = {
    ok: prev.ok + 1,
    fail: Math.max(0, prev.fail - 1),
    penalty: Math.max(0, prev.penalty - 1),
    lastFailAt: prev.lastFailAt,
  };
  saveHealth(store);
}

export function recordCdnFailure(url: string): void {
  const origin = originOf(url);
  const store = loadHealth();
  const prev = store[origin] ?? { ok: 0, fail: 0, penalty: 0, lastFailAt: 0 };
  store[origin] = {
    ok: prev.ok,
    fail: prev.fail + 1,
    penalty: Math.min(MAX_PENALTY, prev.penalty + 1),
    lastFailAt: Date.now(),
  };
  saveHealth(store);
}

/** المرشّح التالي بعد فشل — بلا تكرار. */
export function pickNextAudioUrl(failed: string[], candidates: string[]): string | null {
  const failedSet = new Set(failed);
  const ordered = orderAudioUrlsByCdnHealth(candidates);
  return ordered.find((u) => !failedSet.has(u)) ?? null;
}

export function resetCdnHealthForTests(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(LS_HEALTH);
}
