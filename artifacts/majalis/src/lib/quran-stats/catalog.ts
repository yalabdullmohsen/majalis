/**
 * كتالوج «القرآن في أرقام» — من محتوى محرَّر يدويًا فقط.
 */
import bunya from "../../../content/quran-stats/bunya.json";
import alfaz from "../../../content/quran-stats/alfaz.json";
import mawdoo from "../../../content/quran-stats/mawdoo.json";
import suwar from "../../../content/quran-stats/suwar.json";
import ajaib from "../../../content/quran-stats/ajaib.json";
import reviewedIds from "../../../content/quran-stats/reviewed-ids.json";
import type {
  CountBasis,
  QuranStat,
  QuranStatGroup,
  QuranStatSource,
} from "./types";
import {
  FORBIDDEN_STAT_SOURCES,
  FORBIDDEN_USER_FACING_TECH,
  formatStatSourceFull,
  formatStatSourceLine,
} from "./types";

type RawStat = {
  id: string;
  topicKey?: string;
  label: string;
  value: number | string;
  kind: QuranStat["kind"];
  basis?: CountBasis;
  group: QuranStatGroup;
  source: QuranStatSource;
  variants?: QuranStat["variants"];
  evidence?: QuranStat["evidence"];
  note?: string;
  detail?: string;
  method?: string;
};

const RAW_FILES: RawStat[][] = [
  bunya as unknown as RawStat[],
  alfaz as unknown as RawStat[],
  mawdoo as unknown as RawStat[],
  suwar as unknown as RawStat[],
  ajaib as unknown as RawStat[],
];

const BASIS_METHOD: Record<CountBasis, string> = {
  lafz: "عدّ ورود اللفظ بصيغته المحدّدة كما في المعجم المفهرس أو كتب العدّ المعتمدة.",
  madda: "عدّ المادة المعجمية بكل اشتقاقاتها الواردة في المعجم المفهرس.",
  mawdoo:
    "عدّ موضوعي: يشمل الألفاظ والمرادفات والشواهد؛ وليس عدّادًا للفظ واحد.",
};

function parseReviewedIds(ids: string[]): Set<string> {
  return new Set(ids.filter((id) => /^[a-z][a-z0-9-]*$/i.test(id)));
}

const REVIEWED_IDS = parseReviewedIds(reviewedIds as string[]);

function normalize(raw: RawStat): QuranStat {
  const method =
    raw.method?.trim() ||
    (raw.basis ? BASIS_METHOD[raw.basis] : undefined) ||
    "منقول من مصدر مطبوع معتمد بمرجعه.";
  return {
    id: raw.id,
    topicKey: raw.topicKey,
    label: raw.label,
    value: raw.value,
    kind: raw.kind,
    basis: raw.basis,
    group: raw.group,
    source: raw.source,
    variants: raw.variants?.length ? raw.variants : undefined,
    evidence: raw.evidence?.length ? raw.evidence : undefined,
    note: raw.note,
    detail: raw.detail,
    method,
  };
}

/** كل البطاقات المعتمدة في REVIEW.md فقط */
export function loadQuranStatsCatalog(): QuranStat[] {
  const all = RAW_FILES.flat().map(normalize);
  const reviewed = all.filter((s) => REVIEWED_IDS.has(s.id));
  assertQuranStatsCatalog(reviewed);
  return reviewed;
}

/** توافق مع الاسم السابق — بلا بيانات محسوبة */
export function buildQuranStatsCatalog(): QuranStat[] {
  return loadQuranStatsCatalog();
}

export { formatStatSourceLine, formatStatSourceFull };

export function isNumericCardValue(value: number | string): boolean {
  if (typeof value === "number" && Number.isFinite(value) && value !== 0) return true;
  if (typeof value === "number" && value === 0) return false;
  const s = String(value).trim();
  if (!s || s === "0" || s === "٠") return false;
  return /^[\d٠-٩.,≈~\s·×x/-]+$/u.test(s) && /\d|[٠-٩]/u.test(s);
}

function blobOf(s: QuranStat): string {
  return [
    s.label,
    s.note,
    s.detail,
    s.method,
    formatStatSourceFull(s.source),
    ...(s.variants ?? []).flatMap((v) => [v.value, v.attribution, v.source]),
  ]
    .filter(Boolean)
    .join("\n");
}

export function assertQuranStatsCatalog(stats: QuranStat[]): void {
  if (stats.length < 60) {
    throw new Error(`عدد الإحصاءات ${stats.length} < 60`);
  }
  const groups = new Set(stats.map((x) => x.group));
  for (const g of ["bunya", "alfaz", "mawdoo", "suwar", "ajaib"] as const) {
    if (!groups.has(g)) throw new Error(`مجموعة ناقصة: ${g}`);
  }

  const topicValues = new Map<string, string>();

  for (const s of stats) {
    if (!s.id?.trim()) throw new Error("بطاقة بلا id");
    if (!REVIEWED_IDS.has(s.id)) {
      throw new Error(`مدخل غير مذكور في REVIEW.md: ${s.id}`);
    }
    if (!s.source?.book?.trim() || !s.source?.author?.trim() || !s.source?.ref?.trim()) {
      throw new Error(`مصدر ناقص (book/author/ref): ${s.id}`);
    }
    if (!s.label?.trim()) throw new Error(`بلا تسمية: ${s.id}`);
    if (!s.detail?.trim() && !s.note?.trim()) {
      throw new Error(`بطاقة بلا وصف (detail/note): ${s.id}`);
    }
    if (!isNumericCardValue(s.value)) {
      throw new Error(`قيمة غير رقمية أو صفر: ${s.id} = ${String(s.value)}`);
    }
    if (s.kind === "disputed" && (s.variants?.length ?? 0) < 2) {
      throw new Error(`disputed بلا variants كافية: ${s.id}`);
    }
    if ((s.group === "alfaz" || s.group === "mawdoo") && !s.basis) {
      throw new Error(`ألفاظ/موضوعات بلا basis: ${s.id}`);
    }
    if ((s.group === "alfaz" || s.group === "mawdoo") && !s.method?.trim()) {
      throw new Error(`ألفاظ/موضوعات بلا method: ${s.id}`);
    }
    if (s.basis === "mawdoo" && (s.evidence?.length ?? 0) < 1) {
      throw new Error(`mawdoo بلا evidence: ${s.id}`);
    }
    if (s.topicKey) {
      const key = s.topicKey;
      const val = String(s.value);
      const prev = topicValues.get(key);
      if (prev != null && prev !== val) {
        throw new Error(`topicKey مكرر بقيمتين: ${key} (${prev} ≠ ${val})`);
      }
      topicValues.set(key, val);
    }

    const blob = blobOf(s);
    for (const bad of FORBIDDEN_STAT_SOURCES) {
      if (blob.toLowerCase().includes(bad.toLowerCase())) {
        throw new Error(`مصدر ممنوع في ${s.id}: ${bad}`);
      }
    }
    for (const tech of FORBIDDEN_USER_FACING_TECH) {
      if (blob.includes(tech)) {
        throw new Error(`مصطلح تقني/آلي في واجهة ${s.id}: ${tech}`);
      }
    }
    if (s.id === "ayat-kufi" && !/كوف/u.test(String(s.label) + (s.note ?? ""))) {
      throw new Error("بطاقة العدّ الكوفي يجب أن تذكر الكوفي في التسمية أو البيان");
    }
  }
}
