/**
 * بذرة حسابات حصاد المصادر — تُدمَج مع kuwait-instagram-sources ثم تُكتب accounts.json
 */
import { KUWAIT_INSTAGRAM_SOURCES } from "../../lib/cms/kuwait-instagram-sources.mjs";

/** @returns {import('./types.mjs').SourceAccount[]} */
function legacyKuwaitAccounts() {
  return KUWAIT_INSTAGRAM_SOURCES.map((s) => ({
    id: `ig-${s.config.handle}`,
    platform: "instagram",
    handle: s.config.handle,
    url: s.url,
    name_ar: s.name,
    kind: s.category === "دورات" ? "أكاديمية" : "مسجد",
    topics: s.category === "دورات" ? ["دورات", "فقه"] : ["دروس", "فقه"],
    audience: s.config.handle.includes("women") ? "نساء" : "عام",
    region_ar: s.country || "الكويت",
    site: s.config.website_url,
    contact: undefined,
    enabled: s.active !== false,
    poll_priority: "high",
    last_seen_at: null,
  }));
}

const NEW_ACCOUNTS = [
  { platform: "instagram", handle: "nebraas_kw", name_ar: "مركز نبراس للسنة النبوية", kind: "مركز", topics: ["سنة", "سيرة"] },
  { platform: "instagram", handle: "w_alanbiya", name_ar: "أكاديمية ورثة الأنبياء", kind: "أكاديمية", topics: ["دورات", "سيرة"] },
  { platform: "instagram", handle: "7offath", name_ar: "حُفّاظ — الجمعية الخيرية الكويتية", kind: "جمعية", site: "https://hoffath.org", topics: ["حلقات", "قرآن"] },
  { platform: "instagram", handle: "tartelkw", name_ar: "جمعية ترتيل", kind: "جمعية", audience: "نساء", topics: ["حلقات", "قرآن"] },
  { platform: "instagram", handle: "alholah_kw", name_ar: "حلقات الخلة لتحفيظ القرآن الكريم", kind: "حلقات", topics: ["حلقات", "قرآن"] },
  { platform: "instagram", handle: "masjid_mubark_alsaifi", name_ar: "مسجد مبارك الصيفي ووالديه", kind: "مسجد", topics: ["دروس"] },
  { platform: "instagram", handle: "alwa7yyen", name_ar: "جمعية الوحيين — مركز الدرر", kind: "جمعية", topics: ["قرآن", "حديث"] },
  { platform: "instagram", handle: "saad.al.abdullah.city", name_ar: "مركز سعد العبدالله لتحفيظ القرآن", kind: "مركز", topics: ["حلقات", "قرآن"] },
  { platform: "instagram", handle: "mansuh_quranayh", name_ar: "منصة قرآنية عن بُعد", kind: "منصة", topics: ["قرآن", "حلقات"] },
  { platform: "instagram", handle: "quranicplatform", name_ar: "المنصة القرآنية العالمية", kind: "منصة", topics: ["قرآن"] },
  { platform: "telegram", handle: "DrosQ8", name_ar: "دروس الكويت", kind: "قناة", contact: "https://linktr.ee/drosq8", topics: ["دروس", "حلقات", "دورات"], poll_priority: "high" },
  { platform: "instagram", handle: "nadwat.kw", name_ar: "ندوات وحلقات ذكر — دروس الكويت", kind: "قناة", audience: "نساء", topics: ["دروس", "حلقات"] },
  { platform: "instagram", handle: "duroos.alseera", name_ar: "دروس السيرة النبوية", kind: "قناة", topics: ["سيرة", "دروس"] },
  { platform: "instagram", handle: "duroos_abdullahalmubarak", name_ar: "دروس غرب عبدالله المبارك", kind: "قناة", topics: ["دروس"] },
  { platform: "instagram", handle: "mrkz_al_albany", name_ar: "مركز الإمام الألباني لتعليم العلوم الشرعية", kind: "مركز", topics: ["سنة", "فقه"] },
  { platform: "instagram", handle: "diwan_al3uni_alsharif_alesbuei", name_ar: "ديوان العوني الشريف الأسبوعي", kind: "ديوان", topics: ["دروس"] },
  { platform: "instagram", handle: "manaratkw", name_ar: "لجنة منارات للعلم والدعوة", kind: "لجنة", topics: ["دعوة", "دروس"] },
  { platform: "instagram", handle: "alshalahi_masjd", name_ar: "جامع سعد محمد الشلاحي", kind: "مسجد", topics: ["دروس"] },
  { platform: "instagram", handle: "athr_yabka", name_ar: "أثر يبقى", kind: "مبادرة", topics: ["عام"] },
  { platform: "instagram", handle: "trahumkwclub", name_ar: "حلقات تراحم التربوية", kind: "حلقات", topics: ["حلقات", "تربية"] },
  { platform: "instagram", handle: "mosque.mbark.j", name_ar: "مسجد الشيخ مبارك عبدالله المبارك الصباح — الجهراء", kind: "مسجد", topics: ["دروس"] },
  { platform: "instagram", handle: "qetaa_quran", name_ar: "قطاع القرآن الكريم — جمعية الوحيين", kind: "قطاع", topics: ["قرآن", "حلقات"] },
  { platform: "instagram", handle: "shariaaac", name_ar: "أكاديمية الشريعة", kind: "أكاديمية", topics: ["فقه", "دورات"] },
  { platform: "instagram", handle: "rasikhoon", name_ar: "الراسخون", kind: "جمعية", topics: ["دروس", "فقه"] },
  { platform: "instagram", handle: "kwt_awqaf", name_ar: "وزارة الأوقاف والشؤون الإسلامية", kind: "حكومي", site: "https://awqaf.gov.kw", topics: ["دروس", "خطبة"] },
  { platform: "instagram", handle: "ghaith.kw", name_ar: "فريق غيث", kind: "فريق", topics: ["دعوة"] },
  { platform: "instagram", handle: "al_mabarrah", name_ar: "مبرة المتميزين — الحلقات النسائية", kind: "مبرة", audience: "نساء", site: "https://aayatkw.com", topics: ["حلقات", "قرآن"] },
  { platform: "instagram", handle: "fajeralkous", name_ar: "فجر عبدالرحمن الكوس", kind: "شخصية", topics: ["دروس"] },
  { platform: "instagram", handle: "jouryaldahi", name_ar: "جوري جاسم الضاحي", kind: "شخصية", audience: "نساء", topics: ["دروس"] },
  { platform: "instagram", handle: "erth.kwt", name_ar: "إرث — دورات قرآنية وتربوية", kind: "مبادرة", topics: ["دورات", "قرآن"] },
  { platform: "instagram", handle: "wejdanalh", name_ar: "وجدان محمد الجفيري", kind: "شخصية", audience: "نساء", topics: ["دروس"] },
  { platform: "instagram", handle: "erwaa.quran", name_ar: "حلقات إرواء للقرآن — جامعة الكويت", kind: "حلقات", topics: ["حلقات", "قرآن"] },
  { platform: "instagram", handle: "thegrandmosque", name_ar: "المسجد الكبير — دولة الكويت", kind: "مسجد", topics: ["خطبة", "دروس"] },
  { platform: "instagram", handle: "almanabr", name_ar: "جمعية المنابر القرآنية", kind: "جمعية", site: "https://almanabr.org", topics: ["قرآن", "حلقات"] },
  { platform: "instagram", handle: "m_alkhayatq8", name_ar: "مسجد راشد الخياط", kind: "مسجد", topics: ["دروس"] },
  { platform: "instagram", handle: "itm2nan_", name_ar: "إطمئنان", kind: "مبادرة", topics: ["عام"] },
];

