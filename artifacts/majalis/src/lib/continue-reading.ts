/**
 * تتبع «أكمل من حيث توقفت» للأقسام العامة (لا admin/auth/search).
 */
import { readLocalJson, writeLocalJson, isPlainObject } from "@/lib/safe-json";
import { storageSetSync } from "@/lib/native-storage";

export const CONTINUE_READING_LS_KEY = "majalis-continue-reading-v1";

export type ContinueSection =
  | "mushaf"
  | "lessons"
  | "prophets"
  | "adhkar"
  | "library"
  | "tarikh";

export type ContinueReadingEntry = {
  route: string;
  title: string;
  timestamp: number;
  section: ContinueSection;
};

type ContinueStore = Partial<Record<ContinueSection, ContinueReadingEntry>>;

const SECTION_PREFIX: Array<{ section: ContinueSection; test: (path: string) => boolean }> = [
  { section: "mushaf", test: (p) => p === "/mushaf" || p.startsWith("/mushaf/") },
  { section: "lessons", test: (p) => p === "/lessons" || p.startsWith("/lessons/") },
  { section: "prophets", test: (p) => p === "/prophets" || p.startsWith("/prophets/") },
  { section: "adhkar", test: (p) => p === "/adhkar" || p.startsWith("/adhkar/") },
  { section: "library", test: (p) => p === "/library" || p.startsWith("/library/") },
  { section: "tarikh", test: (p) => p === "/tarikh-islami" || p.startsWith("/tarikh-islami/") },
];

const SKIP =
  /^\/(admin|dashboard|internal|login|register|auth|search|api)(\/|$)/i;

function isStore(v: unknown): v is ContinueStore {
  if (!isPlainObject(v)) return false;
  for (const key of Object.keys(v)) {
    const e = (v as Record<string, unknown>)[key];
    if (!isPlainObject(e)) return false;
    if (typeof e.route !== "string" || typeof e.title !== "string") return false;
    if (typeof e.timestamp !== "number" || typeof e.section !== "string") return false;
  }
  return true;
}

function readStore(): ContinueStore {
  if (typeof window === "undefined") return {};
  return readLocalJson<ContinueStore>(CONTINUE_READING_LS_KEY, {}, isStore);
}

function writeStore(store: ContinueStore) {
  if (typeof window === "undefined") return;
  writeLocalJson(CONTINUE_READING_LS_KEY, store);
  try {
    storageSetSync(CONTINUE_READING_LS_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

export function resolveContinueSection(path: string): ContinueSection | null {
  const clean = path.split("?")[0].split("#")[0];
  if (SKIP.test(clean)) return null;
  for (const row of SECTION_PREFIX) {
    if (row.test(clean)) return row.section;
  }
  return null;
}

export function trackContinueReading(input: {
  route: string;
  title: string;
  section?: ContinueSection;
}): void {
  if (typeof window === "undefined") return;
  const route = input.route.split("?")[0].split("#")[0];
  if (SKIP.test(route)) return;
  // لا نحفظ قوائم فارغة العامة كمتابعة — نفضّل التفاصيل
  if (
    route === "/lessons" ||
    route === "/prophets" ||
    route === "/adhkar" ||
    route === "/library" ||
    route === "/tarikh-islami" ||
    route === "/mushaf"
  ) {
    // المصحف الرئيسي مقبول كموقع قراءة
    if (route !== "/mushaf") return;
  }
  const section = input.section ?? resolveContinueSection(route);
  if (!section) return;
  const title = input.title.trim() || route;
  const store = readStore();
  store[section] = {
    route: input.route,
    title,
    timestamp: Date.now(),
    section,
  };
  writeStore(store);
}

export function getContinueReadingEntries(limit = 5): ContinueReadingEntry[] {
  const store = readStore();
  return Object.values(store)
    .filter((e): e is ContinueReadingEntry => Boolean(e?.route))
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}

export function getLatestContinueReading(): ContinueReadingEntry | null {
  return getContinueReadingEntries(1)[0] ?? null;
}
