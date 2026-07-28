/**
 * Devotional Balance & Time-Awareness Engine.
 * Tracks time spent across Quran / Azkar / Matn study sections and
 * emits contextual time-aware prompts (Friday Kahf, bedtime, azkar windows).
 */

import { idbGetValue, idbPut, OFFLINE_STORES } from "@/lib/offline-db";
import { resolveTimeOfDay, type TimeOfDay } from "@/lib/daily-context";

export type DevotionalSection = "quran" | "adhkar" | "matn" | "other";

export type SectionTimeBucket = {
  section: DevotionalSection;
  /** Accumulated active milliseconds (today) */
  activeMs: number;
  lastActiveAt: string;
};

export type DevotionalBalanceState = {
  dateKey: string;
  buckets: Record<DevotionalSection, SectionTimeBucket>;
  updatedAt: string;
};

export type TimeAwarePromptKind =
  | "morning_adhkar"
  | "evening_adhkar"
  | "friday_kahf"
  | "bedtime_balance"
  | "quran_deficit"
  | "matn_deficit"
  | "balanced";

export type TimeAwarePrompt = {
  kind: TimeAwarePromptKind;
  titleAr: string;
  bodyAr: string;
  href: string;
  priority: number;
};

const LS_KEY = "majalis-devotional-balance-v1";
const IDB_KEY = "devotional-balance-v1";
const DISMISS_KEY = "majalis-devotional-prompts-dismissed-v1";

const EMPTY_BUCKET = (section: DevotionalSection): SectionTimeBucket => ({
  section,
  activeMs: 0,
  lastActiveAt: new Date(0).toISOString(),
});

function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function emptyState(dateKey = todayKey()): DevotionalBalanceState {
  return {
    dateKey,
    buckets: {
      quran: EMPTY_BUCKET("quran"),
      adhkar: EMPTY_BUCKET("adhkar"),
      matn: EMPTY_BUCKET("matn"),
      other: EMPTY_BUCKET("other"),
    },
    updatedAt: new Date().toISOString(),
  };
}

function readState(): DevotionalBalanceState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as DevotionalBalanceState;
    if (!parsed?.dateKey || !parsed.buckets) return emptyState();
    if (parsed.dateKey !== todayKey()) return emptyState();
    return parsed;
  } catch {
    return emptyState();
  }
}

function writeState(state: DevotionalBalanceState): DevotionalBalanceState {
  const next = { ...state, updatedAt: new Date().toISOString() };
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  } catch {
    /* quota */
  }
  void idbPut(OFFLINE_STORES.meta, IDB_KEY, next).catch(() => undefined);
  return next;
}

export function loadDevotionalBalance(): DevotionalBalanceState {
  return readState();
}

export async function loadDevotionalBalanceAsync(): Promise<DevotionalBalanceState> {
  try {
    const fromIdb = await idbGetValue<DevotionalBalanceState>(OFFLINE_STORES.meta, IDB_KEY);
    if (fromIdb?.dateKey === todayKey() && fromIdb.buckets) {
      writeState(fromIdb);
      return fromIdb;
    }
  } catch {
    /* fall through */
  }
  return readState();
}

/** Record active dwell time for a section (ms). */
export function recordSectionTime(
  section: DevotionalSection,
  dwellMs: number,
): DevotionalBalanceState {
  const state = readState();
  const ms = Math.max(0, Math.round(dwellMs));
  if (ms <= 0) return state;
  const bucket = state.buckets[section] || EMPTY_BUCKET(section);
  state.buckets[section] = {
    ...bucket,
    activeMs: bucket.activeMs + ms,
    lastActiveAt: new Date().toISOString(),
  };
  return writeState(state);
}

export function getSectionShare(state: DevotionalBalanceState = readState()): Record<DevotionalSection, number> {
  const total =
    state.buckets.quran.activeMs +
    state.buckets.adhkar.activeMs +
    state.buckets.matn.activeMs +
    state.buckets.other.activeMs;
  const pct = (ms: number) => (total <= 0 ? 0 : Math.round((ms / total) * 100));
  return {
    quran: pct(state.buckets.quran.activeMs),
    adhkar: pct(state.buckets.adhkar.activeMs),
    matn: pct(state.buckets.matn.activeMs),
    other: pct(state.buckets.other.activeMs),
  };
}

