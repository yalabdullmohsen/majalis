#!/usr/bin/env node
/**
 * majlisilm-audit.mjs — فاحص شامل لموقع سُنّة
 * ------------------------------------------------------------------
 * بلا أي اعتماديات. يتطلب Node 18+ (يستعمل fetch المدمج).
 *
 * الاستعمال:
 *   node scripts/majlisilm-audit.mjs crawl                      # فحص الموقع الحي
 *   node scripts/majlisilm-audit.mjs crawl --base https://localhost:3000
 *   node scripts/majlisilm-audit.mjs crawl --max 500 --concurrency 6
 *   node scripts/majlisilm-audit.mjs lint ./src                 # فحص ملفات المحتوى المحلية
 *   node scripts/majlisilm-audit.mjs lint ./data --ext .json,.jsonl,.mdx
 *
 * المخرجات: تقرير في الطرفية + reports/majlisilm-audit-report.md + .json
 */

import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(SCRIPT_DIR, "..");

// ══════════════════════════════════════════════════════════════════
// الإعدادات
// ══════════════════════════════════════════════════════════════════

const CONFIG = {
  base: "https://majlisilm.com",
  maxPages: 400,
  concurrency: 5,
  delayMs: 120,
  timeoutMs: 20000,
  userAgent: "MajlisilmAudit/1.0 (+internal QA)",

  // صفحة تُعدّ "رقيقة" إذا قلّ نصها الرئيسي عن هذا
  thinTextChars: 350,
  // صفحة محورية (hub) بلا روابط داخلية للمحتوى تُعدّ طريقاً مسدوداً
  hubMinContentLinks: 3,
  // المسارات التي يُتوقع أن تكون صفحات محورية (مطابقة لمسارات App.tsx)
  hubPaths: [
    "/fiqh",
    "/hadith-science",
    "/quran-hub",
    "/library",
    "/scholars",
    "/adhkar",
    "/islamic-glossary",
    "/lessons",
    "/rulings",
    "/qa",
    "/hadith",
  ],
  // بادئات روابط تُحسب «محتوىً فرعيًا» للمحور (لأن بعض المحاور تشير لأقسام شقيقة لا لمسارات تحتها فقط)
  hubRelatedPrefixes: {
    "/fiqh": ["/fiqh/", "/fiqh-", "/rulings", "/madhahib", "/qa", "/tahara", "/salah", "/zakat", "/sawm", "/hajj"],
    "/quran-hub": ["/quran/", "/mushaf", "/quran-", "/ulum-quran", "/duas-quran", "/daily-wird"],
    "/adhkar": ["/adhkar", "/duas", "/sunan-yawmiyya", "/duas-quran"],
    "/hadith-science": ["/hadith", "/arbaeen-nawawi", "/library/book-bukhari", "/library/book-muslim"],
    "/islamic-glossary": ["/islamic-glossary", "/sections", "/fiqh-qawaid", "/madhahib", "/hadith-science", "/tawhid", "/adab-talab-ilm"],
    "/library": ["/library/"],
    "/lessons": ["/lessons/"],
    "/scholars": ["/scholars/"],
    "/rulings": ["/rulings/"],
    "/qa": ["/qa"],
    "/hadith": ["/hadith/"],
    "/durus-imaniyya": ["/durus-imaniyya", "/tazkiya-topics", "/raqaiq", "/tawba", "/tawhid"],
    "/durus-mutanawwia": ["/durus-mutanawwia", "/fikr-waqia", "/usra-mujtama", "/fawaid", "/sections"],
    "/iman-topics": ["/iman-topics", "/tawhid", "/arkan-iman", "/learn/", "/asma-husna"],
    "/quran-studies": ["/quran-studies", "/quran/", "/mushaf", "/ulum-quran", "/quran-hub", "/duas-quran"],
    "/sunnah-studies": ["/sunnah-studies", "/hadith", "/sunan-yawmiyya", "/arbaeen-nawawi", "/shamael"],
    "/tazkiya-topics": ["/tazkiya-topics", "/durus-imaniyya", "/raqaiq", "/akhlaq", "/tawba", "/sins-and-rights"],
    "/tarikh-islami": ["/tarikh-islami", "/seerah", "/sahabah", "/scholars", "/islamic-landmarks", "/prophets"],
    "/usra-mujtama": ["/usra-mujtama", "/family", "/akhlaq", "/amr-bil-maruf", "/fikr-waqia"],
    "/fikr-waqia": ["/fikr-waqia", "/usra-mujtama", "/durus-mutanawwia", "/fiqh-council", "/methodology"],
    "/mawsuaat": ["/mawsuaat", "/durus-mutanawwia", "/fawaid", "/library", "/islamic-glossary"],
    "/arabic-language": ["/arabic-language", "/ulum-quran", "/quran-studies", "/library", "/adab-talab-ilm"],
    "/maqasid-sharia": ["/maqasid-sharia", "/fiqh-qawaid", "/fiqh", "/fiqh-council", "/madhahib", "/rulings"],
    "/dalail-nubuwwah": ["/dalail-nubuwwah", "/seerah", "/miracles", "/shamael", "/prophets", "/tawhid"],
    "/learn/aqeedat-ahl-sunnah": ["/learn/", "/tawhid", "/iman-topics", "/asma-husna"],
    "/learn/aqsam-tawheed": ["/learn/", "/tawhid", "/asma-husna", "/iman-topics"],
    "/learn/nawaqid-islam": ["/learn/", "/tawhid", "/iman-topics", "/methodology"],
    "/learn/iman-billah": ["/learn/", "/tawhid", "/asma-husna", "/arkan-iman"],
  },

  // الأقسام التي يجب أن يظهر فيها دليل أو تخريج
  evidenceRequiredPrefixes: [
    "/rulings",
    "/fiqh",
    "/sins-and-rights",
    "/adhkar",
    "/hadith",
    "/tawhid",
    "/hadith-science",
    "/qa",
  ],

  // تصحيحات أسماء متكررة الخطأ: الخطأ -> الصواب
  namingRules: [
    ["ابن القيم الجوزية", "ابن قيم الجوزية"],
    ["ابن الجوزية", "ابن قيم الجوزية / ابن الجوزي (تحقّق من المقصود)"],
    ["البخارى", "البخاري"],
    ["ابن تيميه", "ابن تيمية"],
    ["ابن ماجة", "ابن ماجه"],
    ["الإمام النووى", "الإمام النووي"],
    ["صلى الله عليه و سلم", "صلى الله عليه وسلم"],
    ["رضى الله عنه", "رضي الله عنه"],
  ],

  // حقول نصية تُفحص في وضع lint
  lintTextKeys: [
    "title",
    "name",
    "description",
    "summary",
    "excerpt",
    "body",
    "content",
    "text",
    "answer",
    "question",
    "definition",
    "note",
    "bio",
    "العنوان",
    "الوصف",
    "النص",
    "الجواب",
    "السؤال",
  ],
};

