/**
 * Extended corpus search — Quran, tafsir, hadith, mutoon, circles, research, sheikhs, mosques.
 * Only returns published/verified content — no placeholders in public results.
 */

import { processQuery, normalizeArabic } from "./query-processor.mjs";
import { enrichResult } from "./url-resolver.mjs";
import { ARBAEEN_INDEX } from "./corpus-arbaeen.mjs";

const SURAH_NAMES = [
  "الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام", "الأعراف", "الأنفال", "التوبة", "يونس",
  "هود", "يوسف", "الرعد", "إبراهيم", "الحجر", "النحل", "الإسراء", "الكهف", "مريم", "طه",
  "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان", "الشعراء", "النمل", "القصص", "العنكبوت", "الروم",
  "لقمان", "السجدة", "الأحزاب", "سبأ", "فاطر", "يس", "الصافات", "ص", "الزمر", "غافر",
  "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية", "الأحقاف", "محمد", "الفتح", "الحجرات", "ق",
  "الذاريات", "الطور", "النجم", "القمر", "الرحمن", "الواقعة", "الحديد", "المجادلة", "الحشر", "الممتحنة",
  "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق", "التحريم", "الملك", "القلم", "الحاقة", "المعارج",
  "نوح", "الجن", "المزمل", "المدثر", "القيامة", "الإنسان", "المرسلات", "النبأ", "النازعات", "عبس",
  "التكوير", "الانفطار", "المطففين", "الانشقاق", "البروج", "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد",
  "الشمس", "الليل", "الضحى", "الشرح", "التين", "العلق", "القدر", "البينة", "الزلزلة", "العاديات",
  "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل", "قريش", "الماعون", "الكوثر", "الكافرون", "النصر",
  "المسد", "الإخلاص", "الفلق", "الناس",
];

const MUTOON_INDEX = [
  { slug: "nawawi40", title: "الأربعون النووية", href: "/arbaeen-nawawi" },
  { slug: "usool-thalatha", title: "الأصول الثلاثة", href: "/learning/paths" },
  { slug: "qawaed-arba", title: "القواعد الأربع", href: "/learning/paths" },
  { slug: "ajrummiya", title: "الآجرومية", href: "/learning/paths" },
  { slug: "warqaat", title: "الورقات", href: "/learning/paths" },
  { slug: "bayquniya", title: "البيقونية", href: "/learning/paths" },
  { slug: "jazariya", title: "الجزرية", href: "/quran/tajweed" },
  { slug: "tuhfat-atfal", title: "تحفة الأطفال", href: "/quran/tajweed" },
  { slug: "bulugh-maram", title: "بلوغ المرام", href: "/learning/paths" },
  { slug: "umdat-ahkam", title: "عمدة الأحكام", href: "/learning/paths" },
];

const PUBLIC_CIRCLE_STATUSES = ["published", "registration_open", "registration_closed", "ongoing"];

function fuzzyMatch(text, queryInfo) {
  const normalized = normalizeArabic(text);
  if (!normalized) return false;
  for (const term of queryInfo.expandedTerms) {
    const t = normalizeArabic(term);
    if (!t) continue;
    if (normalized.includes(t)) return true;
    if (t.length >= 3 && normalized.includes(t.slice(0, Math.max(3, t.length - 1)))) return true;
  }
  return false;
}

function searchSurahs(queryInfo, limit) {
  return SURAH_NAMES.map((name, i) => ({ number: i + 1, name }))
    .filter((s) => fuzzyMatch(`${s.name} ${s.number}`, queryInfo))
    .slice(0, limit)
    .map((s) =>
      enrichResult({
        id: `surah-${s.number}`,
        kind: "quran",
        title: `سورة ${s.name}`,
        summary: `السورة ${s.number} من القرآن الكريم`,
        href: `/quran?surah=${s.number}`,
        rank: 7,
      }),
    );
}

function searchTafsir(queryInfo, limit) {
  return SURAH_NAMES.map((name, i) => ({ number: i + 1, name }))
    .filter((s) => fuzzyMatch(`تفسير ${s.name}`, queryInfo))
    .slice(0, limit)
    .map((s) =>
      enrichResult({
        id: `tafsir-${s.number}`,
        kind: "tafsir",
        title: `تفسير سورة ${s.name}`,
        summary: "التفسير والمعاني",
        href: `/quran/tafsir?surah=${s.number}`,
        rank: 6,
      }),
    );
}

