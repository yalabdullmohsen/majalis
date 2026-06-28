/**
 * Automatic content classification and routing — no manual categorization.
 */

import { normalizeContentKind } from "../content-kind.mjs";

const LESSON_SIGNALS = [/درس/u, /محاضرة/u, /خطبة/u, /دورة/u, /حلقة/u, /مسلسل/u, /conference/i, /lecture/i, /podcast/i];
const BOOK_SIGNALS = [/كتاب/u, /طبعة/u, /pdf/u, /epub/u, /مكتبة/u, /book/i];
const FATWA_SIGNALS = [/فتوى/u, /فتاوى/u, /سؤال/u, /جواب/u, /fatwa/i];
const ARTICLE_SIGNALS = [/مقال/u, /بحث/u, /دراسة/u, /article/i];
const NEWS_SIGNALS = [/خبر/u, /إعلان/u, /تعيين/u, /مؤتمر/u, /قرار رسمي/u, /news/i, /announcement/i];
const MIRACLE_SIGNALS = [/إعجاز/u, /miracle/i, /scientific/i];
const BENEFIT_SIGNALS = [/فائدة/u, /تذكير/u, /نصيحة/u, /quote/i];
const EVENT_SIGNALS = [/مؤتمر/u, /ندوة/u, /مسابقة/u, /ورشة/u, /فعالية/u, /event/i, /competition/i];

const POLITICAL_NOISE = [/انتخاب/u, /حزب/u, /معارضة/u, /انقلاب/u];

export function classifyContent(item, connector) {
  const text = `${item.raw_title || ""} ${item.raw_body || ""}`.toLowerCase();
  const payload = item.raw_payload || {};

  if (payload.enclosure_url || payload.media_type?.includes("audio") || payload.media_type?.includes("video")) {
    if (EVENT_SIGNALS.some((re) => re.test(text))) return normalizeContentKind("event");
    return normalizeContentKind("lesson");
  }

  if (payload.event_type || payload.vevent || payload.dtstart) {
    return normalizeContentKind("event");
  }

  if (FATWA_SIGNALS.some((re) => re.test(text))) return normalizeContentKind("fatwa");
  if (BOOK_SIGNALS.some((re) => re.test(text))) return normalizeContentKind("book");
  if (MIRACLE_SIGNALS.some((re) => re.test(text))) return normalizeContentKind("miracle");
  if (BENEFIT_SIGNALS.some((re) => re.test(text))) return normalizeContentKind("fawaid");
  if (EVENT_SIGNALS.some((re) => re.test(text))) return normalizeContentKind("event");
  if (LESSON_SIGNALS.some((re) => re.test(text))) return normalizeContentKind("lesson");

  if (NEWS_SIGNALS.some((re) => re.test(text)) && !POLITICAL_NOISE.some((re) => re.test(text))) {
    return normalizeContentKind("news");
  }

  if (ARTICLE_SIGNALS.some((re) => re.test(text))) return normalizeContentKind("article");

  const allowed = connector?.allowed_kinds || connector?.allowedKinds || [];
  if (allowed.length === 1) return normalizeContentKind(allowed[0]);

  return normalizeContentKind(item.content_kind || allowed[0] || "article");
}

export function routeContentKind(kind) {
  const normalized = normalizeContentKind(kind);
  const routes = {
    lesson: "lessons",
    lecture: "lessons",
    course: "lessons",
    book: "library",
    article: "library",
    fatwa: "fatwas",
    fiqh_decision: "fiqh-council",
    sharia_ruling: "rulings",
    news: "updates",
    announcement: "updates",
    miracle: "miracles",
    fawaid: "fawaid",
    event: "events",
    qa: "qa",
    annual_course: "annual-courses",
    sheikh: "sheikhs",
  };
  return routes[normalized] || "search";
}

export function enrichItemClassification(item, connector) {
  const kind = classifyContent(item, connector);
  return { ...item, content_kind: kind };
}
