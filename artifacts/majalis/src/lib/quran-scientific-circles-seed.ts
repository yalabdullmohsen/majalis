import type { QuranScientificCircle } from "./quran-scientific-circles-types";
import { SCIENTIFIC_ANNOUNCEMENTS } from "./scientific-announcements-seed";

const PUBLIC_STATUSES = new Set([
  "published",
  "registration_open",
  "registration_closed",
  "ongoing",
]);

function mapAnnouncementToCircle(a: (typeof SCIENTIFIC_ANNOUNCEMENTS)[0]): QuranScientificCircle {
  const isOnline = a.kind === "online_course";
  const tabGroup =
    a.tags.some((t) => ["فقه", "عقيدة", "حديث", "تفسير"].includes(t))
      ? "sharia"
      : a.bookTitle
        ? "mutoon"
        : "quran";

  const subcategory =
    tabGroup === "mutoon"
      ? a.bookTitle?.includes("عمدة")
        ? "umdat-ahkam"
        : a.bookTitle?.includes("بلوغ")
          ? "bulugh-maram"
          : undefined
      : tabGroup === "sharia"
        ? a.tags.includes("عقيدة")
          ? "aqeeda-course"
          : a.tags.includes("فقه")
            ? "fiqh-course"
            : "taseel"
        : undefined;

  const womenNote = a.notes.some((n) => n.includes("نساء") || n.includes("نسخ"));
  const gender = womenNote && a.notes.some((n) => n.includes("رجال")) ? "عام" : womenNote ? "نساء" : "رجال";

  return {
    id: `qsc-${a.id}`,
    external_key: a.id,
    title: a.lessonTitle,
    summary: a.announcementTitle,
    description: [a.bookTitle, a.bookAuthor].filter(Boolean).join(" — "),
    tab_group: tabGroup as QuranScientificCircle["tab_group"],
    subcategory_slug: subcategory,
    circle_type: tabGroup === "quran" ? "مراجعة" : tabGroup === "mutoon" ? "حفظ متون" : "دراسة شرعية",
    country: "الكويت",
    governorate: a.governorate !== "غير محدد" ? a.governorate : undefined,
    region: a.region,
    venue_name: a.mosque || a.venue,
    organizer: a.organizer,
    sheikh_name: a.sheikh,
    gender_access: gender,
    target_audience: gender,
    level: a.kind === "online_course" ? "مبتدئ" : "عام",
    days: a.day ? [a.day] : a.recurrenceDay ? [a.recurrenceDay] : [],
    start_date: a.date,
    lesson_time: a.time,
    has_live: Boolean(a.liveUrl || a.broadcastLinks?.length),
    has_attendance: !isOnline,
    is_online: isOnline,
    registration_url: a.registrationUrl,
    contact_phone: a.contactPhone,
    whatsapp_url: a.broadcastLinks?.find((l) => l.url.includes("wa.me"))?.url,
    map_url: a.mapUrl,
    announcement_url: a.websiteUrl || a.liveUrl,
    poster_image_url: a.posterImage,
    notes: a.notes.join("\n"),
    has_certificate: a.tags.includes("شهادة"),
    has_ijazah: false,
    is_free: true,
    status: "review",
    registration_status: a.registrationUrl ? "open" : "soon",
    view_count: 0,
    keywords: a.tags,
    data_incomplete: !a.mosque && !a.venue && !isOnline,
    created_at: "2026-06-01T00:00:00Z",
    updated_at: "2026-06-20T00:00:00Z",
  };
}