function searchHadith(queryInfo, limit) {
  return ARBAEEN_INDEX.filter((h) => fuzzyMatch(`${h.title} ${h.source}`, queryInfo))
    .slice(0, limit)
    .map((h) =>
      enrichResult({
        id: `hadith-${h.id}`,
        kind: "hadith",
        title: h.title,
        summary: h.source,
        href: "/arbaeen-nawawi",
        rank: 7,
      }),
    );
}

function searchMutoon(queryInfo, limit) {
  return MUTOON_INDEX.filter((m) => fuzzyMatch(m.title, queryInfo))
    .slice(0, limit)
    .map((m) =>
      enrichResult({
        id: m.slug,
        kind: "mutoon",
        title: m.title,
        summary: "متن علمي",
        href: m.href,
        rank: 5,
      }),
    );
}

async function searchSheikhs(admin, queryInfo, limit) {
  if (!admin) return [];
  const { data } = await admin
    .from("sheikhs")
    .select("id, name, bio, specialties, external_key, photo_url, is_verified")
    .eq("is_verified", true)
    .limit(limit * 3);
  return (data || [])
    .filter((s) => fuzzyMatch([s.name, s.bio, ...(s.specialties || [])].join(" "), queryInfo))
    .slice(0, limit)
    .map((s) =>
      enrichResult({
        id: s.id,
        kind: "sheikh",
        title: s.name,
        summary: s.bio?.slice(0, 120),
        href: `/lessons?sheikh=${encodeURIComponent(s.name)}`,
        verification_status: s.is_verified ? "verified" : undefined,
        rank: 6,
      }),
    );
}

async function searchMosques(admin, queryInfo, limit) {
  if (!admin) return [];
  const { data } = await admin
    .from("mosques")
    .select("id, name, region, governorate, imam_name, google_maps_url, external_key")
    .limit(limit * 3);
  return (data || [])
    .filter((m) => fuzzyMatch([m.name, m.region, m.governorate, m.imam_name].join(" "), queryInfo))
    .slice(0, limit)
    .map((m) =>
      enrichResult({
        id: m.id,
        kind: "mosque",
        title: m.name,
        summary: [m.region, m.governorate, m.imam_name && `الإمام: ${m.imam_name}`].filter(Boolean).join(" · "),
        href: m.google_maps_url || `/lessons?mosque=${encodeURIComponent(m.name)}`,
        rank: 5,
      }),
    );
}

async function searchCircles(admin, queryInfo, limit) {
  if (!admin) return [];
  const { data } = await admin
    .from("quran_scientific_circles")
    .select("id, title, summary, sheikh_name, country, circle_type, status, external_key")
    .in("status", PUBLIC_CIRCLE_STATUSES)
    .limit(limit * 3);
  return (data || [])
    .filter((c) => fuzzyMatch([c.title, c.summary, c.sheikh_name, c.circle_type, c.country].join(" "), queryInfo))
    .slice(0, limit)
    .map((c) =>
      enrichResult({
        id: c.id,
        kind: "circle",
        title: c.title,
        summary: [c.circle_type, c.sheikh_name, c.country].filter(Boolean).join(" · "),
        href: `/quran-scientific-circles/${c.external_key || c.id}`,
        rank: 6,
      }),
    );
}

async function searchResearch(admin, queryInfo, limit) {
  if (!admin) return [];
  const { data } = await admin
    .from("fiqh_council_items")
    .select("id, title, summary, slug, category, status")
    .eq("status", "published")
    .limit(limit * 3);
  return (data || [])
    .filter((r) => fuzzyMatch([r.title, r.summary, r.category].join(" "), queryInfo))
    .slice(0, limit)
    .map((r) =>
      enrichResult({
        id: r.id,
        kind: "research",
        title: r.title,
        summary: r.summary?.slice(0, 160) || r.category,
        href: `/fiqh-council/${r.slug || r.id}`,
        verification_status: "verified",
        rank: 7,
      }),
    );
}

