/**
 * Parser مخصص لجدول الدروس الأسبوعي — الشيخ عثمان الخميس
 * المصدر: HTML مباشر على https://www.othmanalkhamees.com/schedule
 * لا RSS / لا API جدول / لا JSON مخفي.
 */
import { stripTags } from "../http.mjs";

export const OTHMAN_SCHEDULE_CANONICAL = "https://www.othmanalkhamees.com/schedule";
export const OTHMAN_SCHEDULE_HANDLE = "othmanalkhamees_schedule";

const DAY_NAMES = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

const DAY_TO_UTC = {
  الأحد: 0,
  الاحد: 0,
  الاثنين: 1,
  الإثنين: 1,
  الثلاثاء: 2,
  الاربعاء: 3,
  الأربعاء: 3,
  الخميس: 4,
  الجمعة: 5,
  الجمعه: 5,
  السبت: 6,
};

/** إزالة utm / fbclid والإبقاء على canonical فقط */
export function canonicalUrl(raw) {
  if (!raw) return null;
  try {
    const u = new URL(String(raw).trim(), OTHMAN_SCHEDULE_CANONICAL);
    if (!/^https?:$/i.test(u.protocol)) return null;
    for (const k of [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "fbclid",
      "gclid",
      "mc_cid",
      "mc_eid",
    ]) {
      u.searchParams.delete(k);
    }
    u.hash = "";
    let out = u.toString();
    if (out.endsWith("/") && u.pathname !== "/") out = out.slice(0, -1);
    return out;
  } catch {
    return null;
  }
}