function readDismissed(): Record<string, string> {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function dismissTimeAwarePrompt(kind: TimeAwarePromptKind): void {
  try {
    const map = readDismissed();
    map[`${todayKey()}:${kind}`] = new Date().toISOString();
    localStorage.setItem(DISMISS_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

function isDismissed(kind: TimeAwarePromptKind): boolean {
  return Boolean(readDismissed()[`${todayKey()}:${kind}`]);
}

/**
 * Generate contextual prompts from clock + today's section balance.
 * Pure enough for tests when `now` is injected.
 */
export function generateTimeAwarePrompts(
  opts?: { now?: Date; state?: DevotionalBalanceState },
): TimeAwarePrompt[] {
  const now = opts?.now ?? new Date();
  const state = opts?.state ?? readState();
  const hour = now.getHours() + now.getMinutes() / 60;
  const tod: TimeOfDay = resolveTimeOfDay(hour);
  const isFriday = now.getDay() === 5;
  const share = getSectionShare(state);
  const prompts: TimeAwarePrompt[] = [];

  if ((tod === "fajr" || tod === "duha") && !isDismissed("morning_adhkar")) {
    prompts.push({
      kind: "morning_adhkar",
      titleAr: "أذكار الصباح",
      bodyAr: "حان وقت أذكار الصباح — احفظ بركة يومك.",
      href: "/adhkar?cat=morning",
      priority: 90,
    });
  }

  if ((tod === "asr" || tod === "maghrib") && !isDismissed("evening_adhkar")) {
    prompts.push({
      kind: "evening_adhkar",
      titleAr: "أذكار المساء",
      bodyAr: "لا تفوّت أذكار المساء قبل غروب اليوم.",
      href: "/adhkar?cat=evening",
      priority: 88,
    });
  }

  if (isFriday && !isDismissed("friday_kahf")) {
    prompts.push({
      kind: "friday_kahf",
      titleAr: "سورة الكهف يوم الجمعة",
      bodyAr: "يُستحب قراءة سورة الكهف يوم الجمعة.",
      href: "/mushaf/18",
      priority: 95,
    });
  }

  if ((tod === "isha" || tod === "layl") && !isDismissed("bedtime_balance")) {
    const sleepHref = "/adhkar?cat=sleep";
    const quranLight = state.buckets.quran.activeMs < 5 * 60_000;
    prompts.push({
      kind: "bedtime_balance",
      titleAr: "ختام اليوم",
      bodyAr: quranLight
        ? "قبل النوم: أذكار النوم، ولو آيات يسيرة من القرآن."
        : "اختتم يومك بأذكار النوم.",
      href: sleepHref,
      priority: 85,
    });
  }

  if (share.quran < 20 && state.buckets.adhkar.activeMs + state.buckets.matn.activeMs > 10 * 60_000) {
    if (!isDismissed("quran_deficit")) {
      prompts.push({
        kind: "quran_deficit",
        titleAr: "توازن الورد",
        bodyAr: "قضيت وقتًا في الأذكار/المتون — خصّص دقائق للقرآن.",
        href: "/mushaf",
        priority: 70,
      });
    }
  }

  if (share.matn === 0 && state.buckets.quran.activeMs > 15 * 60_000 && (tod === "duha" || tod === "zuhr")) {
    if (!isDismissed("matn_deficit")) {
      prompts.push({
        kind: "matn_deficit",
        titleAr: "جلسة علم",
        bodyAr: "بعد تلاوتك، جولة قصيرة في متن فقهي تثبّت الفهم.",
        href: "/fiqh",
        priority: 55,
      });
    }
  }

  if (prompts.length === 0) {
    prompts.push({
      kind: "balanced",
      titleAr: "استمرار مبارك",
      bodyAr: "وزّع وقتك بين قرآن وأذكار وعلم — بارك الله فيك.",
      href: "/",
      priority: 10,
    });
  }

  return prompts.sort((a, b) => b.priority - a.priority);
}

export function topTimeAwarePrompt(
  opts?: { now?: Date; state?: DevotionalBalanceState },
): TimeAwarePrompt {
  return generateTimeAwarePrompts(opts)[0]!;
}