async function searchLearningPaths(admin, queryInfo, limit) {
  if (!admin) return [];
  const { data } = await admin
    .from("learning_paths")
    .select("id, slug, title, summary, category, level")
    .eq("status", "published")
    .limit(limit * 3);
  return (data || [])
    .filter((p) => fuzzyMatch([p.title, p.summary, p.category, p.level].join(" "), queryInfo))
    .slice(0, limit)
    .map((p) =>
      enrichResult({
        id: p.id,
        kind: "learning_path",
        title: p.title,
        summary: [p.category, p.level].filter(Boolean).join(" · "),
        href: `/learning/paths/${p.slug}`,
        rank: 5,
      }),
    );
}

async function searchSinJeem(admin, queryInfo, limit) {
  if (!admin) return [];
  try {
    const { data } = await admin
      .from("sin_jeem_questions")
      .select("id, question_text, category, difficulty")
      .eq("status", "approved")
      .limit(limit * 3);
    return (data || [])
      .filter((q) => fuzzyMatch([q.question_text, q.category].join(" "), queryInfo))
      .slice(0, limit)
      .map((q) =>
        enrichResult({
          id: q.id,
          kind: "sin_jeem",
          title: q.question_text?.slice(0, 100),
          summary: "سؤال وجواب — لعبة المعلومات",
          href: "/question-answer",
          rank: 4,
        }),
      );
  } catch {
    return [];
  }
}

export async function searchExtendedCorpus(admin, query, limit = 12) {
  const trimmed = String(query || "").trim();
  if (!trimmed) return [];

  const queryInfo = processQuery(trimmed);

  const perKind = Math.ceil(limit / 4);

  const [surahs, tafsir, hadith, mutoon, sheikhs, mosques, circles, research, paths, sinJeem] =
    await Promise.all([
      Promise.resolve(searchSurahs(queryInfo, perKind)),
      Promise.resolve(searchTafsir(queryInfo, perKind)),
      Promise.resolve(searchHadith(queryInfo, perKind)),
      Promise.resolve(searchMutoon(queryInfo, perKind)),
      searchSheikhs(admin, queryInfo, perKind),
      searchMosques(admin, queryInfo, perKind),
      searchCircles(admin, queryInfo, perKind),
      searchResearch(admin, queryInfo, perKind),
      searchLearningPaths(admin, queryInfo, perKind),
      searchSinJeem(admin, queryInfo, perKind),
    ]);

  return [...surahs, ...tafsir, ...hadith, ...mutoon, ...sheikhs, ...mosques, ...circles, ...research, ...paths, ...sinJeem].slice(
    0,
    limit * 2,
  );
}

export async function buildAutocompleteSuggestions(admin, query, limit = 10) {
  const trimmed = String(query || "").trim();
  if (trimmed.length < 2) return [];

  const queryInfo = processQuery(trimmed);

  const suggestions = [];

  for (const name of SURAH_NAMES) {
    if (fuzzyMatch(name, queryInfo)) {
      suggestions.push({
        id: `surah-${name}`,
        label: `سورة ${name}`,
        meta: "قرآن",
        kind: "quran",
        href: `/quran?surah=${SURAH_NAMES.indexOf(name) + 1}`,
      });
    }
    if (suggestions.length >= limit) break;
  }

  if (suggestions.length < limit) {
    for (const h of ARBAEEN_INDEX) {
      if (fuzzyMatch(h.title, queryInfo)) {
        suggestions.push({
          id: `hadith-${h.id}`,
          label: h.title,
          meta: "حديث",
          kind: "hadith",
          href: "/arbaeen-nawawi",
        });
      }
      if (suggestions.length >= limit) break;
    }
  }

  if (admin && suggestions.length < limit) {
    const { data: lessons } = await admin
      .from("lessons")
      .select("id, title, external_key")
      .eq("status", "approved")
      .ilike("title", `%${trimmed.slice(0, 40)}%`)
      .limit(5);
    for (const l of lessons || []) {
      suggestions.push({
        id: l.id,
        label: l.title,
        meta: "درس",
        kind: "lesson",
        href: `/lessons/${l.external_key || l.id}`,
      });
      if (suggestions.length >= limit) break;
    }
  }

  return suggestions.slice(0, limit);
}
