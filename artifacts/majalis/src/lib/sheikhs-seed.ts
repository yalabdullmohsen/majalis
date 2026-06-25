/**
 * علماء ومشايخ — بيانات موثقة
 */
export type SheikhSeedItem = {
  id: string;
  name: string;
  ijazah?: string;
  city?: string;
  years_experience?: number;
  is_verified: boolean;
  specialties: string[];
  bio?: string;
  photo_url?: string;
};

export const SHEIKHS_SEED: SheikhSeedItem[] = [
  {
    id: "sheikh-001",
    name: "الشيخ عبدالله بن عبدالعزيز بن باز",
    ijazah: "إجازة في العقيدة والحديث",
    city: "الرياض",
    years_experience: 40,
    is_verified: true,
    specialties: ["عقيدة", "حديث", "فتاوى"],
    bio: "من كبار علماء المملكة؛ تخصص في العقيدة والحديث؛ له فتاوى ودروس كثيرة.",
  },
  {
    id: "sheikh-002",
    name: "الشيخ محمد بن صالح العثيمين",
    ijazah: "إجازة في الفقه والأصول",
    city: "القصيم",
    years_experience: 35,
    is_verified: true,
    specialties: ["فقه", "أصول", "تفسير"],
    bio: "عالم فقيه مفسر؛ له مؤلفات في التفسير والفقه والعقيدة.",
  },
  {
    id: "sheikh-003",
    name: "الشيخ محمد ناصر الدين الألباني",
    ijazah: "إجازة في علوم الحديث",
    city: "عمان",
    years_experience: 30,
    is_verified: true,
    specialties: ["حديث", "علل", "سنة"],
    bio: "محدث العصر؛ له تصحيح وتضعيف الأحاديث وكتب في السنة.",
  },
  {
    id: "sheikh-004",
    name: "الشيخ صالح بن فوزان الفوزان",
    ijazah: "عضو هيئة كبار العلماء",
    city: "الرياض",
    years_experience: 30,
    is_verified: true,
    specialties: ["فقه", "فتوى", "عقيدة"],
    bio: "عالم فقه وعقيدة؛ له سلسلة «المنتقى من فتاوى» وشروح متعددة.",
  },
  {
    id: "sheikh-005",
    name: "الشيخ عبد العزيز بن عبد الله آل الشيخ",
    ijazah: "مفتي عام المملكة (سابقاً)",
    city: "الرياض",
    years_experience: 25,
    is_verified: true,
    specialties: ["فتوى", "عقيدة"],
    bio: "عضو هيئة كبار العلماء؛ له فتاوى ودروس في العقيدة والفقه.",
  },
  {
    id: "sheikh-006",
    name: "الإمام أحمد بن حنبل",
    ijazah: "إمام أهل السنة",
    city: "بغداد",
    years_experience: 40,
    is_verified: true,
    specialties: ["حديث", "فقه"],
    bio: "صاحب المذهب الحنبلي؛ جمع المسند؛ من أئمة الحديث.",
  },
  {
    id: "sheikh-007",
    name: "الإمام الشافعي",
    ijazah: "إمام المذهب الشافعي",
    city: "مصر",
    years_experience: 35,
    is_verified: true,
    specialties: ["فقه", "أصول"],
    bio: "صاحب الرسالة؛ جمع بين الفقه والحديث والأصول.",
  },
  {
    id: "sheikh-008",
    name: "الإمام مالك بن أنس",
    ijazah: "إمام دار الهجرة",
    city: "المدينة",
    years_experience: 40,
    is_verified: true,
    specialties: ["فقه", "حديث"],
    bio: "صاحب الموطأ؛ إمام أهل المدينة في الفقه والحديث.",
  },
];