function decodeEntities(s) {
  return String(s ?? "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function nextIsoForWeekday(dayAr, now = new Date()) {
  const target = DAY_TO_UTC[dayAr] ?? DAY_TO_UTC[decodeEntities(dayAr)];
  if (target == null) return null;
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const delta = (target - d.getUTCDay() + 7) % 7;
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

/** تطبيع الوقت ليطابق TIME_RE في classify */
function normalizeTimeText(raw) {
  const t = decodeEntities(raw);
  if (!t) return null;
  const afterPrayer = t.match(/بعد\s*(?:صلاة\s*)?(الفجر|الظهر|العصر|المغرب|العشاء|التراويح)/i);
  if (afterPrayer) return `بعد ${afterPrayer[1]}`;
  const clock = t.match(/(?:الساعة\s*)?(\d{1,2})\s*(?::|٫|،)?\s*(\d{0,2})\s*(صباحاً|صباحا|مساءً|مساء|ص|م)?/i);
  if (clock) {
    const hh = clock[1];
    const mm = clock[2] || "00";
    const period = clock[3] || "";
    const periodNorm = /مساء/.test(period) || period === "م" ? "مساء" : /صباح|ص/.test(period) ? "صباحا" : "";
    return `${hh}:${mm}${periodNorm ? ` ${periodNorm}` : ""}`.trim();
  }
  return t;
}

/**
 * اقتطاع شبكة بطاقات الجدول فقط (تجنب التنقّل/التذييل/الإعلانات)
 * @param {string} html
 */
function extractScheduleGrid(html) {
  const start = html.search(/جدول الدروس الأسبوعي/i);
  if (start < 0) return html;
  const slice = html.slice(start);
  const end = slice.search(/المحاضرات حضورياً|©\s*20\d{2}|info@othmanalkamees/i);
  return end > 0 ? slice.slice(0, end) : slice;
}

/**
 * تقسيم بطاقات الجدول ذات الحد olive (ليست عناصر تنقّل)
 * @param {string} html
 */
function splitLessonCards(html) {
  const grid = extractScheduleGrid(html);
  const parts = grid.split(/class="relative overflow-hidden rounded-\[26px\][^"]*border-olive-200[^"]*"/i);
  return parts.slice(1).map((p) => {
    const next = p.search(/class="relative overflow-hidden rounded-\[26px\]/i);
    return next > 0 ? p.slice(0, next) : p;
  });
}

/**
 * @param {string} cardHtml
 */
export function parseScheduleCard(cardHtml, now = new Date()) {
  const day =
    DAY_NAMES.map((d) => {
      const re = new RegExp(`shrink-0">\\s*${d}\\s*<`, "i");
      return re.test(cardHtml) ? d : null;
    }).find(Boolean) ||
    decodeEntities(cardHtml.match(/font-bold[^>]*>\s*(السبت|الأحد|الاحد|الاثنين|الإثنين|الثلاثاء|الأربعاء|الاربعاء|الخميس|الجمعة|الجمعه)\s*</i)?.[1] ?? "");

  const title = decodeEntities(
    stripTags(cardHtml.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i)?.[1] ?? ""),
  );
  if (!title || !day) return null;

  const council =
    decodeEntities(
      cardHtml.match(/رقم المجلس:\s*<\/span>\s*<span>\s*([^<]+)\s*<\/span>/i)?.[1] ?? "",
    ) || null;

  const progress = decodeEntities(
    stripTags(
      cardHtml.match(/وصلنا إلى:\s*<\/span>\s*([\s\S]*?)<\/p>/i)?.[1] ?? "",
    ),
  );

  const timeRaw =
    decodeEntities(
      stripTags(
        cardHtml.match(/polyline points="12 6[\s\S]*?<span class="text-xs">([^<]+)<\/span>/i)?.[1] ??
          cardHtml.match(/الساعة[^<]+|بعد صلاة[^<]+|بعد[^<]{0,40}/i)?.[0] ??
          "",
      ),
    ) || null;
  const time_text = normalizeTimeText(timeRaw);

  const mosque = decodeEntities(
    stripTags(
      cardHtml.match(/maps\.app\.goo\.gl[^>]*>[\s\S]*?<span class="text-xs font-medium">([^<]+)<\/span>/i)?.[1] ??
        cardHtml.match(/مسجد[^<]{3,80}/i)?.[0] ??
        "",
    ),
  );

  const previousHref = cardHtml.match(
    /href="(https:\/\/www\.othmanalkhamees\.com\/schedule\/\d+\/previous-councils[^"]*)"/i,
  )?.[1];
  const previous_councils_url = canonicalUrl(previousHref);

  const slotId =
    cardHtml.match(/schedule\/(\d+)\/(?:book|previous-councils)/i)?.[1] ||
    `${day}-${title}`.replace(/\s+/g, "-");

  const nextDate = nextIsoForWeekday(day, now);
  const lines = [
    title,
    `درس أسبوعي — يوم ${day}`,
    council ? `رقم المجلس: ${council}` : null,
    progress ? `وصلنا إلى: ${progress}` : null,
    time_text ? `الوقت: ${time_text}` : null,
    mosque ? `المكان: ${mosque}` : null,
    nextDate ? `الموعد القادم: ${nextDate}` : null,
    previous_councils_url ? `رابط المجالس السابقة: ${previous_councils_url}` : null,
    "الشيخ عثمان الخميس",
    "كل أسبوع",
  ].filter(Boolean);

  return {
    externalId: `othmanalkhamees-schedule-${slotId}`,
    url: OTHMAN_SCHEDULE_CANONICAL,
    title,
    text: lines.join("\n"),
    publishedAt: now.toISOString(),
    meta: {
      day,
      title,
      mosque: mosque || null,
      time_text,
      council_number: council,
      previous_councils_url,
      next_date: nextDate,
    },
  };
}

/**
 * @param {string} html
 * @returns {Array<{externalId:string,url:string,title:string,text:string,publishedAt:string}>}
 */
export function parseOthmanScheduleHtml(html, now = new Date()) {
  const cards = splitLessonCards(html);
  const items = [];
  const seen = new Set();
  for (const card of cards) {
    const item = parseScheduleCard(card, now);
    if (!item) continue;
    if (seen.has(item.externalId)) continue;
    seen.add(item.externalId);
    items.push({
      externalId: item.externalId,
      url: item.url,
      title: item.title,
      text: item.text,
      publishedAt: item.publishedAt,
    });
  }
  return items;
}

export function isOthmanScheduleAccount(account) {
  if (!account) return false;
  if (account.handle === OTHMAN_SCHEDULE_HANDLE) return true;
  if (account.id === `web-${OTHMAN_SCHEDULE_HANDLE}`) return true;
  const site = String(account.site || account.url || "");
  return /othmanalkhamees\.com\/schedule\/?$/i.test(site.replace(/\?.*$/, ""));
}
