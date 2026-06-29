/**
 * Unified Kuwait scholars registry — canonical profiles built from
 * lesson-ads, scientific announcements, import JSON, and sheikh photos.
 * Always merged with Supabase in production (not demo-only seed).
 */
import { sheikhNameKey, stripSheikhHonorifics } from "@/lib/sheikh-name";
import { resolveLocalSheikhPhoto } from "@/lib/sheikh-photos";
import { lessonAds } from "@/lib/lesson-ads";
import { SCIENTIFIC_ANNOUNCEMENTS } from "@/lib/scientific-announcements-seed";
import { LESSONS_SEED } from "@/lib/lessons-seed";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import importSheikhs from "../../data/import/01-sheikhs.json";

export type SheikhLink = {
  label: string;
  url: string;
};

export type KuwaitScholarProfile = {
  id: string;
  external_key: string;
  name: string;
  fullName: string;
  role?: string;
  country: string;
  city?: string;
  bio: string;
  specialties: string[];
  keywords: string[];
  photo_url: string;
  website_url?: string;
  is_verified: boolean;
  needs_verification: boolean;
  status: "published";
  links: SheikhLink[];
  /** Automation: official source URLs for discovery */
  automation_sources: string[];
  subjects: string[];
  mutoon: string[];
};

/** Stable SEO slug per scholar */
const SLUG_OVERRIDES: Record<string, string> = {
  "سالم بن سعد الطويل": "salem-bin-saad-altaweel",
  "سالم الطويل": "salem-bin-saad-altaweel",
  "د. عثمان بن محمد الخميس": "othman-alkhamees",
  "د. راشد صليهم فهد الصليهم": "rashed-alsulayyim",
  "د. منصور بن ناصر الخالدي": "mansour-alkhalidi",
  "الشيخ أسامة الشطي": "osama-alshatti",
  "الشيخ حسين بن مبارك المويزري": "hussein-muwaiziri",
  "د. دهام أبو خشبة": "daham-abukhashba",
  "نصار خالد نصار العجمي": "nasar-alajmi",
  "حامد علي المسعد": "hamed-almesaad",
  "فيصل زويد": "faisal-zowaid",
  "سعد هزاع العتيبي": "saad-otaibi",
  "بندر محمد الميموني": "bandar-almaimouni",
  "د. مطلق جاسر مطلق الجاسر": "mutlaq-aljasser",
  "د. محمد ضاوي العصيمي": "mohammad-dawwi-al-usaimi",
};

const BIO_OVERRIDES: Record<string, string> = {
  "سالم بن سعد الطويل":
    "عالم وداعية كويتي، يقدّم دروساً أسبوعية في العقيدة والحديث، منها شرح كتاب التوحيد من صحيح البخاري. جميع الدروس تُبث عبر حساباته الرسمية.",
  "د. عثمان بن محمد الخميس":
    "عالم أصولي ومفسر، له مجالس علمية أسبوعية ثابتة في مساجد الكويت، في التفسير والحديث والفقه.",
  "د. راشد صليهم فهد الصليهم":
    "أستاذ مشارك في جامعة الكويت، يقدّم دورة علمية تأصيلية أسبوعية.",
  "د. منصور بن ناصر الخالدي":
    "داعية ومحاضر، مجلس أسبوعي في التفسير والقراءة بعد صلاة الفجر.",
  "الشيخ أسامة الشطي":
    "إمام وخطيب، يقدّم برنامجاً علمياً في الفقه عبر منصة الأندلس.",
  "د. محمد ضاوي العصيمي":
    "أستاذ مشارك في كلية الشريعة بجامعة الكويت، داعية ومحاضر في الوعظ والتزكية.",
};

function slugifySheikh(name: string): string {
  const core = stripSheikhHonorifics(name);
  if (SLUG_OVERRIDES[core]) return SLUG_OVERRIDES[core];
  const key = sheikhNameKey(core);
  for (const [pattern, slug] of Object.entries(SLUG_OVERRIDES)) {
    if (sheikhNameKey(pattern) === key) return slug;
  }
  return core
    .replace(/\s+/g, "-")
    .replace(/[^\u0600-\u06FFa-z0-9-]/gi, "")
    .slice(0, 48) || `sheikh-${key.slice(0, 12).replace(/\s/g, "-")}`;
}

function categoryTagsFromLessons(name: string): string[] {
  const key = sheikhNameKey(name);
  const cats = new Set<string>();
  for (const row of LESSONS_SEED) {
    if (sheikhNameKey(row.speaker_name || "") !== key) continue;
    if (row.category) cats.add(row.category);
    for (const kw of row.keywords || []) cats.add(kw);
  }
  return [...cats];
}

function mutoonFromLessons(name: string): string[] {
  const key = sheikhNameKey(name);
  const books = new Set<string>();
  for (const ann of SCIENTIFIC_ANNOUNCEMENTS) {
    if (sheikhNameKey(ann.sheikh) !== key) continue;
    if (ann.bookTitle) books.add(ann.bookTitle);
  }
  return [...books];
}