const WEB_SOURCES = [
  { handle: "awqaf.gov.kw", name_ar: "وزارة الأوقاف — الموقع الرسمي", site: "https://awqaf.gov.kw" },
  { handle: "almanabr.org", name_ar: "جمعية المنابر القرآنية", site: "https://almanabr.org" },
  { handle: "hoffath.org", name_ar: "جمعية حُفّاظ", site: "https://hoffath.org" },
  { handle: "aayatkw.com", name_ar: "مبرة آيات", site: "https://aayatkw.com" },
  { handle: "manar-alsabil.org", name_ar: "منار السبيل", site: "https://manar-alsabil.org" },
  { handle: "waheen.net", name_ar: "جمعية الوحيين", site: "https://waheen.net" },
  { handle: "drosq8-linktree", name_ar: "دروس الكويت — روابط", site: "https://linktr.ee/drosq8" },
];

function platformUrl(platform, handle, site) {
  if (site) return site;
  if (platform === "instagram") return `https://instagram.com/${handle}`;
  if (platform === "telegram") return `https://t.me/${handle}`;
  if (platform === "youtube") return `https://youtube.com/@${handle}`;
  if (platform === "web") return `https://${handle}`;
  return `https://${handle}`;
}

function toAccount(row) {
  const platform = row.platform;
  const handle = row.handle;
  const id = `${platform === "instagram" ? "ig" : platform}-${handle.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
  return {
    id,
    platform,
    handle,
    url: platformUrl(platform, handle, row.site),
    name_ar: row.name_ar,
    kind: row.kind,
    topics: row.topics ?? ["عام"],
    audience: row.audience ?? "عام",
    region_ar: "الكويت",
    site: row.site,
    contact: row.contact,
    enabled: true,
    poll_priority: row.poll_priority ?? (platform === "telegram" || platform === "web" ? "high" : "normal"),
    last_seen_at: null,
  };
}

export function buildAccountsRegistry() {
  const map = new Map();
  for (const acc of legacyKuwaitAccounts()) {
    map.set(`${acc.platform}:${acc.handle}`, acc);
  }
  for (const row of NEW_ACCOUNTS) {
    map.set(`${row.platform}:${row.handle}`, toAccount(row));
  }
  for (const row of WEB_SOURCES) {
    map.set(`web:${row.handle}`, toAccount({ ...row, platform: "web", kind: "موقع", topics: ["دروس", "إعلان"], poll_priority: "high" }));
  }
  return [...map.values()].sort((a, b) => a.name_ar.localeCompare(b.name_ar, "ar"));
}
