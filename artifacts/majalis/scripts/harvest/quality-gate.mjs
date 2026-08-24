import { normalizeArabic, stripEmojiFromTitle } from "./normalize.mjs";
import { classifyType, extractFields } from "./classify.mjs";

export const PUBLISH_MAX_AGE_DAYS = 14;
const MS_DAY = 24 * 60 * 60 * 1000;

/** @type {Set<string>} */
export const USEFUL_CARD_TYPES = new Set([
  "درس",
  "حلقة",
  "دورة",
  "تسجيل",
  "محاضرة",
  "مسابقة",
  "تنبيه",
]);

const WEAK_TITLE_RES = [
  /^photo by\b/i,
  /\bpuede ser\b/i,
  /\bimagen de\b/i,
  /\bimagen\b/i,
  /\bimage may contain\b/i,
  /^this image\b/i,
  /^may be an image\b/i,
  /^could be an image\b/i,
  /^possibly an image\b/i,
  /^instagram photo\b/i,
];

const ARABIC_RUN = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]+/g;
const LATIN_HEAVY = /[A-Za-zÀ-ÿ]{4,}/;

const EN_MONTH =
  /\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/i;
const EN_MONTH_DMY =
  /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\b/i;

const AR_MONTH_TO_EN = {
  يناير: "January",
  فبراير: "February",
  مارس: "March",
  ابريل: "April",
  أبريل: "April",
  مايو: "May",
  يونيو: "June",
  يوليو: "July",
  اغسطس: "August",
  أغسطس: "August",
  سبتمبر: "September",
  اكتوبر: "October",
  أكتوبر: "October",
  نوفمبر: "November",
  ديسمبر: "December",
};

const NON_LESSON_RE = /(?:عزاء|تعازي|وفا(?:ة|ه)|المغفور|رحمه\s*الله|صادق\s*المواس(?:اة|اه))/i;
const ACTIONABLE_RE =
  /(?:بعد|قبل)\s+(?:الفجر|الظهر|العصر|المغرب|العشاء|التراويح)|(?:ال(?:سبت|احد|أحد|اثنين|ثلاثاء|اربعاء|أربعاء|خميس|جمعه|جمعة))|(?:كل\s*(?:اسبوع|أسبوع))/iu;

/**
 * @param {string} text
 * @param {ReturnType<typeof extractFields>} fields
 */
function lacksUsefulLessonSignal(text, fields) {
  if (fields.register_url || fields.starts_at || fields.time_text || fields.schedule_kind) return false;
  const n = normalizeArabic(text);
  if (NON_LESSON_RE.test(n)) return true;
  if (ACTIONABLE_RE.test(n)) return false;
  return true;
}

/**
 * @param {string} input
 */
export function isWeakAutoTitle(input) {
  const s = String(input ?? "").trim();
  if (!s) return true;
  if (WEAK_TITLE_RES.some((re) => re.test(s))) return true;
  const normalized = normalizeArabic(s);
  if (!normalized) return true;
  if (/^(photo|image|video|reel|puede|may be|this may)/i.test(s)) return true;
  return false;
}

/**
 * عنوان عربي نظيف من النص — بلا خلط إسباني/إنجليزي آللي.
 * @param {string} text
 * @param {number} [maxLen]
 */
export function extractArabicTitle(text, maxLen = 80) {
  const raw = stripEmojiFromTitle(String(text ?? ""));
  const lines = raw
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (isWeakAutoTitle(line)) continue;
    const runs = line.match(ARABIC_RUN);
    if (!runs?.length) continue;
    const arabic = runs.join(" ").replace(/\s+/g, " ").trim();
    if (arabic.length < 6) continue;
    const latin = line.match(LATIN_HEAVY);
    if (latin && latin.join(" ").length > arabic.length * 0.45) continue;
    if (arabic.length <= maxLen) return arabic;
    return `${arabic.slice(0, maxLen - 1)}…`;
  }

  const allRuns = raw.match(ARABIC_RUN);
  if (!allRuns?.length) return null;
  const merged = allRuns.join(" ").replace(/\s+/g, " ").trim();
  if (merged.length < 6 || isWeakAutoTitle(merged)) return null;
  return merged.length <= maxLen ? merged : `${merged.slice(0, maxLen - 1)}…`;
}

/**
 * @param {string} text
 * @param {Date} [now]
 * @returns {string|null} ISO
 */