const SEVERITY = { CRITICAL: "حرج", HIGH: "عالٍ", MEDIUM: "متوسط", LOW: "منخفض" };

// ══════════════════════════════════════════════════════════════════
// أدوات نصية عربية
// ══════════════════════════════════════════════════════════════════

const AR_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const TATWEEL = /\u0640/g;
const AR_INDIC = /[\u0660-\u0669]/;
const FA_INDIC = /[\u06F0-\u06F9]/;
const WESTERN = /[0-9]/;

const STOPWORDS = new Set([
  "من",
  "في",
  "على",
  "عن",
  "الى",
  "إلى",
  "مع",
  "ال",
  "و",
  "او",
  "أو",
  "الامام",
  "الإمام",
  "الشيخ",
  "شيخ",
  "الاسلام",
  "الإسلام",
  "كتاب",
  "شرح",
  "سيرة",
  "العالم",
  "المجلس",
  "العلمي",
  "د",
]);

function stripDiacritics(s) {
  return String(s).replace(AR_DIACRITICS, "").replace(TATWEEL, "");
}

function normalizeAr(s) {
  return stripDiacritics(s)
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[ـ«»"'`،؛:!؟.\-—–_()[\]{}|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(s) {
  return normalizeAr(s).split(" ").filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

/** نسبة تداخل الكلمات بين نصين (0..1) */
function overlapRatio(a, b) {
  const ta = tokens(a);
  const tb = new Set(tokens(b));
  if (!ta.length) return 1;
  const hit = ta.filter((t) => tb.has(t)).length;
  return hit / ta.length;
}

function hash(s) {
  return createHash("sha1").update(String(s)).digest("hex").slice(0, 16);
}

function arabicToWesternDigits(s) {
  return String(s).replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

// ══════════════════════════════════════════════════════════════════
// قواعد فحص النصوص (مشتركة بين crawl و lint)
// ══════════════════════════════════════════════════════════════════

const TEXT_RULES = [
  {
    id: "DOUBLE_PERIOD",
    severity: SEVERITY.MEDIUM,
    label: 'نقطتان متتاليتان ".." (غالباً خلل قالب يضيف نقطة على نص منتهٍ بنقطة)',
    test: (t) => matchAll(t, /(?<![.\u2026])\.\.(?!\.)/g),
  },
  {
    id: "PERIOD_THEN_COMMA",
    severity: SEVERITY.HIGH,
    label: 'نقطة تليها فاصلة ".،" (دمج آلي لوصف منتهٍ بنقطة مع لاحقة)',
    test: (t) => matchAll(t, /\.\s*[،,]/g),
  },
  {
    id: "SPACE_BEFORE_PUNCT",
    severity: SEVERITY.LOW,
    label: "مسافة قبل علامة ترقيم",
    test: (t) => matchAll(t, /\s+[،؛:؟!](?=\s|$)/g),
  },
  {
    id: "LATIN_PUNCT",
    severity: SEVERITY.LOW,
    label: "ترقيم لاتيني داخل نص عربي (, أو ; بدل ، أو ؛)",
    test: (t) => (/[\u0600-\u06FF]/.test(t) ? matchAll(t, /[\u0600-\u06FF]\s*[,;]/g) : []),
  },
  {
    id: "MIXED_DIGITS",
    severity: SEVERITY.MEDIUM,
    label: "اختلاط الأرقام الهندية (٠١٢) مع الإفرنجية (012) في نص واحد",
    test: (t) => ((AR_INDIC.test(t) || FA_INDIC.test(t)) && WESTERN.test(t) ? ["mixed"] : []),
  },
  {
    id: "DOUBLE_SPACE",
    severity: SEVERITY.LOW,
    label: "مسافات مزدوجة",
    test: (t) => matchAll(t, /\S {2,}\S/g),
  },
  {
    id: "REPEATED_WORD",
    severity: SEVERITY.MEDIUM,
    label: "كلمة مكررة متتالية",
    test: (t) =>
      matchAll(
        t,
        /(?:^|[\s،.؛:()«»"'])([\u0600-\u06FF]{3,})\s+\1(?=$|[\s،.؛:()«»"'])/gu,
      ),
  },
  {
    id: "TATWEEL",
    severity: SEVERITY.LOW,
    label: "تطويل (ـ) داخل النص",
    test: (t) => matchAll(String(t).replace(/هـ/g, "هج"), /\u0640+/g),
  },
  {
    id: "PLACEHOLDER",
    severity: SEVERITY.CRITICAL,
    label: "نص مؤقت لم يُستبدل (TODO / TBD / لورم / قريباً)",
    test: (t) =>
      matchAll(
        t,
        /\b(TODO|TBD|FIXME|XXX|lorem ipsum|placeholder)\b|لورم إيبسوم|نص تجريبي|قيد الإنشاء/gi,
      ),
  },
  {
    id: "HTML_ENTITY",
    severity: SEVERITY.MEDIUM,
    label: "كيان HTML غير مُفكَّك (&amp; &nbsp; &#39;)",
    test: (t) => matchAll(t, /&(amp|nbsp|lt|gt|quot|#\d+);/g),
  },
  {
    id: "MOJIBAKE",
    severity: SEVERITY.CRITICAL,
    label: "ترميز تالف (Ù / Ø / )",
    test: (t) => matchAll(t, /[ÙØ]{2,}|\uFFFD/g),
  },
  {
    id: "UNBALANCED_BRACKETS",
    severity: SEVERITY.LOW,
    label: "أقواس غير متوازنة",
    test: (t) => {
      const pairs = [
        ["(", ")"],
        ["[", "]"],
        ["{", "}"],
        ["«", "»"],
      ];
      const out = [];
      for (const [o, c] of pairs) {
        const a = (t.match(new RegExp("\\" + o, "g")) || []).length;
        const b = (t.match(new RegExp("\\" + c, "g")) || []).length;
        if (a !== b) out.push(`${o}${c}: ${a}/${b}`);
      }
      return out;
    },
  },
  {
    id: "NAMING",
    severity: SEVERITY.MEDIUM,
    label: "صيغة اسم غير معتمدة",
    test: (t) => {
      const out = [];
      for (const [wrong, right] of CONFIG.namingRules) {
        if (t.includes(wrong)) out.push(`«${wrong}» ← الصواب «${right}»`);
      }
      return out;
    },
  },
];

function matchAll(text, re) {
  const out = [];
  let m;
  const r = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
  while ((m = r.exec(String(text))) !== null) {
    out.push(m[0]);
    if (m.index === r.lastIndex) r.lastIndex++;
    if (out.length > 20) break;
  }
  return out;
}

function runTextRules(text, ctx, report) {
  if (!text || !String(text).trim()) return;
  for (const rule of TEXT_RULES) {
    const hits = rule.test(String(text));
    if (hits && hits.length) {
      report.add({
        severity: rule.severity,
        rule: rule.id,
        label: rule.label,
        where: ctx,
        sample: [...new Set(hits)].slice(0, 5).join(" | "),
      });
    }
  }
}

// ══════════════════════════════════════════════════════════════════
// جامع النتائج
// ══════════════════════════════════════════════════════════════════

class Report {
  constructor() {
    this.items = [];
  }
  add(item) {
    this.items.push(item);
  }
  bySeverity() {
    const order = [SEVERITY.CRITICAL, SEVERITY.HIGH, SEVERITY.MEDIUM, SEVERITY.LOW];
    const out = {};
    for (const s of order) out[s] = this.items.filter((i) => i.severity === s);
    return out;
  }
  byRule() {
    const map = new Map();
    for (const i of this.items) {
      const key = `${i.rule}|${i.severity}`;
      if (!map.has(key)) map.set(key, { ...i, count: 0, wheres: [] });
      const e = map.get(key);
      e.count++;
      if (e.wheres.length < 25) {
        e.wheres.push(i.where + (i.sample ? `  ⟵ ${i.sample}` : ""));
      }
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  }
}

// ══════════════════════════════════════════════════════════════════
// تحليل HTML بلا اعتماديات
// ══════════════════════════════════════════════════════════════════

function parseHtml(html, url) {
  const clean = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");

  const meta = {};
  for (const m of html.matchAll(/<meta\s+([^>]*?)\/?>/gi)) {
    const attrs = parseAttrs(m[1]);
    const key = attrs.name || attrs.property || attrs.itemprop;
    if (key) meta[key.toLowerCase()] = attrs.content ?? "";
  }

  const titleM = clean.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const canonicalM = html.match(/<link[^>]+rel=["']canonical["'][^>]*>/i);
  const canonical = canonicalM ? parseAttrs(canonicalM[0]).href || "" : "";

  const htmlTagM = html.match(/<html\b([^>]*)>/i);
  const htmlAttrs = htmlTagM ? parseAttrs(htmlTagM[1]) : {};

  const headings = { h1: [], h2: [], h3: [] };
  for (const level of ["h1", "h2", "h3"]) {
    for (const m of clean.matchAll(new RegExp(`<${level}[^>]*>([\\s\\S]*?)<\\/${level}>`, "gi"))) {
      headings[level].push(textOf(m[1]));
    }
  }

  const links = [];
  for (const m of clean.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const attrs = parseAttrs(m[1]);
    if (!attrs.href) continue;
    links.push({
      href: attrs.href,
      text: textOf(m[2]),
      rel: attrs.rel || "",
      target: attrs.target || "",
    });
  }

  const images = [];
  for (const m of clean.matchAll(/<img\b([^>]*?)\/?>/gi)) {
    const a = parseAttrs(m[1]);
    images.push({
      src: a.src || a["data-src"] || "",
      alt: a.alt,
      loading: a.loading,
      width: a.width,
      height: a.height,
    });
  }

  const jsonld = [];
  for (const m of html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    try {
      jsonld.push(JSON.parse(m[1].trim()));
    } catch {
      jsonld.push({ __parseError: true });
    }
  }

  const mainM = clean.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  const bodyM = clean.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  const mainHtml = mainM ? mainM[1] : bodyM ? bodyM[1] : clean;
  const mainText = textOf(mainHtml);

  const timeEls = [...clean.matchAll(/<time\b([^>]*)>/gi)].map((m) => parseAttrs(m[1]).datetime || "");

  return {
    url,
    meta,
    title: titleM ? textOf(titleM[1]) : "",
    canonical,
    htmlAttrs,
    headings,
    links,
    images,
    jsonld,
    mainText,
    timeEls,
    rawLength: html.length,
  };
}

function parseAttrs(s) {
  const out = {};
  for (const m of String(s).matchAll(
    /([a-zA-Z_:@\-.]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g,
  )) {
    out[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? "";
  }
  return out;
}

function textOf(html) {
  return String(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

// ══════════════════════════════════════════════════════════════════
// وضع الزحف
// ══════════════════════════════════════════════════════════════════

async function fetchPage(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), CONFIG.timeoutMs);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "user-agent": CONFIG.userAgent, "accept-language": "ar" },
    });
    const ct = res.headers.get("content-type") || "";
    const body =
      ct.includes("html") || ct.includes("text") || ct.includes("xml") ? await res.text() : "";
    return {
      ok: res.ok,
      status: res.status,
      finalUrl: res.url,
      body,
      contentType: ct,
      headers: Object.fromEntries(res.headers.entries()),
    };
  } catch (e) {
    return { ok: false, status: 0, finalUrl: url, body: "", error: String(e.message || e) };
  } finally {
    clearTimeout(t);
  }
}

function sameOrigin(href, baseOrigin) {
  try {
    return new URL(href, baseOrigin).origin === baseOrigin;
  } catch {
    return false;
  }
}

function normalizeUrl(href, base) {
  try {
    const u = new URL(href, base);
    u.hash = "";
    if (u.pathname.length > 1 && u.pathname.endsWith("/")) u.pathname = u.pathname.slice(0, -1);
    return u.toString();
  } catch {
    return null;
  }
}

async function crawl(opts) {
  const report = new Report();
  const base = new URL(opts.base);
  const origin = base.origin;

  console.log(`\n🔎 بدء الزحف على ${origin} (حد أقصى ${opts.maxPages} صفحة)\n`);

  await domainLevelChecks(origin, report);

  const queue = [normalizeUrl("/", origin)];
  const seen = new Set(queue);
  const pages = new Map();
  const statusOf = new Map();
  const linkGraph = [];

  while (queue.length && pages.size < opts.maxPages) {
    const batch = queue.splice(0, opts.concurrency);
    await Promise.all(
      batch.map(async (url) => {
        const res = await fetchPage(url);
        statusOf.set(url, res.status);
        process.stdout.write(`  ${String(res.status).padEnd(3)} ${url}\n`);

        if (res.status === 0) {
          report.add({
            severity: SEVERITY.CRITICAL,
            rule: "FETCH_FAIL",
            label: "تعذّر جلب الصفحة",
            where: url,
            sample: res.error,
          });
          return;
        }
        if (res.status >= 400) {
          report.add({
            severity: SEVERITY.CRITICAL,
            rule: "HTTP_ERROR",
            label: `استجابة ${res.status}`,
            where: url,
            sample: "",
          });
          return;
        }
        if (!res.contentType.includes("html")) return;

        const p = parseHtml(res.body, url);
        p.finalUrl = res.finalUrl;
        p.headers = res.headers;
        pages.set(url, p);

        for (const l of p.links) {
          if (l.href.startsWith("mailto:") || l.href.startsWith("tel:") || l.href.startsWith("#"))
            continue;
          linkGraph.push({
            from: url,
            href: l.href,
            text: l.text,
            target: l.target,
            rel: l.rel,
          });
          if (!sameOrigin(l.href, origin)) continue;
          const n = normalizeUrl(l.href, origin);
          if (n && !seen.has(n)) {
            seen.add(n);
            queue.push(n);
          }
        }
      }),
    );
    if (CONFIG.delayMs) await new Promise((r) => setTimeout(r, CONFIG.delayMs));
  }

  console.log(`\n✅ زُحف ${pages.size} صفحة. جارٍ التحليل...\n`);

  const homeText = pages.get(normalizeUrl("/", origin))?.mainText || "";
  const homeHash = hash(normalizeAr(homeText).slice(0, 4000));
  const bodyHashes = new Map();
  const descMap = new Map();
  const titleMap = new Map();
  const themeColors = new Set();

  for (const [url, p] of pages) {
    const pathName = new URL(url).pathname;
    const desc = p.meta["description"] || "";
    const isHome = pathName === "/" || pathName === "";

    const bh = hash(normalizeAr(p.mainText).slice(0, 4000));
    if (!isHome && bh === homeHash && homeText.length > 200) {
      report.add({
        severity: SEVERITY.CRITICAL,
        rule: "SOFT_404",
        label: "المسار يعيد محتوى الصفحة الرئيسية (صفحة غير موجودة تُخدَّم بـ 200)",
        where: url,
        sample: `canonical=${p.canonical}`,
      });
    }

    if (p.canonical) {
      const c = normalizeUrl(p.canonical, origin);
      if (c && c !== url && c !== normalizeUrl(p.finalUrl, origin)) {
        report.add({
          severity: SEVERITY.HIGH,
          rule: "CANONICAL_MISMATCH",
          label: "canonical يشير إلى مسار مختلف عن المسار المطلوب",
          where: url,
          sample: `→ ${p.canonical}`,
        });
      }
    } else {
      report.add({
        severity: SEVERITY.MEDIUM,
        rule: "CANONICAL_MISSING",
        label: "لا يوجد rel=canonical",
        where: url,
      });
    }

    if (p.mainText.length < CONFIG.thinTextChars) {
      report.add({
        severity: SEVERITY.HIGH,
        rule: "THIN_CONTENT",
        label: `محتوى رقيق جداً (${p.mainText.length} حرف)`,
        where: url,
      });
    }

    if (CONFIG.hubPaths.includes(pathName)) {
      const prefixes = CONFIG.hubRelatedPrefixes[pathName] || [pathName + "/"];
      const contentLinks = p.links.filter((l) => {
        const n = normalizeUrl(l.href, origin);
        if (!n || !n.startsWith(origin)) return false;
        let path;
        try {
          path = new URL(n).pathname + (new URL(n).search || "");
        } catch {
          return false;
        }
        if (path === pathName || path === pathName + "/") return false;
        return prefixes.some(
          (pre) => path === pre || path.startsWith(pre.endsWith("/") ? pre : pre + "/") || path.startsWith(pre + "?"),
        );
      });
      if (contentLinks.length < CONFIG.hubMinContentLinks) {
        report.add({
          severity: SEVERITY.CRITICAL,
          rule: "EMPTY_HUB",
          label: `صفحة محورية بلا روابط فرعية (${contentLinks.length}) — طريق مسدود`,
          where: url,
        });
      }
    }

    if (!p.title)
      report.add({
        severity: SEVERITY.HIGH,
        rule: "TITLE_MISSING",
        label: "لا يوجد <title>",
        where: url,
      });
    else if (p.title.length > 65)
      report.add({
        severity: SEVERITY.LOW,
        rule: "TITLE_LONG",
        label: `العنوان طويل (${p.title.length})`,
        where: url,
      });

    if (!desc)
      report.add({
        severity: SEVERITY.HIGH,
        rule: "DESC_MISSING",
        label: "لا يوجد meta description",
        where: url,
      });
    else if (desc.length > 165)
      report.add({
        severity: SEVERITY.LOW,
        rule: "DESC_LONG",
        label: `الوصف طويل (${desc.length} حرف) وسيُقصّ في نتائج البحث`,
        where: url,
      });
    else if (desc.length < 60)
      report.add({
        severity: SEVERITY.LOW,
        rule: "DESC_SHORT",
        label: `الوصف قصير (${desc.length} حرف)`,
        where: url,
      });

    if (desc) {
      if (!descMap.has(desc)) descMap.set(desc, []);
      descMap.get(desc).push(url);
    }
    if (p.title) {
      if (!titleMap.has(p.title)) titleMap.set(p.title, []);
      titleMap.get(p.title).push(url);
    }
    if (!bodyHashes.has(bh)) bodyHashes.set(bh, []);
    bodyHashes.get(bh).push(url);

    if (p.headings.h1.length === 0)
      report.add({ severity: SEVERITY.MEDIUM, rule: "H1_MISSING", label: "لا يوجد H1", where: url });
    if (p.headings.h1.length > 1)
      report.add({
        severity: SEVERITY.LOW,
        rule: "H1_MULTIPLE",
        label: `أكثر من H1 (${p.headings.h1.length})`,
        where: url,
      });

    if (desc && desc.length > 60) {
      const occurrences = countOccurrences(normalizeAr(p.mainText), normalizeAr(desc));
      if (occurrences >= 2) {
        report.add({
          severity: SEVERITY.MEDIUM,
          rule: "DUP_IN_PAGE",
          label: `النص التعريفي مكرر حرفياً داخل الصفحة (${occurrences} مرات)`,
          where: url,
        });
      }
    }

    if (!p.htmlAttrs.lang)
      report.add({
        severity: SEVERITY.MEDIUM,
        rule: "LANG_MISSING",
        label: "لا توجد سمة lang على <html>",
        where: url,
      });
    if ((p.htmlAttrs.dir || "").toLowerCase() !== "rtl")
      report.add({
        severity: SEVERITY.MEDIUM,
        rule: "DIR_MISSING",
        label: "سمة dir ليست rtl على <html>",
        where: url,
      });

    const noAlt = p.images.filter((i) => i.alt === undefined || i.alt === "");
    if (noAlt.length)
      report.add({
        severity: SEVERITY.MEDIUM,
        rule: "IMG_NO_ALT",
        label: `${noAlt.length} صورة بلا نص بديل`,
        where: url,
        sample: noAlt
          .slice(0, 3)
          .map((i) => i.src)
          .join(" , "),
      });
    const noDims = p.images.filter((i) => !i.width || !i.height);
    if (noDims.length)
      report.add({
        severity: SEVERITY.LOW,
        rule: "IMG_NO_DIMS",
        label: `${noDims.length} صورة بلا width/height (تسبب اهتزاز التخطيط)`,
        where: url,
      });

    const card = p.meta["twitter:card"] || "";
    const ogW = parseInt(p.meta["og:image:width"] || "0", 10);
    const ogH = parseInt(p.meta["og:image:height"] || "0", 10);
    if (
      card === "summary_large_image" &&
      ogW &&
      ogH &&
      (ogW < 1200 || ogH < 600 || Math.abs(ogW / ogH - 1.91) > 0.45)
    ) {
      report.add({
        severity: SEVERITY.MEDIUM,
        rule: "OG_IMAGE_RATIO",
        label: `twitter:card=summary_large_image يتطلب صورة ~1200×630، الموجود ${ogW}×${ogH}`,
        where: url,
      });
    }
    if (!p.meta["og:image"])
      report.add({
        severity: SEVERITY.MEDIUM,
        rule: "OG_IMAGE_MISSING",
        label: "لا توجد og:image",
        where: url,
      });
    if (!p.meta["og:image:alt"])
      report.add({
        severity: SEVERITY.LOW,
        rule: "OG_ALT_MISSING",
        label: "لا توجد og:image:alt",
        where: url,
      });

    if (p.meta["theme-color"]) themeColors.add(p.meta["theme-color"].trim().toUpperCase());

    if (p.meta["keywords"]) {
      report.add({
        severity: SEVERITY.LOW,
        rule: "META_KEYWORDS",
        label: "meta keywords مهملة منذ سنوات ولا تفيد الفهرسة — والذيل نفسه مكرر في كل صفحة",
        where: url,
      });
    }

    const flat = flattenJsonLd(p.jsonld);
    if (!flat.length) {
      report.add({
        severity: SEVERITY.HIGH,
        rule: "JSONLD_MISSING",
        label: "لا توجد بيانات منظمة JSON-LD",
        where: url,
      });
    } else {
      const bc = flat.find((o) => String(o["@type"]) === "BreadcrumbList");
      const depth = pathName.split("/").filter(Boolean).length;
      if (
        bc &&
        Array.isArray(bc.itemListElement) &&
        depth >= 2 &&
        bc.itemListElement.length < depth + 1
      ) {
        report.add({
          severity: SEVERITY.MEDIUM,
          rule: "BREADCRUMB_SHALLOW",
          label: `فتات الخبز ناقص درجة (عناصر: ${bc.itemListElement.length}، عمق المسار: ${depth})`,
          where: url,
        });
      }
      if (!bc && depth >= 2) {
        report.add({
          severity: SEVERITY.MEDIUM,
          rule: "BREADCRUMB_MISSING",
          label: "لا يوجد BreadcrumbList لصفحة داخلية",
          where: url,
        });
      }
      if (flat.some((o) => o.__parseError)) {
        report.add({
          severity: SEVERITY.HIGH,
          rule: "JSONLD_INVALID",
          label: "JSON-LD غير صالح",
          where: url,
        });
      }
    }

    const hasDate =
      p.timeEls.some(Boolean) ||
      flat.some((o) => o.datePublished || o.dateModified) ||
      /آخر تحديث|تاريخ النشر|نُشر في/.test(p.mainText);
    if (!isHome && p.mainText.length > CONFIG.thinTextChars && !hasDate) {
      report.add({
        severity: SEVERITY.MEDIUM,
        rule: "NO_DATE",
        label: "لا تاريخ نشر ولا تاريخ تحديث على صفحة محتوى",
        where: url,
      });
    }
    const author = p.meta["author"] || "";
    if (
      !isHome &&
      author &&
      normalizeAr(author) === normalizeAr("سُنّة") &&
      p.mainText.length > CONFIG.thinTextChars
    ) {
      report.add({
        severity: SEVERITY.MEDIUM,
        rule: "GENERIC_AUTHOR",
        label: "لا يوجد مؤلف أو مراجع علمي مُسمّى (author عام) — مهم للمحتوى الشرعي",
        where: url,
      });
    }

    if (
      CONFIG.evidenceRequiredPrefixes.some((pre) => pathName.startsWith(pre)) &&
      pathName.split("/").filter(Boolean).length >= 2
    ) {
      const hasEvidence =
        /رواه|أخرجه|متفق عليه|صحيح البخاري|صحيح مسلم|سورة\s|الآية|\[\d+:\d+\]|تخريج|المصدر|صححه|حسّنه|حسنه/.test(
          p.mainText,
        );
      if (!hasEvidence) {
        report.add({
          severity: SEVERITY.HIGH,
          rule: "NO_EVIDENCE",
          label: "صفحة في قسم شرعي بلا أي دليل أو تخريج أو مصدر",
          where: url,
        });
      }
    }

    runTextRules(p.mainText, url, report);
    runTextRules(p.title, url + " «title»", report);
    runTextRules(desc, url + " «description»", report);

    checkHijriOrder(p, url, report);

    for (const l of p.links) {
      if (
        !sameOrigin(l.href, origin) &&
        /^https?:/i.test(l.href) &&
        l.target === "_blank" &&
        !/noopener/.test(l.rel)
      ) {
        report.add({
          severity: SEVERITY.LOW,
          rule: "TARGET_BLANK_NO_NOOPENER",
          label: 'رابط خارجي بـ target=_blank بلا rel="noopener"',
          where: url,
          sample: l.href,
        });
      }
    }
  }

  for (const [d, urls] of descMap) {
    if (urls.length > 1)
      report.add({
        severity: SEVERITY.MEDIUM,
        rule: "DESC_DUPLICATE",
        label: `وصف مكرر على ${urls.length} صفحات`,
        where: urls.slice(0, 6).join(" , "),
        sample: d.slice(0, 60),
      });
  }
  for (const [t, urls] of titleMap) {
    if (urls.length > 1)
      report.add({
        severity: SEVERITY.MEDIUM,
        rule: "TITLE_DUPLICATE",
        label: `عنوان مكرر على ${urls.length} صفحات`,
        where: urls.slice(0, 6).join(" , "),
        sample: t.slice(0, 60),
      });
  }
  for (const [, urls] of bodyHashes) {
    if (urls.length > 1)
      report.add({
        severity: SEVERITY.HIGH,
        rule: "BODY_DUPLICATE",
        label: `محتوى متطابق على ${urls.length} مسارات`,
        where: urls.slice(0, 6).join(" , "),
      });
  }

  if (themeColors.size > 1) {
    report.add({
      severity: SEVERITY.LOW,
      rule: "THEME_COLOR_INCONSISTENT",
      label: "قيم theme-color مختلفة بين الصفحات",
      where: "(الموقع)",
      sample: [...themeColors].join(" , "),
    });
  }

  const externalToCheck = new Set();
  for (const l of linkGraph) {
    const n = normalizeUrl(l.href, origin);
    if (!n) continue;
    if (sameOrigin(l.href, origin)) {
      const st = statusOf.get(n);
      if (st !== undefined && (st === 0 || st >= 400)) {
        report.add({
          severity: SEVERITY.CRITICAL,
          rule: "BROKEN_INTERNAL_LINK",
          label: `رابط داخلي مكسور (${st})`,
          where: `${l.from} → ${n}`,
          sample: l.text,
        });
      }
      const target = pages.get(n);
      if (target && l.text && tokens(l.text).length >= 2) {
        const targetTitle = (target.headings.h1[0] || target.title || "").replace(
          /\s*[|—–-]\s*سُنّة\s*$/u,
          "",
        );
        // تجاهل الحالات الآمنة: عنوان الوجهة جزء من نص الرابط (مثل «المغني لابن قدامة»→«المغني»)
        // أو العكس، أو تداخل كافٍ بأي اتجاه.
        if (targetTitle) {
          const a = normalizeAr(l.text);
          const b = normalizeAr(targetTitle);
          const contained = (a.includes(b) || b.includes(a)) && Math.min(a.length, b.length) >= 3;
          const score = Math.max(overlapRatio(l.text, targetTitle), overlapRatio(targetTitle, l.text));
          if (!contained && score < 0.4) {
            report.add({
              severity: SEVERITY.CRITICAL,
              rule: "LINK_TEXT_MISMATCH",
              label: "نص الرابط لا يطابق عنوان الصفحة الوجهة (احتمال ربط خاطئ)",
              where: `${l.from} → ${n}`,
              sample: `«${l.text}» ⟵ الوجهة: «${targetTitle}»`,
            });
          }
        }
      }
    } else if (/^https?:/i.test(l.href)) {
      externalToCheck.add(l.href.split("#")[0]);
    }
  }

  const ext = [...externalToCheck].slice(0, 60);
  if (ext.length) {
    console.log(`🔗 فحص ${ext.length} رابطاً خارجياً...`);
    for (let i = 0; i < ext.length; i += 5) {
      await Promise.all(
        ext.slice(i, i + 5).map(async (u) => {
          const r = await fetchPage(u);
          if (r.status === 0 || r.status >= 400) {
            report.add({
              severity: SEVERITY.HIGH,
              rule: "BROKEN_EXTERNAL_LINK",
              label: `رابط خارجي معطّل (${r.status})`,
              where: u,
            });
          }
        }),
      );
    }
  }

  await sitemapDiff(origin, pages, report);

  return { report, pages, statusOf };
}

function countOccurrences(hay, needle) {
  if (!needle || needle.length < 20) return 0;
  let c = 0,
    i = 0;
  while ((i = hay.indexOf(needle, i)) !== -1) {
    c++;
    i += needle.length;
  }
  return c;
}

function flattenJsonLd(arr) {
  const out = [];
  const walk = (o) => {
    if (Array.isArray(o)) return o.forEach(walk);
    if (o && typeof o === "object") {
      out.push(o);
      if (o["@graph"]) walk(o["@graph"]);
    }
  };
  arr.forEach(walk);
  return out;
}

function checkHijriOrder(p, url, report) {
  const years = [...p.mainText.matchAll(/([\u0660-\u06690-9]{2,4})\s*هـ/g)]
    .map((m) => parseInt(arabicToWesternDigits(m[1]), 10))
    .filter((n) => n > 0 && n < 1500);
  if (years.length < 5) return;
  let inversions = 0;
  for (let i = 1; i < years.length; i++) if (years[i] < years[i - 1]) inversions++;
  if (inversions > years.length * 0.2) {
    report.add({
      severity: SEVERITY.MEDIUM,
      rule: "HIJRI_ORDER",
      label: `قائمة سنوات غير مرتّبة زمنياً (${inversions} انعكاساً من ${years.length})`,
      where: url,
      sample: years.slice(0, 12).join(" → "),
    });
  }
}

async function domainLevelChecks(origin, report) {
  const robots = await fetchPage(origin + "/robots.txt");
  if (robots.status !== 200) {
    report.add({
      severity: SEVERITY.HIGH,
      rule: "ROBOTS_MISSING",
      label: `robots.txt غير متاح (${robots.status})`,
      where: origin + "/robots.txt",
    });
  } else {
    if (!/sitemap:/i.test(robots.body)) {
      report.add({
        severity: SEVERITY.MEDIUM,
        rule: "ROBOTS_NO_SITEMAP",
        label: "robots.txt لا يشير إلى خريطة الموقع",
        where: origin + "/robots.txt",
      });
    }
    if (/^\s*Disallow:\s*\/\s*$/im.test(robots.body)) {
      report.add({
        severity: SEVERITY.CRITICAL,
        rule: "ROBOTS_BLOCKS_ALL",
        label: "robots.txt يمنع فهرسة الموقع كله!",
        where: origin + "/robots.txt",
      });
    }
  }

  const sm = await fetchPage(origin + "/sitemap.xml");
  if (sm.status !== 200) {
    report.add({
      severity: SEVERITY.HIGH,
      rule: "SITEMAP_MISSING",
      label: `sitemap.xml غير متاح (${sm.status})`,
      where: origin + "/sitemap.xml",
    });
  }

  // ازدواج النطاق فقط إذا بقيت نسختا www وبدون-www على مضيفهما دون تحويل متبادل.
  const apexOrigin = origin.replace("://www.", "://");
  const wwwOrigin = apexOrigin.replace("://", "://www.");
  const [apexRes, wwwRes] = await Promise.all([
    fetchPage(apexOrigin + "/"),
    fetchPage(wwwOrigin + "/"),
  ]);
  const hostOf = (res) => {
    try {
      return new URL(res.finalUrl || "").host;
    } catch {
      return "";
    }
  };
  const apexStays =
    apexRes.status === 200 && hostOf(apexRes) === new URL(apexOrigin).host;
  const wwwStays =
    wwwRes.status === 200 && hostOf(wwwRes) === new URL(wwwOrigin).host;
  if (apexStays && wwwStays) {
    report.add({
      severity: SEVERITY.HIGH,
      rule: "WWW_NO_REDIRECT",
      label: "النسخة البديلة (www / بدون www) تُخدَّم بـ 200 بلا تحويل 301 — ازدواج نطاق",
      where: `${apexOrigin} و ${wwwOrigin}`,
    });
  }

  const home = await fetchPage(origin + "/");
  const h = home.headers || {};
  const wanted = {
    "strict-transport-security": SEVERITY.MEDIUM,
    "x-content-type-options": SEVERITY.LOW,
    "referrer-policy": SEVERITY.LOW,
    "content-security-policy": SEVERITY.LOW,
  };
  for (const [k, sev] of Object.entries(wanted)) {
    if (!h[k])
      report.add({
        severity: sev,
        rule: "HEADER_MISSING",
        label: `ترويسة أمان غائبة: ${k}`,
        where: origin,
      });
  }
}

async function sitemapDiff(origin, pages, report) {
  const sm = await fetchPage(origin + "/sitemap.xml");
  if (sm.status !== 200 || !sm.body) return;
  const locs = [...sm.body.matchAll(/<loc>([^<]+)<\/loc>/gi)].map((m) => m[1].trim());
  const isIndex = /<sitemapindex/i.test(sm.body);
  let urls = locs;
  if (isIndex) {
    urls = [];
    for (const child of locs.slice(0, 20)) {
      const c = await fetchPage(child);
      if (c.status === 200)
        urls.push(...[...c.body.matchAll(/<loc>([^<]+)<\/loc>/gi)].map((m) => m[1].trim()));
    }
  }
  const smSet = new Set(urls.map((u) => normalizeUrl(u, origin)).filter(Boolean));
  const crawled = new Set([...pages.keys()]);

  const orphaned = [...smSet].filter((u) => !crawled.has(u));
  const unlisted = [...crawled].filter((u) => !smSet.has(u));

  if (orphaned.length)
    report.add({
      severity: SEVERITY.MEDIUM,
      rule: "SITEMAP_ORPHAN",
      label: `${orphaned.length} رابطاً في خريطة الموقع لا يمكن الوصول إليه بالتصفح (صفحات يتيمة)`,
      where: "(sitemap)",
      sample: orphaned.slice(0, 8).join(" , "),
    });

  if (unlisted.length)
    report.add({
      severity: SEVERITY.MEDIUM,
      rule: "SITEMAP_UNLISTED",
      label: `${unlisted.length} صفحة مزحوفة غير مدرجة في خريطة الموقع`,
      where: "(sitemap)",
      sample: unlisted.slice(0, 8).join(" , "),
    });
}

// ══════════════════════════════════════════════════════════════════
// وضع فحص الملفات المحلية
// ══════════════════════════════════════════════════════════════════

async function lint(dir, exts) {
  const report = new Report();
  const files = await walkDir(dir, exts);
  console.log(`\n🔎 فحص ${files.length} ملفاً في ${dir}\n`);

  const seenText = new Map();
  const slugs = new Map();

  for (const file of files) {
    const raw = await fs.readFile(file, "utf8");
    const rel = path.relative(process.cwd(), file);
    const ext = path.extname(file).toLowerCase();

    if (ext === ".json" || ext === ".jsonl") {
      const records = [];
      if (ext === ".jsonl") {
        raw.split("\n").forEach((line, i) => {
          if (!line.trim()) return;
          try {
            records.push([`${rel}:${i + 1}`, JSON.parse(line)]);
          } catch {
            report.add({
              severity: SEVERITY.CRITICAL,
              rule: "JSON_INVALID",
              label: "سطر JSONL غير صالح",
              where: `${rel}:${i + 1}`,
            });
          }
        });
      } else {
        try {
          records.push([rel, JSON.parse(raw)]);
        } catch (e) {
          report.add({
            severity: SEVERITY.CRITICAL,
            rule: "JSON_INVALID",
            label: "ملف JSON غير صالح",
            where: rel,
            sample: e.message,
          });
          continue;
        }
      }
      for (const [where, rec] of records) walkRecord(rec, where, report, seenText, slugs);
    } else {
      runTextRules(raw, rel, report);
      const m = raw.match(/^---\n([\s\S]*?)\n---/);
      if (!m)
        report.add({
          severity: SEVERITY.LOW,
          rule: "NO_FRONTMATTER",
          label: "ملف محتوى بلا frontmatter",
          where: rel,
        });
    }
  }

  for (const [text, wheres] of seenText) {
    if (wheres.length > 1 && text.length > 80) {
      report.add({
        severity: SEVERITY.MEDIUM,
        rule: "DUP_TEXT_ACROSS_RECORDS",
        label: `نص مكرر حرفياً في ${wheres.length} مواضع`,
        where: wheres.slice(0, 5).join(" , "),
        sample: text.slice(0, 60),
      });
    }
  }
  for (const [slug, wheres] of slugs) {
    if (wheres.length > 1) {
      report.add({
        severity: SEVERITY.CRITICAL,
        rule: "SLUG_DUPLICATE",
        label: `المعرّف (slug) «${slug}» مكرر`,
        where: wheres.join(" , "),
      });
    }
  }

  return { report };
}

function walkRecord(node, where, report, seenText, slugs, keyPath = "") {
  if (Array.isArray(node)) {
    node.forEach((v, i) => walkRecord(v, where, report, seenText, slugs, `${keyPath}[${i}]`));
    return;
  }
  if (!node || typeof node !== "object") return;

  const isTopRecord = keyPath === "" || /^\[\d+\]$/.test(keyPath);

  const id = node.slug || node.id;
  if (id && typeof id === "string" && isTopRecord) {
    if (!slugs.has(id)) slugs.set(id, []);
    slugs.get(id).push(`${where}${keyPath}`);
  }

  const desc = node.description || node.summary;
  const body = node.body || node.content || node.text;
  if (
    desc &&
    body &&
    typeof desc === "string" &&
    typeof body === "string" &&
    desc.length > 60 &&
    normalizeAr(body).includes(normalizeAr(desc))
  ) {
    report.add({
      severity: SEVERITY.MEDIUM,
      rule: "DUP_DESC_IN_BODY",
      label: "الوصف مكرر حرفياً داخل النص",
      where: `${where}${keyPath}`,
    });
  }

  if ((node.title || node.name) && isTopRecord) {
    for (const req of ["slug", "description"]) {
      if (!node[req]) {
        report.add({
          severity: SEVERITY.MEDIUM,
          rule: "FIELD_MISSING",
          label: `حقل ناقص: ${req}`,
          where: `${where}${keyPath} «${node.title || node.name}»`,
        });
      }
    }
  }

  for (const [k, v] of Object.entries(node)) {
    const kp = keyPath ? `${keyPath}.${k}` : `.${k}`;
    if (typeof v === "string") {
      if (CONFIG.lintTextKeys.includes(k)) {
        runTextRules(v, `${where}${kp}`, report);
        const n = normalizeAr(v);
        if (n.length > 80) {
          if (!seenText.has(n)) seenText.set(n, []);
          seenText.get(n).push(`${where}${kp}`);
        }
        if (!v.trim())
          report.add({
            severity: SEVERITY.HIGH,
            rule: "EMPTY_FIELD",
            label: `حقل نصي فارغ: ${k}`,
            where: `${where}${kp}`,
          });
      }
    } else if (typeof v === "object" && v !== null) {
      walkRecord(v, where, report, seenText, slugs, kp);
    }
  }
}

async function walkDir(dir, exts) {
  const out = [];
  const skip = new Set(["node_modules", ".git", ".next", "dist", "build", ".cache", "coverage"]);
  async function rec(d) {
    let entries;
    try {
      entries = await fs.readdir(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (skip.has(e.name)) continue;
      const full = path.join(d, e.name);
      if (e.isDirectory()) await rec(full);
      else if (exts.includes(path.extname(e.name).toLowerCase())) out.push(full);
    }
  }
  await rec(dir);
  return out;
}

// ══════════════════════════════════════════════════════════════════
// إخراج التقرير
// ══════════════════════════════════════════════════════════════════

const SEV_ICON = {
  [SEVERITY.CRITICAL]: "🔴",
  [SEVERITY.HIGH]: "🟠",
  [SEVERITY.MEDIUM]: "🟡",
  [SEVERITY.LOW]: "⚪",
};

async function emit(report, meta, outDir) {
  const bySev = report.bySeverity();
  const byRule = report.byRule();

  console.log("\n" + "═".repeat(64));
  console.log("  ملخّص الفحص");
  console.log("═".repeat(64));
  for (const [sev, items] of Object.entries(bySev)) {
    console.log(`  ${SEV_ICON[sev]}  ${sev.padEnd(8)} ${items.length}`);
  }
  console.log(`  المجموع: ${report.items.length} ملاحظة\n`);

  console.log("  أهم الملاحظات:");
  for (const r of byRule.slice(0, 15)) {
    console.log(`  ${SEV_ICON[r.severity]} [${r.count.toString().padStart(3)}] ${r.rule} — ${r.label}`);
  }

  let md = `# تقرير فحص ${meta.target}\n\n`;
  md += `التاريخ: ${new Date().toISOString().slice(0, 16).replace("T", " ")}  \n`;
  md += `النطاق: ${meta.scope}\n\n`;
  md += `| الخطورة | العدد |\n|---|---|\n`;
  for (const [sev, items] of Object.entries(bySev))
    md += `| ${SEV_ICON[sev]} ${sev} | ${items.length} |\n`;
  md += `| **المجموع** | **${report.items.length}** |\n\n`;

  for (const [sev, items] of Object.entries(bySev)) {
    if (!items.length) continue;
    md += `\n## ${SEV_ICON[sev]} ${sev} (${items.length})\n`;
    const grouped = new Map();
    for (const i of items) {
      if (!grouped.has(i.rule)) grouped.set(i.rule, { label: i.label, rows: [] });
      grouped.get(i.rule).rows.push(i);
    }
    for (const [rule, g] of [...grouped].sort((a, b) => b[1].rows.length - a[1].rows.length)) {
      md += `\n### \`${rule}\` — ${g.label}  _(${g.rows.length})_\n\n`;
      for (const r of g.rows.slice(0, 40)) {
        md += `- \`${r.where}\`${r.sample ? `  \n  ⟵ ${r.sample}` : ""}\n`;
      }
      if (g.rows.length > 40)
        md += `- … و${g.rows.length - 40} أخرى (انظر majlisilm-audit-report.json)\n`;
    }
  }

  await fs.mkdir(outDir, { recursive: true });
  const mdPath = path.join(outDir, "majlisilm-audit-report.md");
  const jsonPath = path.join(outDir, "majlisilm-audit-report.json");
  await fs.writeFile(mdPath, md, "utf8");
  await fs.writeFile(jsonPath, JSON.stringify({ meta, items: report.items }, null, 2), "utf8");
  console.log(`\n📄 كُتب التقرير: ${mdPath}  و  ${jsonPath}\n`);

  const critical = bySev[SEVERITY.CRITICAL].length + bySev[SEVERITY.HIGH].length;
  return critical > 0 ? 1 : 0;
}

// ══════════════════════════════════════════════════════════════════
// نقطة الدخول
// ══════════════════════════════════════════════════════════════════

function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
}

async function main() {
  const cmd = process.argv[2];
  const outDir = path.resolve(arg("out-dir", path.join(PACKAGE_ROOT, "reports")));

  if (cmd === "crawl") {
    const base = arg("base", CONFIG.base);
    const maxPages = parseInt(arg("max", CONFIG.maxPages), 10);
    const concurrency = parseInt(arg("concurrency", CONFIG.concurrency), 10);
    const { report, pages } = await crawl({ base, maxPages, concurrency });
    const code = await emit(report, { target: base, scope: `${pages.size} صفحة مزحوفة` }, outDir);
    process.exit(code);
  }

  if (cmd === "lint") {
    const dir = process.argv[3] || ".";
    const exts = arg("ext", ".json,.jsonl,.md,.mdx,.yaml,.yml")
      .split(",")
      .map((s) => s.trim());
    const { report } = await lint(dir, exts);
    const code = await emit(
      report,
      { target: dir, scope: `امتدادات: ${exts.join(" ")}` },
      outDir,
    );
    process.exit(code);
  }

  console.log(`
فاحص سُنّة

  node scripts/majlisilm-audit.mjs crawl [--base URL] [--max N] [--concurrency N] [--out-dir DIR]
  node scripts/majlisilm-audit.mjs lint <مجلد> [--ext .json,.jsonl,.mdx] [--out-dir DIR]

أمثلة:
  pnpm --filter @workspace/majalis run audit:site
  pnpm --filter @workspace/majalis run audit:site -- --max 80
  pnpm --filter @workspace/majalis run audit:content
  node scripts/majlisilm-audit.mjs crawl --base http://127.0.0.1:24216 --max 50
`);
  process.exit(2);
}

const invokedDirectly =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  main().catch((e) => {
    console.error("خطأ:", e);
    process.exit(3);
  });
}

export {
  parseHtml,
  overlapRatio,
  normalizeAr,
  tokens,
  runTextRules,
  Report,
  TEXT_RULES,
  checkHijriOrder,
  CONFIG,
  SEVERITY,
};
