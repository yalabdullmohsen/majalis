import { sheikhNameKey } from "@/lib/sheikh-name";

export type SheikhInfoSource = {
  source_title: string;
  source_url: string;
  verified: boolean;
};

export type KuwaitSheikhProfile = {
  id: string;
  name: string;
  fullName: string;
  role?: string;
  country: string;
  specialties: string[];
  bio: string;
  needs_verification: boolean;
  sources: SheikhInfoSource[];
  photo_url?: string;
};

const FALLBACK_BIO =
  "د. محمد ضاوي العصيمي، داعية ومحاضر كويتي، تُنشر له دروس ومحاضرات في الوعظ والتذكير والتزكية.";

export const KUWAIT_SHEIKH_PROFILES: KuwaitSheikhProfile[] = [
  {
    id: "mohammad-dawwi-al-usaimi",
    name: "د. محمد ضاوي العصيمي",
    fullName: "د. محمد ضاوي ناشي العصيمي",
    role: "أستاذ مشارك — داعية",
    country: "الكويت",
    specialties: ["فقه", "أصول الفقه", "وعظ", "تزكية"],
    bio: "أستاذ مشارك في كلية الشريعة والدراسات الإسلامية بجامعة الكويت. له موقع رسمي ينشر عبره مقالات ومحاضرات وفتاوى في الكويت.",
    needs_verification: false,
    sources: [
      {
        source_title: "جامعة الكويت — دليل أعضاء هيئة التدريس",
        source_url: "https://www.ku.edu.kw/ar/user/6854",
        verified: true,
      },
      {
        source_title: "الموقع الرسمي لد. محمد ضاوي العصيمي",
        source_url: "https://dr-alossimi.com/about-sheikh-3/",
        verified: true,
      },
    ],
    photo_url: "/images/posters/fadat-dawwi-al-usaimi.svg",
  },
];

const profileByKey = new Map(
  KUWAIT_SHEIKH_PROFILES.flatMap((profile) => [
    [sheikhNameKey(profile.name), profile],
    [sheikhNameKey(profile.fullName), profile],
    [profile.id, profile],
  ]),
);

export function resolveKuwaitSheikhProfile(nameOrId?: string | null): KuwaitSheikhProfile | null {
  const raw = String(nameOrId || "").trim();
  if (!raw) return null;

  const byId = profileByKey.get(raw);
  if (byId) return byId;

  const byName = profileByKey.get(sheikhNameKey(raw));
  if (byName) return byName;

  if (sheikhNameKey(raw).includes("محمد ضاوي") && sheikhNameKey(raw).includes("العصيمي")) {
    return {
      id: "mohammad-dawwi-al-usaimi",
      name: "د. محمد ضاوي العصيمي",
      fullName: raw,
      country: "الكويت",
      specialties: ["وعظ", "تزكية"],
      bio: FALLBACK_BIO,
      needs_verification: true,
      sources: [],
      photo_url: "/images/posters/fadat-dawwi-al-usaimi.svg",
    };
  }

  return null;
}

export function sheikhProfileHref(profile: KuwaitSheikhProfile): string {
  return `/sheikhs/${profile.id}`;
}