const KUWAIT_QURAN_CIRCLES: QuranScientificCircle[] = [
  {
    id: "qsc-kuwait-hifz-capital",
    external_key: "kuwait-hifz-capital",
    title: "حلقة حفظ القرآن — العاصمة",
    summary: "حلقة أسبوعية لحفظ ومراجعة القرآن الكريم",
    description:
      "برنامج منظم لحفظ القرآن ومراجعة الأجزاء مع متابعة فردية. يُرجى التحقق من الموعد والمكان قبل الحضور.",
    tab_group: "quran",
    subcategory_slug: "hifz-new",
    circle_type: "حفظ جديد",
    country: "الكويت",
    governorate: "العاصمة",
    region: "الدسمة",
    venue_name: "مسجد",
    organizer: "جمعية خيرية — يُحدَّد عند التحقق",
    sheikh_name: "يُحدَّد عند التحقق",
    gender_access: "رجال",
    target_audience: "رجال",
    level: "مبتدئ — متوسط",
    days: ["السبت"],
    lesson_time: "بعد صلاة العصر",
    has_attendance: true,
    is_online: false,
    is_free: true,
    status: "published",
    registration_status: "open",
    view_count: 42,
    keywords: ["حفظ", "مراجعة", "الكويت", "حضوري"],
    created_at: "2026-05-15T00:00:00Z",
    updated_at: "2026-06-18T00:00:00Z",
  },
  {
    id: "qsc-kuwait-tajweed-online",
    external_key: "kuwait-tajweed-online",
    title: "دورة تجويد عن بُعد — الكويت",
    summary: "أساسيات التجويد للمبتدئين عبر الإنترنت",
    description: "دورة تجويد تأسيسية عن بُعد مع تمارين تطبيقية. البيانات التفصيلية قيد التحقق.",
    tab_group: "quran",
    subcategory_slug: "tajweed",
    circle_type: "تجويد",
    country: "الكويت",
    governorate: "العاصمة",
    organizer: "مركز قرآني — يُحدَّد عند التحقق",
    gender_access: "عام",
    target_audience: "عام",
    level: "مبتدئ",
    days: ["الاثنين", "الأربعاء"],
    lesson_time: "8:00 مساءً",
    has_live: true,
    has_attendance: false,
    is_online: true,
    is_free: true,
    status: "registration_open",
    registration_status: "open",
    view_count: 88,
    keywords: ["تجويد", "عن بعد", "مجاني"],
    created_at: "2026-06-01T00:00:00Z",
    updated_at: "2026-06-22T00:00:00Z",
  },
  {
    id: "qsc-kuwait-mutoon-arbaeen",
    external_key: "kuwait-mutoon-arbaeen",
    title: "حلقة حفظ الأربعون النووية",
    summary: "حفظ ومراجعة متن الأربعين النووية",
    tab_group: "mutoon",
    subcategory_slug: "nawawi40",
    circle_type: "حفظ متون",
    country: "الكويت",
    governorate: "الفروانية",
    region: "الرابية",
    venue_name: "مسجد",
    organizer: "حلقة علمية محلية",
    gender_access: "رجال",
    level: "مبتدئ",
    days: ["الجمعة"],
    lesson_time: "بعد صلاة المغرب",
    has_attendance: true,
    is_free: true,
    status: "published",
    registration_status: "open",
    view_count: 31,
    keywords: ["متون", "الأربعون النووية", "حديث"],
    created_at: "2026-05-20T00:00:00Z",
    updated_at: "2026-06-19T00:00:00Z",
  },
  {
    id: "qsc-kuwait-sharia-taseel",
    external_key: "kuwait-sharia-taseel",
    title: "برنامج تأصيل علمي — الكويت",
    summary: "مسار تأصيلي في العلوم الشرعية",
    tab_group: "sharia",
    subcategory_slug: "taseel",
    circle_type: "برنامج تأصيلي",
    country: "الكويت",
    governorate: "حولي",
    organizer: "معهد علمي — يُحدَّد عند التحقق",
    gender_access: "رجال",
    level: "متوسط — متقدم",
    duration_text: "سنة دراسية",
    has_attendance: true,
    is_free: false,
    status: "registration_open",
    registration_status: "soon",
    view_count: 56,
    keywords: ["تأصيل", "دراسة شرعية", "الكويت"],
    created_at: "2026-06-10T00:00:00Z",
    updated_at: "2026-06-23T00:00:00Z",
  },
  {
    id: "qsc-kuwait-women-hifz",
    external_key: "kuwait-women-hifz",
    title: "حلقة حفظ للنساء — الفروانية",
    summary: "حلقة نسائية لحفظ القرآن ومراجعة الأجزاء",
    tab_group: "quran",
    subcategory_slug: "women",
    circle_type: "حلقات نساء",
    country: "الكويت",
    governorate: "الفروانية",
    region: "جليب الشيوخ",
    gender_access: "نساء",
    target_audience: "نساء",
    level: "جميع المستويات",
    days: ["الأحد"],
    lesson_time: "10:00 صباحًا",
    has_attendance: true,
    is_free: true,
    status: "published",
    registration_status: "open",
    view_count: 67,
    keywords: ["نساء", "حفظ", "الكويت"],
    created_at: "2026-06-05T00:00:00Z",
    updated_at: "2026-06-21T00:00:00Z",
  },
  {
    id: "qsc-kuwait-children-hifz",
    external_key: "kuwait-children-hifz",
    title: "حلقة تحفيظ أطفال — الأحمدي",
    summary: "برنامج تحفيظ للناشئة مع متابعة أسبوعية",
    tab_group: "quran",
    subcategory_slug: "children",
    circle_type: "حلقات أطفال",
    country: "الكويت",
    governorate: "الأحمدي",
    region: "صباح الأحمد",
    gender_access: "أطفال",
    target_audience: "أطفال",
    level: "مبتدئ",
    days: ["الثلاثاء", "الخميس"],
    lesson_time: "4:30 مساءً",
    has_attendance: true,
    is_free: true,
    status: "registration_open",
    registration_status: "open",
    view_count: 45,
    keywords: ["أطفال", "تحفيظ", "الكويت"],
    created_at: "2026-06-08T00:00:00Z",
    updated_at: "2026-06-22T00:00:00Z",
  },
];

