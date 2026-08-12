import { RESEARCH_PUBLISHED_SEED, RESEARCH_DEMO_SEED } from "./demo-seed";
import { PEER_REVIEWED_KINDS, THESIS_KINDS } from "./catalog";
import { isLikelyDuplicateOf } from "./duplicates";
import { searchResearches } from "./search";
import type {
  DailyImportReport,
  ResearchFilters,
  ResearchRecord,
  ResearchStats,
  ResearchSubmission,
  ResearchSubmissionInput,
  ReviewStatus,
} from "./types";
import { listActiveImportSources, RESEARCH_IMPORT_SOURCES } from "./import-sources";

const SUBMISSIONS_KEY = "majlis:researches:submissions:v1";
const SAVED_KEY = "majlis:researches:saved:v1";
const SEARCH_HISTORY_KEY = "majlis:researches:search-history:v1";
const IMPORT_LOG_KEY = "majlis:researches:import-log:v1";
const IMPORT_LOCK_KEY = "majlis:researches:import-lock:v1";
const VIEWS_KEY = "majlis:researches:views:v1";

function canUseDemoSeed(): boolean {
  try {
    if (typeof import.meta !== "undefined" && import.meta.env?.DEV) return true;
    if (typeof import.meta !== "undefined" && import.meta.env?.VITE_RESEARCH_DEMO === "1") return true;
  } catch {
    /* ignore */
  }
  return false;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    if (typeof localStorage === "undefined") return fallback;
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

export function getOwnerKey(): string {
  try {
    const existing = localStorage.getItem("majlis:researches:owner-key");
    if (existing) return existing;
    const key = `anon_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
    localStorage.setItem("majlis:researches:owner-key", key);
    return key;
  } catch {
    return "anon_session";
  }
}

/** السجلات المنشورة للعامة — بلا أبحاث شخصية غير المعتمدة، وبلا ديمو في الإنتاج. */
export function listPublishedResearches(): ResearchRecord[] {
  const base = [...RESEARCH_PUBLISHED_SEED];
  if (canUseDemoSeed()) {
    base.push(...RESEARCH_DEMO_SEED.filter((r) => r.reviewStatus === "published"));
  }
  const approvedFromSubs = listSubmissions()
    .filter((s) => s.status === "published")
    .map(submissionToRecord);
  return dedupeById([...base, ...approvedFromSubs]);
}

function dedupeById(rows: ResearchRecord[]): ResearchRecord[] {
  const map = new Map<string, ResearchRecord>();
  for (const r of rows) map.set(r.id, r);
  return [...map.values()];
}

function submissionToRecord(s: ResearchSubmission): ResearchRecord {
  return {
    id: s.id,
    slug: s.id,
    title: s.title,
    titleEn: s.titleEn,
    kind: s.kind,
    categoryIds: [s.categoryId, s.subcategoryId].filter(Boolean) as string[],
    authors: [{ name: s.authorName, role: "author", emailPrivate: s.authorEmail }],
    supervisor: s.supervisor,
    university: s.university,
    college: s.college,
    department: s.department,
    academicLevel: s.academicLevel,
    country: s.country,
    year: s.year,
    language: s.language,
    abstract: s.abstract,
    keywords: s.keywords.split(/[,،]/).map((x) => x.trim()).filter(Boolean),
    objectives: s.objectives ? [s.objectives] : undefined,
    methodology: s.methodology,
    findings: s.findings ? [s.findings] : undefined,
    recommendations: s.recommendations ? [s.recommendations] : undefined,
    sourceUrl: s.sourceUrl,
    doi: s.doi,
    reviewStatus: "published",
    license: s.license,
    accessType: "abstract_only",
    copyrightNote: s.copyrightNote,
    isPersonal: s.isPersonal,
    isDemo: false,
    publishedAt: s.updatedAt,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

export function getResearchByIdOrSlug(idOrSlug: string): ResearchRecord | null {
  const all = [
    ...listPublishedResearches(),
    ...(canUseDemoSeed() ? RESEARCH_DEMO_SEED : []),
    ...listSubmissions()
      .filter((s) => s.ownerKey === getOwnerKey() || s.status === "published")
      .map(submissionToRecord),
  ];
  return all.find((r) => r.id === idOrSlug || r.slug === idOrSlug) ?? null;
}

export function queryPublished(filters: ResearchFilters = {}): ResearchRecord[] {
  return searchResearches(listPublishedResearches(), filters);
}

export function computeResearchStats(pool = listPublishedResearches()): ResearchStats {
  const universities = new Set(pool.map((r) => r.university).filter(Boolean));
  const countries = new Set(pool.map((r) => r.country).filter(Boolean));
  const cats = new Set(pool.flatMap((r) => r.categoryIds));
  return {
    published: pool.length,
    theses: pool.filter((r) => THESIS_KINDS.includes(r.kind)).length,
    peerReviewed: pool.filter((r) => r.peerReviewed || PEER_REVIEWED_KINDS.includes(r.kind)).length,
    categoriesUsed: cats.size,
    universities: universities.size,
    countries: countries.size,
  };
}

export function listSubmissions(): ResearchSubmission[] {
  return readJson<ResearchSubmission[]>(SUBMISSIONS_KEY, []);
}

export function listMySubmissions(): ResearchSubmission[] {
  const owner = getOwnerKey();
  return listSubmissions().filter((s) => s.ownerKey === owner);
}

export function submitResearch(input: ResearchSubmissionInput): { ok: true; submission: ResearchSubmission } | { ok: false; error: string } {
  if (!input.title?.trim() || input.title.trim().length < 5) return { ok: false, error: "العنوان مطلوب (5 أحرف على الأقل)." };
  if (!input.authorName?.trim()) return { ok: false, error: "اسم الباحث مطلوب." };
  if (!input.authorEmail?.includes("@")) return { ok: false, error: "البريد الإلكتروني غير صالح." };
  if (!input.abstract?.trim() || input.abstract.trim().length < 40) return { ok: false, error: "الملخص مطلوب (40 حرفًا على الأقل)." };
  if (!input.acceptTerms || !input.attestOwnership) return { ok: false, error: "يجب الموافقة على الشروط والإقرار بصحة المعلومات." };
  if (!input.categoryId) return { ok: false, error: "التخصص الرئيسي مطلوب." };

  const isPersonal = input.kind === "personal_research";
  const initialStatus: ReviewStatus = isPersonal ? "awaiting_review" : "auto_screening";

  const draftRecord: ResearchRecord = {
    id: `tmp_${Date.now()}`,
    slug: `tmp_${Date.now()}`,
    title: input.title.trim(),
    kind: input.kind,
    categoryIds: [input.categoryId],
    authors: [{ name: input.authorName.trim(), role: "author" }],
    year: input.year,
    language: input.language,
    abstract: input.abstract.trim(),
    keywords: input.keywords.split(/[,،]/).map((x) => x.trim()).filter(Boolean),
    doi: input.doi,
    reviewStatus: initialStatus,
    license: input.license,
    accessType: "metadata_only",
    isPersonal,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const dup = isLikelyDuplicateOf(draftRecord, listPublishedResearches());
  if (dup) {
    return { ok: false, error: `يبدو أن البحث مكرر أو قريب جدًا من بحث موجود: «${dup.title}».` };
  }

  const now = new Date().toISOString();
  const submission: ResearchSubmission = {
    ...input,
    title: input.title.trim(),
    authorName: input.authorName.trim(),
    authorEmail: input.authorEmail.trim(),
    abstract: input.abstract.trim(),
    id: `sub_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    status: initialStatus,
    statusNote: isPersonal
      ? "بحث شخصي: لا يُنشر إلا بعد المراجعة العلمية والإدارية."
      : "تم الاستلام — يبدأ الفحص الآلي ثم المراجعة.",
    createdAt: now,
    updatedAt: now,
    ownerKey: getOwnerKey(),
    isPersonal,
    reviewLog: [{ at: now, by: "system", from: "draft", to: initialStatus, note: "إنشاء الطلب" }],
  };

  const all = listSubmissions();
  all.unshift(submission);
  writeJson(SUBMISSIONS_KEY, all);

  // محاكاة فحص آلي سريع لغير الشخصي → بانتظار المراجعة (لا نشر مباشر أبدًا)
  if (!isPersonal) {
    advanceSubmissionStatus(submission.id, "awaiting_review", "system", "اجتاز الفحص الآلي الأولي — بانتظار مراجع.");
  }

  return { ok: true, submission: getSubmission(submission.id)! };
}

export function getSubmission(id: string): ResearchSubmission | null {
  return listSubmissions().find((s) => s.id === id) ?? null;
}

export function advanceSubmissionStatus(
  id: string,
  to: ReviewStatus,
  by: string,
  note?: string,
): ResearchSubmission | null {
  const all = listSubmissions();
  const idx = all.findIndex((s) => s.id === id);
  if (idx < 0) return null;
  const cur = all[idx];
  // حماية: لا نشر مباشر من المستخدم؛ النشر فقط عبر مسار مراجعة
  if (to === "published" && by === "owner") return cur;
  if (cur.isPersonal && to === "published" && by === "system") return cur;

  const updated: ResearchSubmission = {
    ...cur,
    status: to,
    statusNote: note || cur.statusNote,
    updatedAt: new Date().toISOString(),
    reviewLog: [...cur.reviewLog, { at: new Date().toISOString(), by, from: cur.status, to, note }],
  };
  all[idx] = updated;
  writeJson(SUBMISSIONS_KEY, all);
  return updated;
}

/** مراجعة إدارية (واجهة الأدمن / اختبارات) — صلاحيات الخادم في API منفصلة. */
export function adminSetSubmissionStatus(id: string, to: ReviewStatus, by: string, note?: string): ResearchSubmission | null {
  return advanceSubmissionStatus(id, to, by || "admin", note);
}

export function toggleSavedResearch(id: string): string[] {
  const saved = new Set(readJson<string[]>(SAVED_KEY, []));
  if (saved.has(id)) saved.delete(id);
  else saved.add(id);
  const arr = [...saved];
  writeJson(SAVED_KEY, arr);
  return arr;
}

export function listSavedResearchIds(): string[] {
  return readJson<string[]>(SAVED_KEY, []);
}

export function pushSearchHistory(q: string): string[] {
  const t = q.trim();
  if (t.length < 2) return readJson(SEARCH_HISTORY_KEY, []);
  const prev = readJson<string[]>(SEARCH_HISTORY_KEY, []).filter((x) => x !== t);
  const next = [t, ...prev].slice(0, 20);
  writeJson(SEARCH_HISTORY_KEY, next);
  return next;
}

export function getSearchHistory(): string[] {
  return readJson(SEARCH_HISTORY_KEY, []);
}

export function recordResearchView(id: string): void {
  const views = readJson<Record<string, number>>(VIEWS_KEY, {});
  views[id] = (views[id] || 0) + 1;
  writeJson(VIEWS_KEY, views);
}

export function getLocalViewCount(id: string): number {
  return readJson<Record<string, number>>(VIEWS_KEY, {})[id] || 0;
}

export function similarResearches(r: ResearchRecord, limit = 6): ResearchRecord[] {
  const pool = listPublishedResearches().filter((x) => x.id !== r.id);
  const scored = pool.map((x) => {
    let s = 0;
    for (const c of r.categoryIds) if (x.categoryIds.includes(c)) s += 10;
    for (const k of r.keywords) if (x.keywords.some((y) => y === k)) s += 8;
    if (x.kind === r.kind) s += 4;
    return { x, s };
  });
  return scored.sort((a, b) => b.s - a.s).slice(0, limit).map((o) => o.x);
}

export function researchesByAuthor(name: string, excludeId?: string): ResearchRecord[] {
  return listPublishedResearches().filter(
    (r) => r.id !== excludeId && r.authors.some((a) => a.name === name),
  );
}

/**
 * تشغيل استيراد يومي آمن: لا يجلب مصادر غير مفعّلة، ولا ينزّل ملفات.
 * عند عدم وجود مصادر نشطة يُسجَّل تقرير صفري صادق.
 */
export function runDailyImportDry(options?: { force?: boolean; maxResults?: number }): DailyImportReport {
  const now = new Date().toISOString();
  if (!options?.force) {
    const lock = readJson<{ at: string } | null>(IMPORT_LOCK_KEY, null);
    if (lock?.at && Date.now() - Date.parse(lock.at) < 60_000) {
      return {
        ranAt: now,
        discovered: 0,
        accepted: 0,
        duplicates: 0,
        rejected: 0,
        needsReview: 0,
        failedSources: [],
        notes: ["تخطي: تشغيل متزامن/قريب جدًا — قفل الدقيقة الواحدة."],
      };
    }
  }
  writeJson(IMPORT_LOCK_KEY, { at: now });

  const active = listActiveImportSources(RESEARCH_IMPORT_SOURCES);
  const report: DailyImportReport = {
    ranAt: now,
    discovered: 0,
    accepted: 0,
    duplicates: 0,
    rejected: 0,
    needsReview: 0,
    failedSources: [],
    notes: [],
  };

  if (active.length === 0) {
    report.notes.push("لا مصادر نشطة. فعّل مصدرًا مصرّحًا به من لوحة الإدارة بعد التحقق من شروط الاستخدام.");
  } else {
    for (const src of active) {
      report.notes.push(`المصدر «${src.name}» مفعّل لكن الجلب الحي لم يُختبر بعد — لم يُجلب محتوى.`);
      report.failedSources.push(src.id);
    }
  }

  const logs = readJson<DailyImportReport[]>(IMPORT_LOG_KEY, []);
  logs.unshift(report);
  writeJson(IMPORT_LOG_KEY, logs.slice(0, 60));
  return report;
}

export function listImportLogs(): DailyImportReport[] {
  return readJson(IMPORT_LOG_KEY, []);
}

export function canDownloadFile(r: ResearchRecord): boolean {
  if (r.accessType !== "fulltext_download" || !r.filePath) return false;
  const allowed: Array<ResearchRecord["license"]> = [
    "cc_by", "cc_by_sa", "cc_by_nc", "cc_by_nc_sa", "cc_by_nd", "cc0",
    "author_permission", "publisher_permission",
  ];
  return allowed.includes(r.license);
}

export function canViewFullText(r: ResearchRecord): boolean {
  return r.accessType === "fulltext_view" || r.accessType === "fulltext_download";
}
