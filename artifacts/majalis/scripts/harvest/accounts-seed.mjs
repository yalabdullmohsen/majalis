/**
 * بذرة حسابات حصاد المصادر — تُدمَج مع kuwait-instagram-sources ثم تُكتب accounts.json
 */
import { KUWAIT_INSTAGRAM_SOURCES } from "../../lib/cms/kuwait-instagram-sources.mjs";

const HIGH_HANDLES = new Set([
  "nebraas_kw",
  "w_alanbiya",
  "7offath",
  "tartelkw",
  "alholah_kw",
  "nadwat.kw",
  "duroos.alseera",
  "kwt_awqaf",
  "thegrandmosque",
  "shariaaac",
  "mrkz_al_albany",
  "DrosQ8",
  "awqaf.gov.kw",
  "almanabr.org",
  "hoffath.org",
]);

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
    trusted: true,
    autoPublish: true,
    poll_priority: HIGH_HANDLES.has(s.config.handle) ? "high" : "normal",
    last_seen_at: null,
  }));
}

/** @type {Array<Partial<import('./types.mjs').SourceAccount> & { platform: string; handle: string; name_ar: string; kind: string; topics: string[] }>} */
const ACCOUNTS = [
  { platform: "instagram", handle: "nebraas_kw", name_ar: "مركز نبراس للسنة النبوية", kind: "مركز", topics: ["سنة", "حديث", "دروس", "دورات"] },
  { platform: "instagram", handle: "w_alanbiya", name_ar: "أكاديمية ورثة الأنبياء", kind: "أكاديمية", topics: ["علم شرعي", "دورات", "دروس"] },
  { platform: "instagram", handle: "7offath", name_ar: "حُفّاظ", kind: "جمعية", site: "https://hoffath.org", topics: ["قرآن", "حلقات", "تحفيظ"] },
  { platform: "instagram", handle: "tartelkw", name_ar: "جمعية ترتيل", kind: "جمعية", audience: "نساء", topics: ["قرآن", "نساء", "حلقات"] },
  { platform: "instagram", handle: "alholah_kw", name_ar: "حلقات الخلة لتحفيظ القرآن الكريم", kind: "حلقات", topics: ["قرآن", "تحفيظ"] },
  { platform: "instagram", handle: "masjid_mubark_alsaifi", name_ar: "مسجد مبارك الصيفي ووالديه", kind: "مسجد", topics: ["دروس", "قرآن", "محاضرات"] },
  { platform: "instagram", handle: "alwa7yyen", name_ar: "جمعية الوحيين — مركز الدرر", kind: "جمعية", site: "https://waheen.net", topics: ["قرآن", "علم", "دورات"] },
  { platform: "instagram", handle: "saad.al.abdullah.city", name_ar: "مركز سعد العبدالله لتحفيظ القرآن", kind: "مركز", topics: ["قرآن", "حلقات"] },
  { platform: "instagram", handle: "mansuh_quranayh", name_ar: "منصة قرآنية عن بُعد", kind: "منصة", topics: ["قرآن", "تلاوة", "حفظ"] },
  { platform: "instagram", handle: "quranicplatform", name_ar: "المنصة القرآنية العالمية", kind: "منصة", topics: ["قرآن", "تعليم"] },
  { platform: "instagram", handle: "nadwat.kw", name_ar: "ندوات وحلقات ذكر — دروس الكويت للنساء", kind: "قناة", audience: "نساء", topics: ["نساء", "دروس", "محاضرات"] },
  { platform: "instagram", handle: "duroos.alseera", name_ar: "دروس السيرة النبوية", kind: "قناة", topics: ["سيرة", "دروس"] },
  { platform: "instagram", handle: "duroos_abdullahalmubarak", name_ar: "دروس غرب عبدالله المبارك", kind: "قناة", topics: ["دروس", "حلقات"] },
  { platform: "instagram", handle: "mrkz_al_albany", name_ar: "مركز الإمام الألباني لتعليم العلوم الشرعية", kind: "مركز", topics: ["علم شرعي", "دورات"] },
  { platform: "instagram", handle: "diwan_al3uni_alsharif_alesbuei", name_ar: "ديوان العوني الشريف الأسبوعي", kind: "ديوان", topics: ["دروس", "لقاءات"] },
  { platform: "instagram", handle: "manaratkw", name_ar: "لجنة منارات للعلم والدعوة", kind: "لجنة", topics: ["دعوة", "علم", "دروس"] },
  { platform: "instagram", handle: "alshalahi_masjd", name_ar: "جامع سعد محمد الشلاحي", kind: "مسجد", topics: ["فقه", "دروس", "خطب"] },
  { platform: "instagram", handle: "athr_yabka", name_ar: "أثر يبقى", kind: "مبادرة", topics: ["فوائد", "دعوة"] },
  { platform: "instagram", handle: "trahumkwclub", name_ar: "حلقات تراحم التربوية", kind: "حلقات", topics: ["قرآن", "تربية"] },
  { platform: "instagram", handle: "mosque.mbark.j", name_ar: "مسجد الشيخ مبارك عبدالله المبارك الصباح — الجهراء", kind: "مسجد", topics: ["دروس", "حلقات"] },
  { platform: "instagram", handle: "qetaa_quran", name_ar: "قطاع القرآن الكريم — جمعية الوحيين", kind: "قطاع", topics: ["قرآن", "حلقات"] },
  { platform: "instagram", handle: "shariaaac", name_ar: "أكاديمية الشريعة", kind: "أكاديمية", topics: ["فقه", "علم شرعي", "دورات"] },
  { platform: "instagram", handle: "rasikhoon", name_ar: "الراسخون", kind: "جمعية", topics: ["علم شرعي", "دروس"] },
  { platform: "instagram", handle: "kwt_awqaf", name_ar: "وزارة الأوقاف والشؤون الإسلامية", kind: "حكومي", site: "https://awqaf.gov.kw", topics: ["دروس", "خطب", "فعاليات"] },
  { platform: "instagram", handle: "ghaith.kw", name_ar: "فريق غيث", kind: "فريق", topics: ["دعوة", "مبادرات"] },
  { platform: "instagram", handle: "al_mabarrah", name_ar: "مبرة المتميزين — الحلقات النسائية", kind: "مبرة", audience: "نساء", site: "https://aayatkw.com", topics: ["نساء", "قرآن", "حلقات"] },
  { platform: "instagram", handle: "fajeralkous", name_ar: "فجر عبدالرحمن الكوس", kind: "شخصية", topics: ["قرآن", "تعليم"] },
  { platform: "instagram", handle: "jouryaldahi", name_ar: "جوري جاسم الضاحي", kind: "شخصية", audience: "نشء", topics: ["قرآن", "تعليم"] },
  { platform: "instagram", handle: "erth.kwt", name_ar: "إرث", kind: "مبادرة", topics: ["دورات", "قرآن", "تربية"] },
  { platform: "instagram", handle: "wejdanalh", name_ar: "وجدان محمد الجفيري", kind: "شخصية", audience: "نساء", topics: ["دروس", "قرآن"] },
  { platform: "instagram", handle: "erwaa.quran", name_ar: "حلقات إرواء للقرآن — جامعة الكويت", kind: "حلقات", audience: "نشء", topics: ["قرآن", "طالبات"] },
  { platform: "instagram", handle: "thegrandmosque", name_ar: "المسجد الكبير — دولة الكويت", kind: "مسجد", topics: ["خطب", "محاضرات"] },
  { platform: "instagram", handle: "almanabr", name_ar: "جمعية المنابر القرآنية", kind: "جمعية", site: "https://almanabr.org", topics: ["قرآن", "حلقات"] },
  { platform: "instagram", handle: "m_alkhayatq8", name_ar: "مسجد راشد الخياط", kind: "مسجد", topics: ["دروس", "حلقات"] },
  { platform: "instagram", handle: "itm2nan_", name_ar: "إطمئنان", kind: "مبادرة", topics: ["دعوة", "تذكير"] },
  { platform: "instagram", handle: "DrosQ8", name_ar: "دروس الكويت", kind: "قناة", topics: ["دروس", "خطب", "مشايخ"] },
  { platform: "telegram", handle: "DrosQ8", name_ar: "دروس الكويت", kind: "قناة", contact: "https://t.me/DrosQ8", topics: ["دروس", "خطب", "مشايخ"] },
  { platform: "web", handle: "awqaf.gov.kw", name_ar: "وزارة الأوقاف", kind: "حكومي", site: "https://awqaf.gov.kw", topics: ["دروس", "خطب", "فعاليات"] },
  { platform: "web", handle: "almanabr.org", name_ar: "جمعية المنابر القرآنية", kind: "جمعية", site: "https://almanabr.org", topics: ["قرآن", "حلقات"] },
  { platform: "web", handle: "hoffath.org", name_ar: "حفّاظ", kind: "جمعية", site: "https://hoffath.org", topics: ["قرآن", "حلقات", "تحفيظ"] },
  { platform: "web", handle: "aayatkw.com", name_ar: "آيات", kind: "مبرة", site: "https://aayatkw.com", topics: ["قرآن", "حلقات"] },
  { platform: "web", handle: "manar-alsabil.org", name_ar: "منار السبيل", kind: "لجنة", site: "https://manar-alsabil.org", topics: ["دعوة", "علم", "دروس"] },
  { platform: "web", handle: "waheen.net", name_ar: "جمعية الوحيين", kind: "جمعية", site: "https://waheen.net", topics: ["قرآن", "علم", "دورات"] },
  { platform: "web", handle: "drosq8-linktree", name_ar: "روابط دروس الكويت", kind: "قناة", site: "https://linktr.ee/drosq8", topics: ["دروس", "خطب", "مشايخ"] },
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
  const high = HIGH_HANDLES.has(handle) || platform === "telegram";
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
    trusted: true,
    autoPublish: true,
    poll_priority: row.poll_priority ?? (high ? "high" : "normal"),
    last_seen_at: null,
  };
}

export function buildAccountsRegistry() {
  const map = new Map();
  for (const acc of legacyKuwaitAccounts()) {
    map.set(`${acc.platform}:${acc.handle.toLowerCase()}`, acc);
  }
  for (const row of ACCOUNTS) {
    map.set(`${row.platform}:${row.handle.toLowerCase()}`, toAccount(row));
  }
  return [...map.values()].sort((a, b) => a.name_ar.localeCompare(b.name_ar, "ar"));
}