export function parseFutureEventDate(text, now = new Date()) {
  const raw = String(text ?? "");
  const m1 = raw.match(EN_MONTH);
  if (m1) {
    const d = new Date(`${m1[2]} ${m1[1]}, ${m1[3]} UTC`);
    if (!Number.isNaN(d.getTime()) && d.getTime() > now.getTime()) return d.toISOString();
  }
  const m2 = raw.match(EN_MONTH_DMY);
  if (m2) {
    const d = new Date(`${m2[1]} ${m2[2]}, ${m2[3]} UTC`);
    if (!Number.isNaN(d.getTime()) && d.getTime() > now.getTime()) return d.toISOString();
  }
  const m3 = raw.match(
    /(\d{1,2})\s*(?:يناير|فبراير|مارس|ابريل|أبريل|مايو|يونيو|يوليو|اغسطس|أغسطس|سبتمبر|اكتوبر|أكتوبر|نوفمبر|ديسمبر)\s*(\d{4})/i,
  );
  if (m3) {
    const monthToken = raw
      .match(/(?:يناير|فبراير|مارس|ابريل|أبريل|مايو|يونيو|يوليو|اغسطس|أغسطس|سبتمبر|اكتوبر|أكتوبر|نوفمبر|ديسمبر)/i)?.[0];
    const enMonth = monthToken ? AR_MONTH_TO_EN[normalizeArabic(monthToken)] : null;
    if (enMonth) {
      const d = new Date(`${enMonth} ${m3[1]}, ${m3[3]} UTC`);
      if (!Number.isNaN(d.getTime()) && d.getTime() > now.getTime()) return d.toISOString();
    }
  }
  const fields = extractFields(raw);
  if (fields.starts_at) {
    const t = Date.parse(fields.starts_at);
    if (Number.isFinite(t) && t > now.getTime()) return new Date(t).toISOString();
  }
  return null;
}

function hasFutureRegistrationOrEvent(text, fields, future_at, now) {
  if (future_at) return true;
  if (fields.register_url && /تسجيل|استمارة|forms\.gle/i.test(text)) return true;
  const n = normalizeArabic(text);
  if (
    /(?:تسجيل|استمار(?:ة|ه)).*(?:مفتوح|متاح)|forms\.gle|docs\.google\.com\/forms/.test(text) &&
    /(?:يبدأ|يبدا|\d{1,2}\s*(?:يناير|فبراير|مارس|ابريل|أبريل|مايو|يونيو|يوليو|اغسطس|أغسطس|سبتمبر|اكتوبر|أكتوبر|نوفمبر|ديسمبر))/.test(
      n,
    )
  ) {
    return true;
  }
  if (fields.starts_at) {
    const t = Date.parse(fields.starts_at);
    if (Number.isFinite(t) && t > now.getTime()) return true;
  }
  return false;
}

/**
 * تاريخ مضمّن في تسمية Instagram التلقائية: Photo by … on February 11, 2024
 * @param {string} text
 * @returns {string|null} ISO
 */
