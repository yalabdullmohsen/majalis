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
    governorate: "الفروانية",
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
    id: "sci-fadat-dawwi-al-usaimi",
    announcementTitle: "درس علمي",
    lessonTitle: "فاضت",
    sheikh: "د. محمد ضاوي العصيمي",
    organizer: "مسجد حصن الصقر",
    day: "الثلاثاء",
    date: "2026-06-30",
    time: "بعد صلاة المغرب مباشرة",
    mosque: "مسجد حصن الصقر",
    region: "الرقعي — بجانب صالة الأفراح",
    governorate: "الفروانية",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=%D9%85%D8%B3%D8%AC%D8%AF+%D8%AD%D8%B5%D9%86+%D8%A7%D9%84%D8%B5%D9%82%D8%B1+%D8%A7%D9%84%D8%B1%D9%82%D8%B9%D9%8A+%D8%A7%D9%84%D9%83%D9%88%D9%8A%D8%AA",
    liveUrl: "https://www.instagram.com/dr_alosimi/",
    posterImage: "/images/posters/fadat-dawwi-al-usaimi.svg",
    notes: [
      "درس إيماني يعالج رقة القلب وزيادة الإيمان وأثر المواعظ في حياة المسلم.",
      "يهدف إلى تذكير المسلم بالله تعالى، وإحياء القلب، وتعظيم مراقبة الله، وترقيق النفس بالكتاب والسنة.",
      "للرجال — يوجد مكان مخصص للنساء.",
      "بث مباشر عبر إنستغرام.",
    ],
    tags: ["إيمان", "رقائق", "تزكية", "وعظ", "درس علمي", "بث مباشر", "حضوري"],
    kind: "one_time",
    broadcastLinks: [{ label: "إنستغرام", url: "https://www.instagram.com/dr_alosimi/" }],
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
  {
    id: "sci-fiqh-ibadat-weekly",
    announcementTitle: "درس أسبوعي في فقه العبادات",
    lessonTitle: "شرح زاد المستقنع",
    sheikh: "د. يوسف بن عبدالله الشبيلي",
    bookTitle: "زاد المستقنع في اختصار المقنع",
    bookAuthor: "الحجاوي",
    day: "الأربعاء",
    time: "9:00 مساءً",
    mosque: "مسجد الإمام أحمد بن حنبل",
    governorate: "الكويت",
    notes: [
      "شرح تفصيلي لكتاب زاد المستقنع يشمل الطهارة والصلاة والزكاة والصيام والحج.",
      "مفتوح للرجال والنساء — يوجد قسم مخصص للنساء.",
      "يُبث مباشرة عبر يوتيوب وتويتر.",
    ],
    tags: ["فقه", "عبادات", "زاد المستقنع", "حنبلي", "أسبوعي"],
    kind: "weekly",
    recurrenceDay: "الأربعاء",
  },
  {
    id: "sci-aqeedah-tawhid-monthly",
    announcementTitle: "حلقة شهرية في العقيدة",
    lessonTitle: "شرح العقيدة الواسطية",
    sheikh: "د. عبدالله بن عبدالرحمن الشثري",
    bookTitle: "العقيدة الواسطية",
    bookAuthor: "شيخ الإسلام ابن تيمية",
    day: "السبت",
    time: "بعد صلاة المغرب",
    mosque: "مسجد البشير الإبراهيمي",
    governorate: "مدينة الكويت",
    notes: [
      "شرح متن الواسطية مع بيان مسائل الأسماء والصفات.",
      "للرجال — مع إمكانية المتابعة عن بعد.",
    ],
    tags: ["عقيدة", "توحيد", "الواسطية", "ابن تيمية", "شهري"],
    kind: "weekly",
    recurrenceDay: "السبت",
  },
  {
    id: "sci-hadith-arbain-nawawi",
    announcementTitle: "شرح الأربعين النووية",
    lessonTitle: "شرح الأربعين حديثاً النووية",
    sheikh: "د. فهد بن صالح العجلان",
    bookTitle: "الأربعون النووية",
    bookAuthor: "الإمام النووي",
    day: "الثلاثاء",
    time: "بعد صلاة العشاء",
    mosque: "المسجد الكبير",
    governorate: "الكويت",
    notes: [
      "شرح أحاديث الأربعين النووية مع استخلاص الفوائد والعبر.",
      "مستوى مناسب للمبتدئين وطلاب العلم على حد سواء.",
      "يُتاح التسجيل للنساء في القاعة المخصصة.",
    ],
    tags: ["حديث", "أربعين نووية", "أسبوعي", "مبتدئ"],
    kind: "weekly",
    recurrenceDay: "الثلاثاء",
  },
  {
    id: "sci-tafsir-ibnek-kathir",
    announcementTitle: "درس أسبوعي في التفسير",
    lessonTitle: "تفسير القرآن الكريم — سورة البقرة",
    sheikh: "د. ناصر بن سليمان العمر",
    bookTitle: "تفسير ابن كثير",
    bookAuthor: "ابن كثير",
    day: "الجمعة",
    time: "بعد صلاة الفجر",
    mosque: "مسجد الجامعة",
    governorate: "الكويت",
    notes: [
      "تفسير تفصيلي يربط الآيات بالواقع المعاصر.",
      "مع شرح مفردات غريب القرآن.",
    ],
    tags: ["تفسير", "قرآن", "ابن كثير", "أسبوعي"],
    kind: "weekly",
    recurrenceDay: "الجمعة",
  },
  {
    id: "sci-arabic-ajurrumiyyah",
    announcementTitle: "دورة اللغة العربية للمبتدئين",
    lessonTitle: "شرح متن الآجرومية في النحو",
    sheikh: "أ. محمد عبدالله الخالدي",
    bookTitle: "الآجرومية",
    bookAuthor: "ابن آجروم",
    day: "الخميس",
    time: "بعد صلاة المغرب",
    mosque: "مركز الدراسات الإسلامية",
    governorate: "الكويت",
    notes: [
      "دورة تأسيسية للمبتدئين في علم النحو.",
      "شرح لقواعد الإعراب والبناء.",
      "مع تطبيقات عملية على نصوص قرآنية.",
    ],
    tags: ["نحو", "عربية", "آجرومية", "مبتدئ", "أسبوعي"],
    kind: "weekly",
    recurrenceDay: "الخميس",
  },
];
