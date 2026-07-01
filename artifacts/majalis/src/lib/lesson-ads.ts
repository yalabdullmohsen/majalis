/** DEV/INSTALL ONLY — Production content must come from Supabase (see production-config.ts). */
export type LessonSession = {
  label: string;
  day: string;
  time: string;
  venue: string;
  district: string;
  mapUrl?: string;
  liveUrl?: string;
  referenceUrl?: string;
  note?: string;
};

export type LessonAdCategory = "weekly" | "program" | "course";

export type LessonAd = {
  id: string;
  provider: string;
  teacher: string;
  teacherImage: string;
  posterImage?: string;
  title: string;
  shortDescription: string;
  category: LessonAdCategory;
  tags: string[];
  hasWomenSection?: boolean;
  startDate?: string;
  detailIntro?: string;
  sessions: LessonSession[];
};

export const CATEGORY_LABELS: Record<LessonAdCategory, string> = {
  weekly: "درس أسبوعي",
  program: "برنامج تعليمي",
  course: "دورة علمية",
};

export const lessonAds: LessonAd[] = [
  {
    id: "othman-tafsir-nahl",
    provider: "الموقع الرسمي للشيخ عثمان الخميس",
    teacher: "د. عثمان بن محمد الخميس",
    teacherImage: "/sheikhs/othman-alkhamees.jpg",
    posterImage: "/images/posters/othman-tafsir-nahl.svg",
    title: "تفسير سورة النحل",
    shortDescription:
      "درس أسبوعي ثابت، والمتابعة الحالية تبدأ من الآية 40.",
    category: "weekly",
    tags: ["تفسير", "أسبوعي", "حضوري", "بث مباشر"],
    hasWomenSection: true,
    detailIntro:
      "درس التفسير الأسبوعي الثابت. عنوان البطاقة هو اسم الدرس، ورقم الآية الحالية يُعرض كتحديث فرعي.",
    sessions: [
      {
        label: "المجلس الأسبوعي",
        day: "الجمعة",
        time: "بعد صلاة المغرب",
        venue: "مسجد موضي",
        district: "منطقة الصديق – قطعة 4 – شارع 407",
        mapUrl: "https://maps.app.goo.gl/4EjbJEgGmsnGWENBA",
        liveUrl: "https://reach.link/othmanalkhamees",
        referenceUrl: "https://quran.com/16",
        note: "المتابعة الحالية: البداية من الآية رقم 40.",
      },
    ],
  },
  {
    id: "othman-sahih-muslim",
    provider: "الموقع الرسمي للشيخ عثمان الخميس",
    teacher: "د. عثمان بن محمد الخميس",
    teacherImage: "/sheikhs/othman-alkhamees.jpg",
    posterImage: "/images/posters/othman-sahih-muslim.svg",
    title: "قراءة كتاب صحيح مسلم",
    shortDescription:
      "درس أسبوعي ثابت، والمتابعة الحالية تبدأ من الحديث 989 عند الصفحة 400.",
    category: "weekly",
    tags: ["حديث", "أسبوعي", "حضوري", "بث مباشر"],
    hasWomenSection: true,
    detailIntro:
      "درس قراءة كتاب ثابت. يُعرض بشكل دائم مع تحديث المرحلة الحالية فقط.",
    sessions: [
      {
        label: "المجلس الأسبوعي",
        day: "السبت",
        time: "10:00 صباحًا",
        venue: "مسجد الياقوت",
        district: "منطقة الصديق – قطعة 7 – شارع 706",
        mapUrl: "https://maps.app.goo.gl/5Bwe3w794cvREzGG8",
        liveUrl: "https://reach.link/othmanalkhamees",
        referenceUrl:
          "https://drive.google.com/file/d/1Q4vXEi5PCx0n0BMMWDnzzhYul_mYqp9A/view?usp=sharing",
        note: "المتابعة الحالية: الحديث 989 – الصفحة 400.",
      },
    ],
  },
  {
    id: "othman-talkhis-mukhtasar-almuqni",
    provider: "الموقع الرسمي للشيخ عثمان الخميس",
    teacher: "د. عثمان بن محمد الخميس",
    teacherImage: "/sheikhs/othman-alkhamees.jpg",
    posterImage: "/images/posters/othman-talkhis-almuqni.svg",
    title: "شرح كتاب تلخيص مختصر المقنع",
    shortDescription:
      "درس أسبوعي ثابت. آخر التحديثات: «المحرمات إلى أمد» و«باب الشروط في النكاح – القسم الثاني».",
    category: "weekly",
    tags: ["فقه", "أسبوعي", "حضوري", "بث مباشر"],
    hasWomenSection: true,
    detailIntro:
      "العنوان الثابت هو اسم الكتاب. مرحلة الدرس الحالية تُعرض كتحديث فرعي داخل التفاصيل.",
    sessions: [
      {
        label: "المجلس الأسبوعي",
        day: "الأربعاء",
        time: "بعد صلاة المغرب",
        venue: "مسجد الياقوت",
        district: "منطقة الصديق – قطعة 7 – شارع 706",
        mapUrl: "https://maps.app.goo.gl/5Bwe3w794cvREzGG8",
        liveUrl: "https://reach.link/othmanalkhamees",
        referenceUrl:
          "https://drive.google.com/file/d/1CBoQ8zTL8OvI2GKhbCeUh_O_C7DZJRaM/view",
        note:
          "آخر التحديثات الظاهرة في المواد: «المحرمات إلى أمد» ثم «باب الشروط في النكاح – القسم الثاني».",
      },
    ],
  },
  {
    id: "rashed-fundamental-course",
    provider: "إدارة مساجد الجهراء – المراقبة الثقافية",
    teacher: "د. راشد صليهم فهد الصليهم",
    teacherImage: "/sheikhs/rashed-alsulayyim.svg",
    posterImage: "/images/posters/rashed-fundamental-course.svg",
    title: "الدورة العلمية التأصيلية",
    shortDescription: "برنامج علمي أسبوعي بثلاث جلسات متتابعة في اليوم نفسه.",
    category: "course",
    tags: ["دورة علمية", "عقيدة", "حديث", "سنة", "حضوري"],
    detailIntro:
      "برنامج دورة أسبوعية بثلاث جلسات في اليوم العلمي نفسه.",
    sessions: [
      {
        label: "بلوغ المرام من أدلة الأحكام",
        day: "الاثنين",
        time: "قبل المغرب بساعة – 6:00 م",
        venue: "مسجد أبي واقد الليثي",
        district: "القيروان – قطعة 2",
        mapUrl: "https://goo.gl/maps/65SD8fH7smhudxTP9",
        note: "الجلسة الأولى من اليوم العلمي.",
      },
      {
        label: "القواعد المثلى في صفات الله وأسمائه الحسنى",
        day: "الاثنين",
        time: "وقت المغرب – 7:20 م",
        venue: "مسجد أبي واقد الليثي",
        district: "القيروان – قطعة 2",
        mapUrl: "https://goo.gl/maps/65SD8fH7smhudxTP9",
        note: "الجلسة الثانية من اليوم العلمي.",
      },
      {
        label: "قراءة في كتاب دعوى تعارض السنة النبوية مع العلم التجريبي",
        day: "الاثنين",
        time: "بعد العشاء – 8:50 م",
        venue: "مسجد أبي واقد الليثي",
        district: "القيروان – قطعة 2",
        mapUrl: "https://goo.gl/maps/65SD8fH7smhudxTP9",
        note: "الجلسة الثالثة من اليوم العلمي.",
      },
    ],
  },
  {
    id: "mansour-altafsir-alwadih",
    provider: "دروس الكويت",
    teacher: "د. منصور بن ناصر الخالدي",
    teacherImage: "/sheikhs/mansour-alkhalidi.jpg",
    posterImage: "/images/posters/mansour-friday-reading.svg",
    title: "قراءة كتب متنوعة والتفسير الواضح",
    shortDescription:
      "مجلس أسبوعي بعد الفجر بصيغة قراءة وتعليق، مع مكان مخصص للنساء.",
    category: "weekly",
    tags: ["تفسير", "قراءة", "جمعة", "حضوري"],
    hasWomenSection: true,
    detailIntro:
      "مجلس أسبوعي على نهج السلف الصالح. التفاصيل الكاملة للموقع والوقت داخل البطاقة.",
    sessions: [
      {
        label: "المجلس الأسبوعي",
        day: "الجمعة",
        time: "بعد صلاة الفجر",
        venue: "مسجد العلاء بن عقبة",
        district: "منطقة الفردوس – قطعة 3 – بجانب الجمعية الرئيسية",
        mapUrl: "https://maps.google.com/?q=29.283262219859182,47.873629180186754",
        note: "يوجد مكان مخصص للنساء.",
      },
    ],
  },
  {
    id: "osama-shatti-prayer-book",
    provider: "منصة الأندلس التعليمية",
    teacher: "الشيخ أسامة الشطي",
    teacherImage: "/sheikhs/osama-alshatti.svg",
    posterImage: "/images/posters/osama-shatti-prayer-book.svg",
    title: "شرح كتاب الصلاة من إعانة الطالب",
    shortDescription:
      "برنامج من برامج إرشاد المتعلم، حضوري في المسجد، مع نقل مباشر عبر معهد الأندلس.",
    category: "program",
    tags: ["فقه", "برنامج تعليمي", "حضوري", "بث مباشر"],
    startDate: "2026-06-09",
    detailIntro:
      "برنامج تعليمي من منصة الأندلس، وليس منشورًا موسميًا عابرًا.",
    sessions: [
      {
        label: "البرنامج الأسبوعي",
        day: "الثلاثاء",
        time: "من 6:00 مساءً إلى صلاة العشاء",
        venue: "مسجد أحمد العميري",
        district: "الكويت",
        liveUrl: "https://www.andlous.com",
        referenceUrl: "https://www.andlous.com",
        note:
          "ابتداءً من يوم الثلاثاء 2026/06/09، مع نقل مباشر عبر قناة معهد الأندلس الشرعي في تليجرام.",
      },
    ],
  },
  // ── سالم بن سعد الطويل — برنامج الدروس العلمية (1447/11/16) ─────────────
  {
    id: "salem-altaweel-tawheed-bukhari",
    provider: "www.saltaweel.com",
    teacher: "سالم بن سعد الطويل",
    teacherImage: "/sheikhs/salem-altaweel.jpg",
    title: "شرح كتاب التوحيد من صحيح البخاري",
    shortDescription: "شرح كتاب التوحيد من صحيح البخاري للعلامة محمد بن صالح العثيمين — كل أحد 8:30 مساءً، مع بث مباشر.",
    category: "weekly",
    tags: ["عقيدة", "حديث", "أسبوعي", "حضوري", "بث مباشر"],
    sessions: [
      {
        label: "المجلس الأسبوعي",
        day: "الأحد",
        time: "8:30 مساءً",
        venue: "ديوان أحمد غربي الشمري",
        district: "جنوب عبدالله المبارك – ق5 مقابل الدائري السابع",
        liveUrl: "https://www.saltaweel.com",
        referenceUrl: "https://www.saltaweel.com",
        note: "المؤلف: العلامة محمد بن صالح العثيمين",
      },
    ],
  },
  {
    id: "salem-altaweel-tanbih-alafham",
    provider: "www.saltaweel.com",
    teacher: "سالم بن سعد الطويل",
    teacherImage: "/sheikhs/salem-altaweel.jpg",
    title: "شرح كتاب تنبيه الأفهام بشرح عمدة الأحكام",
    shortDescription: "شرح تنبيه الأفهام بشرح عمدة الأحكام للعلامة العثيمين — كل اثنين 8:30 مساءً، مع بث مباشر.",
    category: "weekly",
    tags: ["فقه", "حديث", "أسبوعي", "حضوري", "بث مباشر"],
    sessions: [
      {
        label: "المجلس الأسبوعي",
        day: "الاثنين",
        time: "8:30 مساءً",
        venue: "ديوان مشعل الجنفاوي",
        district: "سعد العبدالله – ق11 – ش167 – م45",
        liveUrl: "https://www.saltaweel.com",
        referenceUrl: "https://www.saltaweel.com",
        note: "المؤلف: العلامة محمد بن صالح العثيمين",
      },
    ],
  },
  {
    id: "salem-altaweel-mukhtasar-tafsir",
    provider: "www.saltaweel.com",
    teacher: "سالم بن سعد الطويل",
    teacherImage: "/sheikhs/salem-altaweel.jpg",
    title: "المختصر في تفسير القرآن الكريم",
    shortDescription: "شرح كتاب المختصر في تفسير القرآن الكريم لجماعة من علماء التفسير — كل ثلاثاء 8:45 مساءً، مع بث مباشر.",
    category: "weekly",
    tags: ["تفسير", "أسبوعي", "حضوري", "بث مباشر"],
    sessions: [
      {
        label: "المجلس الأسبوعي",
        day: "الثلاثاء",
        time: "8:45 مساءً",
        venue: "مدينة صباح الأحمد",
        district: "صباح الأحمد – ق2 – ش227 – م382",
        liveUrl: "https://www.saltaweel.com",
        referenceUrl: "https://www.saltaweel.com",
        note: "الدواوين خلف المنزل. المؤلف: جماعة من علماء التفسير",
      },
    ],
  },
  {
    id: "salem-altaweel-ajwiba-sunniyah",
    provider: "www.saltaweel.com",
    teacher: "سالم بن سعد الطويل",
    teacherImage: "/sheikhs/salem-altaweel.jpg",
    title: "شرح كتاب الأجوبة السنيّة في العقيدة السلفية",
    shortDescription: "شرح الأجوبة السنية للشيخ عمر العمر — كل أربعاء مرة كل أسبوعين، 8:30 مساءً، مع بث مباشر.",
    category: "weekly",
    tags: ["عقيدة", "أسبوعي", "حضوري", "بث مباشر"],
    sessions: [
      {
        label: "يُعقد مرة كل أسبوعين",
        day: "الأربعاء",
        time: "8:30 مساءً",
        venue: "ديوان الطرجم",
        district: "الفنيطيس – شارع الغوص – بجانب مبرة العوازم الخيرية",
        liveUrl: "https://www.saltaweel.com",
        referenceUrl: "https://www.saltaweel.com",
        note: "المؤلف: الشيخ عمر العمر. يُعقد مرة كل أسبوعين.",
      },
    ],
  },
  // ── حسين بن مبارك المويزري ─────────────────────────────────────────────
  {
    id: "hussain-almuwaiziri-rawdat-alafham",
    provider: "دروس الكويت",
    teacher: "الشيخ حسين بن مبارك المويزري",
    teacherImage: "/sheikhs/hussain-almuwaiziri.jpg",
    title: "شرح روضة الأفهام في زوائد المحرر على بلوغ المرام",
    shortDescription: "درس أسبوعي في شرح كتاب روضة الأفهام — شرح موسّع لزوائد المحرر على بلوغ المرام.",
    category: "weekly",
    tags: ["حديث", "فقه", "أسبوعي", "حضوري"],
    sessions: [
      {
        label: "المجلس الأسبوعي",
        day: "الجمعة",
        time: "بعد صلاة العشاء",
        venue: "مسجد بالكويت",
        district: "الكويت",
      },
    ],
  },
  // ── حامد علي المسعد ────────────────────────────────────────────────────
  {
    id: "hamed-almasad-tazkiyah",
    provider: "دروس الكويت",
    teacher: "حامد علي المسعد",
    teacherImage: "/sheikhs/hamed-almasad.jpg",
    title: "القرآن ربيع القلوب — دروس التزكية والوعظ",
    shortDescription: "محاضرات تربوية دورية في تزكية النفس وصلاح القلب من خلال القرآن الكريم.",
    category: "weekly",
    tags: ["تزكية", "وعظ", "قرآن", "حضوري"],
    sessions: [
      {
        label: "المجلس الأسبوعي",
        day: "الثلاثاء",
        time: "بعد صلاة المغرب",
        venue: "مسجد بالكويت",
        district: "الكويت",
      },
    ],
  },
  // ── نصار خالد العجمي ───────────────────────────────────────────────────
  {
    id: "nassar-alajmi-tarbiyah",
    provider: "دروس الكويت",
    teacher: "نصار خالد نصار العجمي",
    teacherImage: "/sheikhs/nassar-alajmi.jpg",
    title: "ليس في العمر إجازة — دروس التربية والدعوة",
    shortDescription: "محاضرات تربوية تُركز على الجانب التزكوي وبناء الشخصية المسلمة.",
    category: "weekly",
    tags: ["وعظ", "تربية", "دعوة", "حضوري"],
    sessions: [
      {
        label: "المجلس الأسبوعي",
        day: "الاثنين",
        time: "بعد صلاة العشاء",
        venue: "مسجد بالكويت",
        district: "الكويت",
      },
    ],
  },
  // ── بندر محمد الميموني ─────────────────────────────────────────────────
  {
    id: "bandar-almaymuni-raqaiq",
    provider: "دروس الكويت",
    teacher: "بندر محمد الميموني",
    teacherImage: "/sheikhs/bandar-almaymuni.jpg",
    title: "حياة القلوب — دروس الرقائق",
    shortDescription: "محاضرات متخصصة في الرقائق وأحوال القلوب وتجديد الإيمان.",
    category: "weekly",
    tags: ["تزكية", "رقائق", "قلوب", "حضوري"],
    sessions: [
      {
        label: "المجلس الأسبوعي",
        day: "الأربعاء",
        time: "بعد صلاة المغرب",
        venue: "مسجد بالكويت",
        district: "الكويت",
      },
    ],
  },
  // ── سعد هزاع العتيبي ───────────────────────────────────────────────────
  {
    id: "saad-alutaibi-thabaat",
    provider: "دروس الكويت",
    teacher: "سعد هزاع العتيبي",
    teacherImage: "/sheikhs/saad-alutaibi.jpg",
    title: "الثبات حتى الممات",
    shortDescription: "محاضرات في الثبات على الدين والتثبيت في وجه الفتن.",
    category: "weekly",
    tags: ["وعظ", "ثبات", "دعوة", "حضوري"],
    sessions: [
      {
        label: "المجلس الأسبوعي",
        day: "الخميس",
        time: "بعد صلاة العشاء",
        venue: "مسجد بالكويت",
        district: "الكويت",
      },
    ],
  },
  // ── فيصل زويد ─────────────────────────────────────────────────────────
  {
    id: "faisal-zuwaid-tazkiyah",
    provider: "دروس الكويت",
    teacher: "فيصل زويد",
    teacherImage: "/sheikhs/faisal-zuwaid.jpg",
    title: "إلا من أتى بقلب سليم — دروس تزكية النفس",
    shortDescription: "دروس في تزكية النفس وصلاح القلب والتقرب إلى الله.",
    category: "weekly",
    tags: ["تزكية", "وعظ", "قلوب", "حضوري"],
    sessions: [
      {
        label: "المجلس الأسبوعي",
        day: "الأحد",
        time: "بعد صلاة المغرب",
        venue: "مسجد بالكويت",
        district: "الكويت",
      },
    ],
  },
  // ── د. دهام أبو خشبة ──────────────────────────────────────────────────
  {
    id: "daham-abu-khashabah-umdah",
    provider: "دروس الكويت",
    teacher: "د. دهام أبو خشبة",
    teacherImage: "/sheikhs/daham-abu-khashabah.jpg",
    title: "شرح عمدة الأحكام",
    shortDescription: "درس أسبوعي في شرح عمدة الأحكام من كلام خير الأنام لابن قدامة.",
    category: "weekly",
    tags: ["فقه", "حديث", "أسبوعي", "حضوري"],
    sessions: [
      {
        label: "المجلس الأسبوعي",
        day: "الجمعة",
        time: "بعد صلاة الفجر",
        venue: "مسجد بالكويت",
        district: "الكويت",
      },
    ],
  },
  // ── د. محمد ضاوي العصيمي ──────────────────────────────────────────────
  {
    id: "dawwi-alusaimi-weekly",
    provider: "الموقع الرسمي لد. محمد ضاوي العصيمي",
    teacher: "د. محمد ضاوي العصيمي",
    teacherImage: "/images/posters/fadat-dawwi-al-usaimi.svg",
    posterImage: "/images/posters/fadat-dawwi-al-usaimi.svg",
    title: "درس الفقه والتزكية الأسبوعي",
    shortDescription: "درس أسبوعي في الفقه وأصوله والوعظ والتزكية لأستاذ مشارك في كلية الشريعة بجامعة الكويت.",
    category: "weekly",
    tags: ["فقه", "أصول الفقه", "وعظ", "تزكية", "أسبوعي", "حضوري"],
    sessions: [
      {
        label: "المجلس الأسبوعي",
        day: "الجمعة",
        time: "بعد صلاة الفجر",
        venue: "مسجد بالكويت",
        district: "الكويت",
        referenceUrl: "https://dr-alossimi.com",
      },
    ],
  },
  // ── د. مطلق جاسر الجاسر ───────────────────────────────────────────────
  {
    id: "mutlaq-aljasr-talaeea-elm",
    provider: "دورة طلائع العلم",
    teacher: "د. مطلق جاسر مطلق الجاسر",
    teacherImage: "/sheikhs/mutlaq-aljasr.jpg",
    title: "دورة طلائع العلم لطلاب العلم المبتدئين",
    shortDescription: "دورة إلكترونية متكاملة لتأهيل طلاب العلم المبتدئين على منهج علمي أصيل.",
    category: "course",
    tags: ["طلب العلم", "تأصيل", "دورة علمية", "بث مباشر"],
    sessions: [
      {
        label: "الدورة الإلكترونية",
        day: "الإثنين",
        time: "بعد صلاة العشاء",
        venue: "إلكتروني",
        district: "الكويت",
      },
    ],
  },
];