const OPPORTUNITY_TEMPLATES: QuranScientificCircle[] = [
  {
    id: "qsc-opp-kuwait-institute",
    external_key: "opp-kuwait-institute",
    title: "معهد علوم شرعية — الكويت",
    summary: "برنامج دراسي شرعي منظم — يُرجى مراجعة الجهة الرسمية",
    tab_group: "opportunities",
    subcategory_slug: "institute",
    circle_type: "معاهد",
    country: "الكويت",
    level: "متوسط",
    is_online: false,
    is_free: false,
    status: "review",
    registration_status: "soon",
    data_incomplete: true,
    keywords: ["معهد", "الكويت", "دراسة شرعية"],
    created_at: "2026-06-01T00:00:00Z",
    updated_at: "2026-06-01T00:00:00Z",
  },
  {
    id: "qsc-opp-saudi-university",
    external_key: "opp-saudi-university",
    title: "فرص دراسة الشريعة — السعودية",
    summary: "قائمة مرجعية لبرامج جامعية — قيد المراجعة والتحديث",
    tab_group: "opportunities",
    subcategory_slug: "university",
    circle_type: "جامعات",
    country: "السعودية",
    is_online: true,
    status: "review",
    registration_status: "soon",
    data_incomplete: true,
    keywords: ["جامعة", "السعودية", "عن بعد"],
    created_at: "2026-06-01T00:00:00Z",
    updated_at: "2026-06-01T00:00:00Z",
  },
];

export const QURAN_SCIENTIFIC_CIRCLES_SEED: QuranScientificCircle[] = [
  ...KUWAIT_QURAN_CIRCLES,
  ...SCIENTIFIC_ANNOUNCEMENTS.map(mapAnnouncementToCircle),
  ...OPPORTUNITY_TEMPLATES,
];

export function findCircleById(id: string): QuranScientificCircle | undefined {
  return QURAN_SCIENTIFIC_CIRCLES_SEED.find((c) => c.id === id || c.external_key === id);
}

export function getPublicSeedCircles(): QuranScientificCircle[] {
  return QURAN_SCIENTIFIC_CIRCLES_SEED.filter((c) => PUBLIC_STATUSES.has(c.status));
}
