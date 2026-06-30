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
  {
    id: "salem-bin-saad-altaweel",
    name: "سالم بن سعد الطويل",
    fullName: "سالم بن سعد الطويل",
    role: "داعية — طالب علم",
    country: "الكويت",
    specialties: ["عقيدة", "حديث", "دعوة"],
    bio: "داعية كويتي يُلقي دروساً أسبوعية في شرح كتب الحديث والعقيدة. من أبرز دروسه شرح كتاب التوحيد من صحيح البخاري، يُعقد كل أحد بعد العشاء في ديوان أبو عبدالعزيز جنوب عبدالله المبارك. تُبثّ دروسه مباشرةً عبر حساباته في وسائل التواصل الاجتماعي.",
    needs_verification: false,
    sources: [
      {
        source_title: "الموقع الرسمي للشيخ سالم الطويل",
        source_url: "https://www.saltaweel.com",
        verified: true,
      },
      {
        source_title: "حساب إنستغرام @salemaltaweel",
        source_url: "https://instagram.com/salemaltaweel",
        verified: true,
      },
    ],
  },
  {
    id: "hussain-bin-mubarak-almuwaiziri",
    name: "الشيخ حسين بن مبارك المويزري",
    fullName: "حسين بن مبارك المويزري",
    role: "طالب علم — داعية",
    country: "الكويت",
    specialties: ["حديث", "فقه", "شرح متون"],
    bio: "شيخ كويتي يُعنى بشرح كتب الحديث والفقه، من أبرز دروسه شرح كتاب «روضة الأفهام في شرح زوائد المحرر على بلوغ المرام».",
    needs_verification: false,
    sources: [],
  },
  {
    id: "hamed-ali-almasad",
    name: "حامد علي المسعد",
    fullName: "حامد علي المسعد",
    role: "داعية — مربٍّ",
    country: "الكويت",
    specialties: ["تزكية", "وعظ", "قرآن"],
    bio: "داعية كويتي بارز في مجال التزكية والوعظ، اشتهر بمحاضرة «القرآن ربيع القلوب» وغيرها من المحاضرات التربوية. من مشايخ ملتقى «إجازتي طاعة».",
    needs_verification: false,
    sources: [],
  },
  {
    id: "nassar-khalid-alajmi",
    name: "نصار خالد نصار العجمي",
    fullName: "نصار خالد نصار العجمي",
    role: "داعية — مربٍّ",
    country: "الكويت",
    specialties: ["وعظ", "تربية", "دعوة"],
    bio: "داعية كويتي يُركز في محاضراته على الجانب التربوي والتزكوي. من مشايخ ملتقى «إجازتي طاعة»، له محاضرة «ليس في العمر إجازة» المشهورة.",
    needs_verification: false,
    sources: [],
  },
  {
    id: "bandar-mohammed-almaymuni",
    name: "بندر محمد الميموني",
    fullName: "بندر محمد الميموني",
    role: "داعية",
    country: "الكويت",
    specialties: ["وعظ", "تزكية", "رقائق"],
    bio: "داعية كويتي متخصص في الرقائق وأحوال القلوب. من مشايخ ملتقى «إجازتي طاعة»، له محاضرة «حياة القلوب».",
    needs_verification: false,
    sources: [],
  },
  {
    id: "saad-hazzaa-alutaibi",
    name: "سعد هزاع العتيبي",
    fullName: "سعد هزاع العتيبي",
    role: "داعية",
    country: "الكويت",
    specialties: ["وعظ", "ثبات", "دعوة"],
    bio: "داعية كويتي يُعرف بمحاضرات الثبات والتثبيت على الدين. من مشايخ ملتقى «إجازتي طاعة»، له محاضرة «الثبات حتى الممات».",
    needs_verification: false,
    sources: [],
  },
  {
    id: "faisal-zuwaid",
    name: "فيصل زويد",
    fullName: "فيصل زويد",
    role: "داعية",
    country: "الكويت",
    specialties: ["تزكية", "وعظ", "قلوب"],
    bio: "داعية كويتي له محاضرات في تزكية النفس وصلاح القلب. من مشايخ ملتقى «إجازتي طاعة»، له محاضرة «إلا من أتى بقلب سليم».",
    needs_verification: false,
    sources: [],
  },
  {
    id: "daham-abu-khashabah",
    name: "د. دهام أبو خشبة",
    fullName: "د. دهام أبو خشبة",
    role: "أكاديمي — داعية",
    country: "الكويت",
    specialties: ["فقه", "أصول الفقه", "حديث"],
    bio: "أكاديمي وداعية كويتي متخصص في الفقه وأصوله. يُلقي دروساً فقهية منها شرح «عمدة الأحكام».",
    needs_verification: false,
    sources: [],
  },
  {
    id: "mutlaq-jaser-aljasr",
    name: "د. مطلق جاسر مطلق الجاسر",
    fullName: "د. مطلق جاسر مطلق الجاسر",
    role: "أكاديمي — داعية",
    country: "الكويت",
    specialties: ["طلب العلم", "تأصيل علمي", "دعوة"],
    bio: "داعية وأكاديمي كويتي، يُشرف على برامج تأهيل طلاب العلم المبتدئين. مؤسس دورة «طلائع العلم» الإلكترونية لطلاب العلم المبتدئين.",
    needs_verification: false,
    sources: [],
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
