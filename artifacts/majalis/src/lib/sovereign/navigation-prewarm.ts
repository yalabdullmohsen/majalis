/**
 * تسخين تنبؤي — يتعلّم مسارات التنقل ويحمّل صفحات/صوتًا مجاورة بلا حظر UI.
 */
import { prefetchMushafPage } from "@/lib/quran-data/qpc-page-data";
import { prewarmAudioCdns, prewarmUrl } from "@/lib/resource-prewarm";
import { listAyahAudioUrls } from "@/lib/quran-audio";
import { getPowerSaverState, scheduleNonCriticalWork } from "@/lib/power-saver-engine";

const HISTORY_MAX = 24;
const routeHistory: string[] = [];
const routeCounts = new Map<string, number>();

function normalizeRoute(path: string): string {
  const p = path.replace(/\/+$/, "") || "/";
  return p;
}

export function recordNavigationPath(path: string): void {
  const route = normalizeRoute(path);
  routeHistory.unshift(route);
  if (routeHistory.length > HISTORY_MAX) routeHistory.length = HISTORY_MAX;
  routeCounts.set(route, (routeCounts.get(route) ?? 0) + 1);
}

export function predictNextRoutes(limit = 3): string[] {
  const current = routeHistory[0];
  if (!current) return [];
  const scores = new Map<string, number>();
  for (let i = 0; i < routeHistory.length - 1; i++) {
    if (routeHistory[i] !== current) continue;
    const next = routeHistory[i + 1];
    if (!next) continue;
    scores.set(next, (scores.get(next) ?? 0) + 2);
  }
  for (const [route, count] of routeCounts) {
    if (route === current) continue;
    scores.set(route, (scores.get(route) ?? 0) + count * 0.25);
  }
  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([route]) => route);
}

function mushafPageFromPath(path: string): number | null {
  const m = path.match(/\/mushaf(?:\/page\/(\d+))?/);
  if (!m) return null;
  if (m[1]) return Number.parseInt(m[1], 10);
  return null;
}

function prewarmMushafNeighbors(page: number): void {
  if (getPowerSaverState().mode === "aggressive") return;
  prefetchMushafPage(page + 1);
  prefetchMushafPage(page - 1);
}

function prewarmRoute(route: string): void {
  const page = mushafPageFromPath(route);
  if (page != null && Number.isFinite(page)) {
    prewarmMushafNeighbors(page);
    return;
  }
  if (route.startsWith("/quran") || route.startsWith("/mushaf")) {
    prewarmAudioCdns();
    scheduleNonCriticalWork(() => {
      const urls = listAyahAudioUrls(1, 1, "alafasy");
      const u = urls[0];
      if (u) prewarmUrl(u);
    });
  }
}

export function runPredictivePrewarm(): void {
  if (getPowerSaverState().mode === "aggressive") return;
  scheduleNonCriticalWork(() => {
    for (const route of predictNextRoutes(4)) prewarmRoute(route);
    const current = routeHistory[0];
    if (current) prewarmRoute(current);
  });
}

export function resetNavigationPrewarmForTests(): void {
  routeHistory.length = 0;
  routeCounts.clear();
}