export function parseCaptionPublishedDate(text) {
  const raw = String(text ?? "");
  const m1 = raw.match(
    /\bon\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\b/i,
  );
  if (m1) {
    const d = new Date(`${m1[1]} ${m1[2]}, ${m1[3]} UTC`);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  const m2 = raw.match(
    /\bon\s+(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/i,
  );
  if (m2) {
    const d = new Date(`${m2[2]} ${m2[1]}, ${m2[3]} UTC`);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return null;
}

/**
 * @param {string|null|undefined} publishedAt
 * @param {string} [text]
 */
export function resolvePublishedAt(publishedAt, text = "") {
  const captionDate = parseCaptionPublishedDate(text);
  if (!hasTrustedPublishedAt(publishedAt)) return captionDate;
  if (!captionDate) return publishedAt;
  const pub = Date.parse(String(publishedAt));
  const cap = Date.parse(captionDate);
  // وقت الحصاد غالباً أحدث من تاريخ المنشور الحقيقي في التسمية
  if (cap < pub - MS_DAY) return captionDate;
  return publishedAt;
}

/**
 * @param {string|null|undefined} publishedAt
 */
export function hasTrustedPublishedAt(publishedAt) {
  if (!publishedAt) return false;
  const t = Date.parse(publishedAt);
  return Number.isFinite(t);
}

/**
 * @param {string|null|undefined} publishedAt
 * @param {Date} [now]
 */
export function isPublishedWithinDays(publishedAt, days = PUBLISH_MAX_AGE_DAYS, now = new Date()) {
  if (!hasTrustedPublishedAt(publishedAt)) return false;
  const t = Date.parse(String(publishedAt));
  return now.getTime() - t <= days * MS_DAY;
}

/**
 * @param {object} input
 * @param {string} input.text
 * @param {string} [input.title]
 * @param {string|null} [input.publishedAt]
 * @param {string|null} [input.type]
 * @param {ReturnType<typeof extractFields>} [input.fields]
 * @param {Date} [input.now]
 * @returns {{ ok: true, title_ar: string, type: string, future_at: string|null } | { ok: false, reason: string }}
 */
export function qualityGate(input) {
  const text = String(input.text ?? "").trim();
  const now = input.now instanceof Date ? input.now : new Date();
  const fields = input.fields ?? extractFields(text);
  const type = classifyType(text);

  const candidateTitle = input.title || text.split("\n")[0] || "";
  if (isWeakAutoTitle(candidateTitle) || isWeakAutoTitle(text.slice(0, 240))) {
    return { ok: false, reason: "weak_title" };
  }

  const title_ar = extractArabicTitle(text);
  if (!title_ar) {
    return { ok: false, reason: "weak_title" };
  }

  if (!type || !USEFUL_CARD_TYPES.has(type)) {
    return { ok: false, reason: "no_useful_type" };
  }

  const future_at = parseFutureEventDate(text, now);
  const hasFuture = hasFutureRegistrationOrEvent(text, fields, future_at, now);

  const publishedAt = resolvePublishedAt(input.publishedAt ?? null, text);
  if (hasTrustedPublishedAt(publishedAt)) {
    if (!isPublishedWithinDays(publishedAt, PUBLISH_MAX_AGE_DAYS, now) && !hasFuture) {
      return { ok: false, reason: "too_old" };
    }
  } else if (!hasFuture) {
    return { ok: false, reason: "missing_date" };
  }

  if (lacksUsefulLessonSignal(text, fields)) {
    return { ok: false, reason: "no_useful_type" };
  }

  return { ok: true, title_ar, type, future_at };
}

/** أولوية العرض — أعلى = أهم */
export function feedPriorityScore(card) {
  let score = 0;
  if (card.register_url) score += 120;
  if (card.starts_at) {
    const t = Date.parse(card.starts_at);
    if (Number.isFinite(t)) {
      const days = (t - Date.now()) / MS_DAY;
      if (days >= 0 && days <= 14) score += 90 - Math.min(80, days * 4);
    }
  }
  if (card.type === "تسجيل") score += 70;
  if (card.type === "حلقة") score += 55;
  if (card.type === "دورة") score += 50;
  if (card.type === "درس" || card.type === "محاضرة") score += 45;
  if (card.type === "مسابقة") score += 40;
  if (card.published_at) {
    const ageDays = (Date.now() - Date.parse(card.published_at)) / MS_DAY;
    if (Number.isFinite(ageDays) && ageDays >= 0) score += Math.max(0, 30 - ageDays);
  }
  return score;
}

/**
 * ترتيب وتقليل ازدحام feed — بلا تكرار من نفس المصدر.
 * @param {object[]} items
 * @param {{ todayLimit?: number, weekLimit?: number }} [opts]
 */
export function curateFeedForDisplay(items, opts = {}) {
  const todayLimit = opts.todayLimit ?? 12;
  const weekLimit = opts.weekLimit ?? 12;
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);

  const sorted = [...items].sort((a, b) => {
    const d = feedPriorityScore(b) - feedPriorityScore(a);
    if (d !== 0) return d;
    return Date.parse(b.published_at || 0) - Date.parse(a.published_at || 0);
  });

  const seenSource = new Set();
  const deduped = [];
  for (const card of sorted) {
    const srcId = card.sources?.[0]?.id || card.id;
    if (seenSource.has(srcId)) continue;
    seenSource.add(srcId);
    deduped.push(card);
  }

  const today = [];
  const week = [];
  for (const card of deduped) {
    const pub = card.published_at ? new Date(card.published_at) : null;
    const isToday =
      pub && pub.toDateString() === now.toDateString();
    const isWeek = pub && pub >= weekStart;
    if (isToday && today.length < todayLimit) today.push(card);
    if (isWeek && week.length < weekLimit) week.push(card);
  }

  return { sorted: deduped, today, week };
}

/**
 * فلترة بطاقات feed المخزّنة — يُستدعى عند النشر.
 * @param {object[]} items
 * @param {Date} [now]
 */
export function curateStoredFeedItems(items, now = new Date()) {
  const kept = [];
  const stats = {
    rejected_old: 0,
    rejected_weak_title: 0,
    rejected_no_useful_type: 0,
    rejected_missing_date: 0,
    rejected_other: 0,
  };

  for (const card of items) {
    const text = [card.title_ar, card.summary_ar].filter(Boolean).join("\n");
    const gate = qualityGate({
      text,
      title: card.title_ar,
      publishedAt: card.published_at,
      fields: {
        sheikh: card.sheikh,
        place: card.place,
        starts_at: card.starts_at,
        register_url: card.register_url,
      },
      now,
    });
    if (!gate.ok) {
      if (gate.reason === "too_old") stats.rejected_old += 1;
      else if (gate.reason === "weak_title") stats.rejected_weak_title += 1;
      else if (gate.reason === "no_useful_type") stats.rejected_no_useful_type += 1;
      else if (gate.reason === "missing_date") stats.rejected_missing_date += 1;
      else stats.rejected_other += 1;
      continue;
    }
    const resolvedPublished = resolvePublishedAt(card.published_at, text);
    kept.push({
      ...card,
      type: gate.type,
      title_ar: gate.title_ar,
      published_at: resolvedPublished || card.published_at,
    });
  }

  const seenSource = new Set();
  const deduped = [];
  for (const card of kept.sort((a, b) => feedPriorityScore(b) - feedPriorityScore(a))) {
    const srcId = card.sources?.[0]?.id || card.id;
    if (seenSource.has(srcId)) continue;
    seenSource.add(srcId);
    deduped.push(card);
  }

  return { items: deduped, stats };
}