function linksForSheikh(name: string): SheikhLink[] {
  const key = sheikhNameKey(name);
  const links: SheikhLink[] = [];

  for (const ann of SCIENTIFIC_ANNOUNCEMENTS) {
    if (sheikhNameKey(ann.sheikh) !== key) continue;
    if (ann.websiteUrl) links.push({ label: "الموقع الرسمي", url: ann.websiteUrl });
    for (const b of ann.broadcastLinks || []) links.push({ label: b.label, url: b.url });
  }

  for (const ad of lessonAds) {
    if (sheikhNameKey(ad.teacher) !== key) continue;
    if (ad.provider.startsWith("http")) links.push({ label: "المصدر", url: ad.provider });
    for (const s of ad.sessions) {
      if (s.liveUrl) links.push({ label: "البث المباشر", url: s.liveUrl });
    }
  }

  const seen = new Set<string>();
  return links.filter((l) => {
    if (seen.has(l.url)) return false;
    seen.add(l.url);
    return true;
  });
}

function automationSourcesFor(name: string): string[] {
  return linksForSheikh(name)
    .map((l) => l.url)
    .filter((u) => /^https?:\/\//i.test(u));
}

function buildProfile(name: string, extras: Partial<KuwaitScholarProfile> = {}): KuwaitScholarProfile {
  const core = stripSheikhHonorifics(name);
  const slug = slugifySheikh(core);
  const importRow = (importSheikhs as Array<{ name: string; bio?: string; city?: string; specialties?: string[]; photo_url?: string }>).find(
    (r) => sheikhNameKey(r.name) === sheikhNameKey(core) || r.name.includes(core.split(" ").slice(-2).join(" ")),
  );

  const specialties = extras.specialties || importRow?.specialties || categoryTagsFromLessons(core).filter((c) =>
    ["تفسير", "فقه", "حديث", "عقيدة", "سيرة", "تربية", "تأصيل", "وعظ", "تزكية"].includes(c),
  );

  const website = linksForSheikh(core).find((l) => l.label === "الموقع الرسمي")?.url;

  return {
    id: slug,
    external_key: slug,
    name: core,
    fullName: name.trim(),
    role: extras.role,
    country: "الكويت",
    city: extras.city || importRow?.city,
    bio: extras.bio || BIO_OVERRIDES[core] || importRow?.bio || `${core} — من مشايخ وعلماء الكويت على منصة المجلس العلمي.`,
    specialties: specialties.length ? specialties : ["علوم شرعية"],
    keywords: [core, ...core.split(" "), ...(specialties || [])],
    photo_url: extras.photo_url || importRow?.photo_url || resolveLocalSheikhPhoto(core),
    website_url: website,
    is_verified: extras.is_verified ?? true,
    needs_verification: false,
    status: "published",
    links: linksForSheikh(core),
    automation_sources: automationSourcesFor(core),
    subjects: categoryTagsFromLessons(core),
    mutoon: mutoonFromLessons(core),
    ...extras,
  };
}

function collectAllSheikhNames(): string[] {
  const names = new Set<string>();
  for (const ad of lessonAds) names.add(ad.teacher);
  for (const ann of SCIENTIFIC_ANNOUNCEMENTS) names.add(ann.sheikh);
  for (const row of LESSONS_SEED) {
    if (row.speaker_name) names.add(row.speaker_name);
  }
  for (const row of importSheikhs as Array<{ name: string }>) names.add(row.name);
  return [...names].filter(Boolean);
}

/** All Kuwait scholars — canonical registry */
export const KUWAIT_SCHOLAR_REGISTRY: KuwaitScholarProfile[] = collectAllSheikhNames().map((name) =>
  buildProfile(name),
);

const byKey = new Map<string, KuwaitScholarProfile>();
const byId = new Map<string, KuwaitScholarProfile>();

for (const profile of KUWAIT_SCHOLAR_REGISTRY) {
  byKey.set(sheikhNameKey(profile.name), profile);
  byKey.set(sheikhNameKey(profile.fullName), profile);
  byId.set(profile.id, profile);
  byId.set(profile.external_key, profile);
}

export function resolveScholarProfile(nameOrId?: string | null): KuwaitScholarProfile | null {
  const raw = String(nameOrId || "").trim();
  if (!raw) return null;
  if (byId.has(raw)) return byId.get(raw)!;
  const byName = byKey.get(sheikhNameKey(raw));
  if (byName) return byName;
  for (const profile of KUWAIT_SCHOLAR_REGISTRY) {
    const key = sheikhNameKey(raw);
    if (sheikhNameKey(profile.name).includes(key) || key.includes(sheikhNameKey(profile.name))) {
      return profile;
    }
  }
  return null;
}

export function scholarProfileHref(profile: KuwaitScholarProfile): string {
  return `/sheikhs/${profile.id}`;
}

export function mergeRegistrySheikhs<T extends { id?: string; name?: string; external_key?: string }>(
  dbRows: T[],
): Array<T | (KuwaitScholarProfile & { ijazah?: string })> {
  const seen = new Set<string>();
  const merged: Array<T | (KuwaitScholarProfile & { ijazah?: string })> = [];

  for (const row of dbRows) {
    const key = sheikhNameKey(row.name || "");
    if (key) seen.add(key);
    merged.push(row);
  }

  for (const profile of KUWAIT_SCHOLAR_REGISTRY) {
    const key = sheikhNameKey(profile.name);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push({
      ...profile,
      ijazah: profile.role,
    });
  }

  return merged.sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "ar"));
}

export function lessonsForScholar(
  scholar: KuwaitScholarProfile,
  allLessons: KuwaitLessonRecord[],
): KuwaitLessonRecord[] {
  const key = sheikhNameKey(scholar.name);
  return allLessons.filter((l) => sheikhNameKey(l.sheikhName || "") === key);
}