export type LessonAdFilters = {
  teacher?: string;
  venue?: string;
  district?: string;
  day?: string;
  category?: string;
};

const CATEGORY_SORT: Record<LessonAdCategory, number> = {
  weekly: 1,
  program: 2,
  course: 3,
};

export function sortLessonAds(items: LessonAd[] = lessonAds) {
  return [...items].sort((a, b) => CATEGORY_SORT[a.category] - CATEGORY_SORT[b.category]);
}

export function getLessonAdById(id: string) {
  return lessonAds.find((item) => item.id === id);
}

export function filterLessonAds(items: LessonAd[], filters: LessonAdFilters) {
  return items.filter((item) => {
    const session = item.sessions[0];
    if (!session) return false;

    if (filters.teacher && filters.teacher !== "الكل" && item.teacher !== filters.teacher) {
      return false;
    }
    if (filters.venue && filters.venue !== "الكل" && session.venue !== filters.venue) {
      return false;
    }
    if (filters.district && filters.district !== "الكل" && session.district !== filters.district) {
      return false;
    }
    if (filters.day && filters.day !== "الكل" && !item.sessions.some((s) => s.day === filters.day)) {
      return false;
    }
    if (
      filters.category &&
      filters.category !== "الكل" &&
      CATEGORY_LABELS[item.category] !== filters.category
    ) {
      return false;
    }
    return true;
  });
}

export function getLessonAdFilterOptions(items: LessonAd[] = lessonAds) {
  const uniq = (values: string[]) =>
    ["الكل", ...Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, "ar"))];

  return {
    teachers: uniq(items.map((item) => item.teacher)),
    venues: uniq(items.flatMap((item) => item.sessions.map((session) => session.venue))),
    districts: uniq(items.flatMap((item) => item.sessions.map((session) => session.district))),
    days: uniq(items.flatMap((item) => item.sessions.map((session) => session.day))),
    categories: uniq(items.map((item) => CATEGORY_LABELS[item.category])),
  };
}

export function getCurrentProgressNote(item: LessonAd) {
  return item.sessions.find((session) => session.note)?.note;
}
