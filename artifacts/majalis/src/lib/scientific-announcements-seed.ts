/**
 * Seed data for scientific lesson announcements.
 * Structured for future migration to Supabase (table: scientific_announcements).
 */

export type AnnouncementKind = "weekly" | "one_time" | "online_course";

export type BroadcastLink = {
  label: string;
  url: string;
};

export type ScientificAnnouncement = {
  id: string;
  announcementTitle: string;
  lessonTitle: string;
  sheikh: string;
  bookTitle?: string;
  bookAuthor?: string;
  organizer?: string;
  day?: string;
  /** ISO date (yyyy-MM-dd) for one-time events or course start */
  date?: string;
  time?: string;
  mosque?: string;
  venue?: string;
  region?: string;
  governorate?: string;
  registrationUrl?: string;
  liveUrl?: string;
  websiteUrl?: string;
  contactPhone?: string;
  socialHandle?: string;
  mapUrl?: string;
  posterImage?: string;
  notes: string[];
  tags: string[];
  kind: AnnouncementKind;
  /** Weekly recurrence — day name in Arabic */
  recurrenceDay?: string;
  broadcastLinks?: BroadcastLink[];
};

export const SCIENTIFIC_ANNOUNCEMENTS: ScientificAnnouncement[] = [
  {
    id: "sci-tawheed-saltaweel",
    announcementTitle: "تذكير بدرس الليلة",
    lessonTitle: "شرح كتاب التوحيد من صحيح البخاري",
    sheikh: "سالم بن سعد الطويل",
    bookTitle: "شرح كتاب التوحيد من صحيح البخاري",
    bookAuthor: "محمد بن صالح العثيمين (رحمه الله)",
    organizer: "مجلس الشيخ سالم بن سعد الطويل",
    day: "الأحد",
    time: "9:15 مساءً",
    venue: "ديوان: أحمد غربي الرمالي الشمري (أبو عبدالعزيز)",
    region: "جنوب عبدالله المبارك — قطعة 5 مقابل طريق الدائري السابع",
    governorate: "غير محدد",
    websiteUrl: "https://www.saltaweel.com",
    contactPhone: "0096555199147",
    socialHandle: "@saltaweel",
    notes: [
      "الدرس كل أحد.",
      "توجد نسخ للحضور.",
      "جميع الدروس تنقل عن طريق البث المباشر في حسابات الشيخ حفظه الله.",
    ],
    tags: ["عقيدة", "حديث", "أسبوعي", "بث مباشر"],
    kind: "weekly",
    recurrenceDay: "الأحد",
    broadcastLinks: [
      { label: "الموقع الرسمي", url: "https://www.saltaweel.com" },
      { label: "واتساب", url: "https://wa.me/96555199147" },
      { label: "إنستغرام", url: "https://instagram.com/salemaltaweel" },
    ],
  },
  {
    id: "sci-rawdat-alafham-muwaiziri",
    announcementTitle: "درس جديد",
    lessonTitle: "روضة الأفهام في شرح زوائد المحرر على بلوغ المرام",
    sheikh: "الشيخ حسين بن مبارك المويزري",
    bookTitle: "روضة الأفهام في شرح زوائد المحرر على بلوغ المرام",
    bookAuthor: "تأليف عبد الله بن صالح الفوزان",
    day: "الاثنين",
    time: "بعد صلاة العصر",
    mosque: "مسجد سعد بن دبيس بين ق6 وق7",
    region: "الفردوس",
    governorate: "غير محدد",
    notes: ["خاص بالرجال."],
    tags: ["فقه", "أسبوعي", "حضوري"],
    kind: "weekly",
    recurrenceDay: "الاثنين",
  },
  {
    id: "sci-umdat-ahkam-daham",
    announcementTitle: "الدروس الفقهية",
    lessonTitle: "شرح كتاب عمدة الأحكام",
    sheikh: "د. دهام أبو خشبة",
    bookTitle: "عمدة الأحكام",
    bookAuthor: "الحافظ عبد الغني المقدسي",
    organizer: "بالتعاون مع إدارة مساجد الأحمدي",
    day: "الثلاثاء",
    date: "2026-06-16",
    time: "بعد صلاة العصر",
    mosque: "مسجد أبو طاهر السلفي",
    region: "صباح الأحمد",
    governorate: "الأحمدي",
    notes: [
      "كل يوم ثلاثاء.",
      "يبدأ من 16/6/2026.",
    ],
    tags: ["فقه", "أسبوعي", "حضوري"],
    kind: "weekly",
    recurrenceDay: "الثلاثاء",
  },
  {
    id: "sci-ijazati-taah-1",
    announcementTitle: "ملتقى إجازتي طاعة",
    lessonTitle: "ليس في العمر إجازة",
    sheikh: "نصار خالد نصار العجمي",
    organizer:
      "وزارة الشؤون الإسلامية — إدارة مساجد محافظة الفروانية — جمعية الهداية الخيرية (قسم الدعوة والإرشاد)",
    day: "الأحد",
    date: "2026-06-21",
    time: "بعد صلاة المغرب",
    mosque: "مسجد صقر الفرماوي",
    region: "إشبيلية",
    governorate: "الفروانية",
    contactPhone: "60789104",
    socialHandle: "@dwhedayakew",
    notes: [
      "جميع الدروس بعد صلاة المغرب.",
      "سيتم بث الأنشطة عبر حسابات الجمعية.",
    ],
    tags: ["درس", "ملتقى", "حضوري", "بث"],
    kind: "one_time",
  },
  {
    id: "sci-ijazati-taah-2",
    announcementTitle: "ملتقى إجازتي طاعة",
    lessonTitle: "القرآن ربيع القلوب",
    sheikh: "حامد علي المسعد",
    organizer:
      "وزارة الشؤون الإسلامية — إدارة مساجد محافظة الفروانية — جمعية الهداية الخيرية (قسم الدعوة والإرشاد)",
    day: "الثلاثاء",
    date: "2026-06-23",
    time: "بعد صلاة المغرب",
    mosque: "مسجد سهل بن سعد",
    region: "الرحاب",
    governorate: "الفروانية",
    contactPhone: "60789104",
    socialHandle: "@dwhedayakew",
    notes: [
      "جميع الدروس بعد صلاة المغرب.",
      "سيتم بث الأنشطة عبر حسابات الجمعية.",
    ],
    tags: ["درس", "ملتقى", "حضوري", "بث"],
    kind: "one_time",
  },
  {
    id: "sci-ijazati-taah-3",
    announcementTitle: "ملتقى إجازتي طاعة",
    lessonTitle: "إلا من أتى بقلب سليم",
    sheikh: "فيصل زويد",
    organizer:
      "وزارة الشؤون الإسلامية — إدارة مساجد محافظة الفروانية — جمعية الهداية الخيرية (قسم الدعوة والإرشاد)",
    day: "الأحد",
    date: "2026-06-28",
    time: "بعد صلاة المغرب",
    mosque: "مسجد جبير بن مطعم",
    region: "الرابية",
    governorate: "الفروانية",
    contactPhone: "60789104",
    socialHandle: "@dwhedayakew",
    notes: [
      "جميع الدروس بعد صلاة المغرب.",
      "سيتم بث الأنشطة عبر حسابات الجمعية.",
    ],
    tags: ["درس", "ملتقى", "حضوري", "بث"],
    kind: "one_time",
  },
  {
    id: "sci-ijazati-taah-4",
    announcementTitle: "ملتقى إجازتي طاعة",
    lessonTitle: "الثبات حتى الممات",
    sheikh: "سعد هزاع العتيبي",
    organizer:
      "وزارة الشؤون الإسلامية — إدارة مساجد محافظة الفروانية — جمعية الهداية الخيرية (قسم الدعوة والإرشاد)",
    day: "الاثنين",
    date: "2026-06-29",
    time: "بعد صلاة المغرب",
    mosque: "مسجد محمد الحبيب",
    region: "خيطان",
    governorate: "الفروانية",
    contactPhone: "60789104",
    socialHandle: "@dwhedayakew",
    notes: [
      "جميع الدروس بعد صلاة المغرب.",
      "سيتم بث الأنشطة عبر حسابات الجمعية.",
    ],
    tags: ["درس", "ملتقى", "حضوري", "بث"],
    kind: "one_time",
  },
  {
    id: "sci-ijazati-taah-5",
    announcementTitle: "ملتقى إجازتي طاعة",
    lessonTitle: "حياة القلوب",
    sheikh: "بندر محمد الميموني",
    organizer:
      "وزارة الشؤون الإسلامية — إدارة مساجد محافظة الفروانية — جمعية الهداية الخيرية (قسم الدعوة والإرشاد)",
    day: "الثلاثاء",
    date: "2026-06-30",
    time: "بعد صلاة المغرب",
    mosque: "مسجد مجاهد بن جبر",
    region: "الرحاب",
    governorate: "الفروانية",
    contactPhone: "60789104",
    socialHandle: "@dwhedayakew",
    notes: [
      "جميع الدروس بعد صلاة المغرب.",
      "سيتم بث الأنشطة عبر حسابات الجمعية.",
    ],
    tags: ["درس", "ملتقى", "حضوري", "بث"],
    kind: "one_time",
  },
  {
    id: "sci-talae-alilm-murtaqaa",
    announcementTitle: "طلائع العلم",
    lessonTitle: "دورة إلكترونية لطلاب العلم المبتدئين",
    sheikh: "د. مطلق جاسر مطلق الجاسر",
    organizer: "منصة معهد مرتقى — جمعية مرتقى العلمية",
    date: "2024-04-18",
    registrationUrl: "https://www.academy.murtaqaa.com/groups/talayiea-alealm/",
    websiteUrl: "https://www.academy.murtaqaa.com",
    socialHandle: "@murtaqaa",
    notes: [
      "8 متون في 8 علوم خلال شهرين (حسب الإعلان الأصلي).",
      "الدراسة مجانية عن بُعد — الدروس مسجلة.",
      "متابعة يومية على التلغرام.",
      "شهادة بعد اجتياز كل متن بنجاح.",
      "جميع متون الدورة متاحة بصيغة PDF.",
      "المتون: تفسير الفاتحة والمعوذات، من جوامع كلم النبي ﷺ، القول السديد، المسائل الفقهية للشيخ عبدالله بن خلف الدحيان، قصيدة السير إلى الله، الأرجوزة الميئية في السيرة، منظومة درة الطالب، مكارم الأخلاق لابن عثيمين.",
    ],
    tags: ["دورة", "إلكتروني", "مجاني", "شهادة", "مبتدئ"],
    kind: "online_course",
  },
];
