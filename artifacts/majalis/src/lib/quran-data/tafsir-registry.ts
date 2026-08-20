/**
 * سجل التفاسير — مصدر قائمة العرض (بعد فحص التغطية).
 */

export type TafsirSourceAttribution = {
  name: string;
  url: string;
  accessedAt: string;
  permission: string;
};

export type TafsirRegistryEntry = {
  id: string;
  name: string;
  author: string;
  level: "مبتدئ" | "متوسط" | "متقدم";
  type: "text";
  bundled: boolean;
  quranComSlug: string;
  coverage: number;
  bundledCoverageOk?: boolean;
  source: TafsirSourceAttribution;
};

export type TafsirAudioSeriesEntry = {
  id: string;
  sheikh: string;
  type: "audio";
  mapping: "ayah" | "range" | "lesson";
  index: string;
  source: TafsirSourceAttribution;
};

export type TafsirRegistryPayload = {
  updatedAt?: string;
  tafsirs: TafsirRegistryEntry[];
  audioSeries: TafsirAudioSeriesEntry[];
};

const LEVEL_ORDER: Record<TafsirRegistryEntry["level"], number> = {
  مبتدئ: 0,
  متوسط: 1,
  متقدم: 2,
};

const FULL_COVERAGE = 6236;

let registryCache: TafsirRegistryPayload | null = null;

export async function loadTafsirRegistry(): Promise<TafsirRegistryPayload> {
  if (registryCache) return registryCache;
  const res = await fetch("/data/tafsir/tafsir-registry.json", { credentials: "omit" });
  if (!res.ok) {
    registryCache = { tafsirs: [], audioSeries: [] };
    return registryCache;
  }
  registryCache = (await res.json()) as TafsirRegistryPayload;
  return registryCache;
}

/** تفاسير نصية تمرّ فحص التغطية — تُبنى منها قائمة المستخدم. */
export function filterEligibleTextTafsirs(entries: TafsirRegistryEntry[]): TafsirRegistryEntry[] {
  return entries
    .filter((t) => t.type === "text" && t.coverage >= FULL_COVERAGE)
    .sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level] || a.name.localeCompare(b.name, "ar"));
}

export async function getEligibleTextTafsirs(): Promise<TafsirRegistryEntry[]> {
  const reg = await loadTafsirRegistry();
  return filterEligibleTextTafsirs(reg.tafsirs ?? []);
}

export function getTafsirById(
  entries: TafsirRegistryEntry[],
  id: string,
): TafsirRegistryEntry | undefined {
  return entries.find((t) => t.id === id);
}

/** ترحيل معرفات قديمة → سجل v1 */
const LEGACY_ID_MAP: Record<string, string> = {
  "ar-tafsir-muyassar": "muyassar",
  "ar-tafseer-al-saddi": "saadi",
  "ar-tafsir-ibn-kathir": "ibn-kathir",
  "ar-tafsir-al-baghawi": "baghawi",
  "ar-tafsir-al-tabari": "tabari",
  "ar.muyassar": "muyassar",
  "ar.baghawi": "baghawi",
};

export function resolveRegistryTafsirId(raw: string | null | undefined): string {
  if (!raw) return "muyassar";
  return LEGACY_ID_MAP[raw] ?? raw;
}

export function formatTafsirSourceLine(entry: TafsirRegistryEntry): string {
  return `المصدر: ${entry.source.name} — المفسّر: ${entry.author}`;
}

/** للاختبارات — إعادة تحميل السجل */
export function clearTafsirRegistryCache(): void {
  registryCache = null;
}
