import type { AnnualCourse } from "./platform-types";

export const ANNUAL_COURSES_SEED: AnnualCourse[] = [
  {
    id: "course-ijazah-tahrir-2026",
    external_key: "course-ijazah-tahrir-2026",
    title: "دورة الإجازة في التحرير — 1447هـ",
    summary: "دورة سنوية لإجازة طلاب العلم في متن التحرير في أصول الفقه.",
    body: `**عن الدورة:**
دورة علمية سنوية تُقام لإجازة طلاب العلم في متن «التحرير في أصول الفقه» للإمام ابن تيمية رحمه الله.

**المتون:**
- التحرير في أصول الفقه
- مختصر التحرير

**البرنامج:**
- دروس أسبوعية
- اختبارات شهرية
- مجلس إجازة في ختام الدورة`,
    course_type: "سنوية",
    season: "1447هـ",
    year: 2026,
    sheikh_names: ["د. عثمان الخميس", "د. سالم الطويل"],
    mutoon: ["التحرير في أصول الفقه", "مختصر التحرير"],
    schedule: [
      { day: "السبت", time: "بعد المغرب", topic: "شرح المتن", sheikh: "د. عثمان الخميس" },
      { day: "الثلاثاء", time: "بعد العشاء", topic: "مسائل تطبيقية", sheikh: "د. سالم الطويل" },
    ],
    venue_name: "مسجد الصحابة",
    venue_address: "الجابرية، شارع 10",
    venue_city: "الكويت",
    map_url: "https://maps.google.com/?q=مسجد+الصحابة+الكويت",
    registration_url: "/lessons?tab=courses",
    registration_open: true,
    start_date: "2026-01-15",
    end_date: "2026-12-20",
    keywords: ["إجازة", "تحرير", "أصول", "دورة"],
    status: "approved",
    view_count: 890,
    created_at: "2025-12-01T08:00:00Z",
  },
  {
    id: "course-ramadan-intensive",
    external_key: "course-ramadan-intensive",
    title: "البرنامج العلمي الرمضاني",
    summary: "برنامج موسمي يومي في رمضان — تفسير وحديث وفقه.",
    body: `**البرنامج الرمضاني:**
- تفسير جزء يومياً
- درس حديث بعد العصر
- فقه الصيام والتراويح`,
    course_type: "موسمية",
    season: "رمضان 1447",
    year: 2026,
    sheikh_names: ["د. راشد السليم", "د. منصور الخالدي"],
    mutoon: ["تفسير ابن كثير", "رياض الصالحين"],
    schedule: [
      { day: "يومياً", time: "بعد التراويح", topic: "تفسير", sheikh: "د. راشد السليم" },
      { day: "يومياً", time: "بعد العصر", topic: "حديث", sheikh: "د. منصور الخالدي" },
    ],
    venue_name: "مسجد الإمام مالك",
    venue_city: "الكويت",
    registration_open: true,
    start_date: "2026-02-28",
    end_date: "2026-03-29",
    keywords: ["رمضان", "تفسير", "برنامج"],
    status: "approved",
    view_count: 1200,
    created_at: "2025-11-15T07:00:00Z",
  },
  {
    id: "course-alfiqh-almuqaran",
    external_key: "course-alfiqh-almuqaran",
    title: "برنامج الفقه المقارن",
    summary: "برنامج علمي لمقارنة المذاهب في المسائل الفقهية المعاصرة.",
    course_type: "برنامج",
    season: "1446-1447",
    year: 2025,
    sheikh_names: ["د. حامد المسعد"],
    mutoon: ["الفقه المقارن"],
    venue_name: "مركز المجلس العلمي",
    venue_city: "الكويت",
    registration_open: false,
    keywords: ["فقه", "مقارن", "مذاهب"],
    status: "approved",
    view_count: 560,
    created_at: "2025-09-01T06:00:00Z",
  },
  {
    id: "mutoon-alfiyyah",
    external_key: "mutoon-alfiyyah",
    title: "متن الألفية في النحو",
    summary: "حلقة علمية لحفظ وشرح متن الألفية.",
    course_type: "متن",
    year: 2026,
    sheikh_names: ["د. أسامة الشاوي"],
    mutoon: ["ألفية ابن مالك"],
    schedule: [{ day: "الأحد", time: "بعد الفجر", topic: "حفظ وشرح", sheikh: "د. أسامة الشاوي" }],
    venue_city: "الكويت",
    registration_open: true,
    keywords: ["ألفية", "نحو", "متن"],
    status: "approved",
    view_count: 430,
    created_at: "2025-10-20T05:00:00Z",
  },
  {
    id: "course-aqeedah-tahawiyyah-2026",
    external_key: "course-aqeedah-tahawiyyah-2026",
    title: "شرح العقيدة الطحاوية — 1447هـ",
    summary: "دورة علمية في شرح متن الطحاوية مع بيان مسائل الأسماء والصفات.",
    body: `**عن الدورة:**
شرح تفصيلي لأهم متون العقيدة — العقيدة الطحاوية — مع الرد على الشبهات المعاصرة.

**المحاور:**
- أسماء الله وصفاته
- الإيمان وأركانه
- القضاء والقدر
- اليوم الآخر`,
    course_type: "سنوية",
    season: "1447هـ",
    year: 2026,
    sheikh_names: ["د. عبدالله الشثري"],
    mutoon: ["العقيدة الطحاوية", "شرح ابن أبي العز"],
    schedule: [
      { day: "الاثنين", time: "بعد العصر", topic: "متن الطحاوية", sheikh: "د. عبدالله الشثري" },
    ],
    venue_name: "مسجد ابن تيمية",
    venue_city: "الكويت",
    registration_open: true,
    start_date: "2026-02-01",
    end_date: "2026-11-30",
    keywords: ["عقيدة", "الطحاوية", "توحيد", "دورة"],
    status: "approved",
    view_count: 670,
    created_at: "2026-01-05T09:00:00Z",
  },
  {
    id: "course-hadith-arbain-nawawi-2026",
    external_key: "course-hadith-arbain-nawawi-2026",
    title: "شرح الأربعين النووية — 1447هـ",
    summary: "حلقة علمية في شرح أربعين حديثاً نووياً مع بيان فقهها وفوائدها.",
    course_type: "سنوية",
    season: "1447هـ",
    year: 2026,
    sheikh_names: ["د. فهد بن صالح العجلان"],
    mutoon: ["الأربعون النووية"],
    schedule: [
      { day: "الثلاثاء", time: "بعد المغرب", topic: "شرح الأربعين النووية", sheikh: "د. فهد العجلان" },
    ],
    venue_name: "مسجد الكويت الكبير",
    venue_city: "الكويت",
    registration_open: true,
    start_date: "2026-01-20",
    end_date: "2026-08-30",
    keywords: ["أربعين", "نووية", "حديث", "شرح"],
    status: "approved",
    view_count: 850,
    created_at: "2026-01-10T07:00:00Z",
  },
  {
    id: "course-tafsir-juz-amma",
    external_key: "course-tafsir-juz-amma",
    title: "تفسير جزء عمّ — الدورة الإثرائية",
    summary: "برنامج تفسيري متكامل لجزء عمّ مع ربط الآيات بالواقع المعاصر.",
    course_type: "برنامج",
    season: "صيف 1447",
    year: 2026,
    sheikh_names: ["د. ناصر بن سليمان العمر"],
    mutoon: ["تيسير الكريم الرحمن — السعدي"],
    schedule: [
      { day: "الجمعة", time: "بعد الفجر", topic: "تفسير", sheikh: "د. ناصر العمر" },
      { day: "السبت", time: "بعد العصر", topic: "تدبر وتطبيق", sheikh: "د. ناصر العمر" },
    ],
    venue_name: "مركز التعليم الإسلامي",
    venue_city: "الكويت",
    registration_open: true,
    start_date: "2026-06-15",
    end_date: "2026-08-15",
    keywords: ["تفسير", "جزء عمّ", "قرآن", "تدبر"],
    status: "approved",
    view_count: 540,
    created_at: "2026-05-01T06:00:00Z",
  },
  {
    id: "course-fiqh-ibadat",
    external_key: "course-fiqh-ibadat",
    title: "دورة الفقه في العبادات",
    summary: "دورة شاملة في أحكام الطهارة والصلاة والصيام والزكاة والحج.",
    course_type: "سنوية",
    season: "1447هـ",
    year: 2026,
    sheikh_names: ["د. يوسف الشبيلي", "د. عبدالله المطلق"],
    mutoon: ["زاد المستقنع", "الروض المربع"],
    schedule: [
      { day: "الأربعاء", time: "بعد العشاء", topic: "الفقه العملي", sheikh: "د. يوسف الشبيلي" },
    ],
    venue_name: "المجلس العلمي",
    venue_city: "الكويت",
    registration_open: true,
    start_date: "2026-01-01",
    end_date: "2026-12-31",
    keywords: ["فقه", "عبادات", "طهارة", "صلاة", "صيام"],
    status: "approved",
    view_count: 1100,
    created_at: "2025-12-25T08:00:00Z",
  },
  {
    id: "course-arabic-beginner",
    external_key: "course-arabic-beginner",
    title: "اللغة العربية للمبتدئين — النحو والصرف",
    summary: "دورة تأسيسية في علم النحو والصرف لطلاب العلم الشرعي.",
    course_type: "برنامج",
    season: "1447هـ",
    year: 2026,
    sheikh_names: ["أ. محمد الخالدي"],
    mutoon: ["متن الآجرومية", "التحفة السنية"],
    schedule: [
      { day: "الخميس", time: "بعد المغرب", topic: "النحو والصرف", sheikh: "أ. محمد الخالدي" },
    ],
    venue_name: "مركز الدراسات الإسلامية",
    venue_city: "الكويت",
    registration_open: true,
    start_date: "2026-02-10",
    end_date: "2026-06-30",
    keywords: ["نحو", "صرف", "عربية", "آجرومية", "مبتدئ"],
    status: "approved",
    view_count: 320,
    created_at: "2026-01-20T05:00:00Z",
  },
  {
    id: "course-seerah-nabawiyyah",
    external_key: "course-seerah-nabawiyyah",
    title: "السيرة النبوية المفصّلة",
    summary: "دراسة تحليلية شاملة لسيرة النبي ﷺ منذ المولد حتى الوفاة.",
    course_type: "سنوية",
    season: "1447هـ",
    year: 2026,
    sheikh_names: ["د. أكرم ضياء العمري"],
    mutoon: ["الرحيق المختوم", "السيرة النبوية — ابن هشام"],
    schedule: [
      { day: "السبت", time: "بعد الظهر", topic: "السيرة", sheikh: "د. أكرم العمري" },
    ],
    venue_name: "مركز الدراسات الإسلامية",
    venue_city: "الكويت",
    registration_open: false,
    start_date: "2026-03-01",
    end_date: "2027-02-28",
    keywords: ["سيرة", "نبوية", "تاريخ", "مولد"],
    status: "approved",
    view_count: 780,
    created_at: "2026-02-15T06:00:00Z",
  },
  {
    id: "course-uloom-hadith",
    external_key: "course-uloom-hadith",
    title: "مقدمة في علوم الحديث",
    summary: "دورة تأسيسية في مصطلح الحديث ودراسة الأسانيد والمتون.",
    course_type: "برنامج",
    season: "صيف 1447",
    year: 2026,
    sheikh_names: ["د. حاتم بن عارف العوني"],
    mutoon: ["نخبة الفكر", "نزهة النظر"],
    schedule: [
      { day: "الثلاثاء", time: "بعد العشاء", topic: "مصطلح الحديث", sheikh: "د. حاتم العوني" },
    ],
    venue_name: "مسجد الإمام أحمد",
    venue_city: "الكويت",
    registration_open: true,
    start_date: "2026-06-20",
    end_date: "2026-09-20",
    keywords: ["مصطلح الحديث", "أسانيد", "علوم الحديث"],
    status: "approved",
    view_count: 460,
    created_at: "2026-05-10T07:00:00Z",
  },

  // ── دورات متون ───────────────────────────────────────────────────
  {
    id: "matn-ajurrumiyyah-2026",
    external_key: "matn-ajurrumiyyah-2026",
    title: "متن الآجرومية في النحو",
    summary: "حلقة علمية لحفظ وشرح متن الآجرومية في النحو للمبتدئين.",
    body: `**عن الدورة:**
متن الآجرومية من أهم المتون النحوية للمبتدئين؛ يُدرَّس مع شرح تطبيقي وتمارين.

**المحاور:**
- أقسام الكلام
- إعراب الأسماء والأفعال
- علامات الإعراب
- التمارين التطبيقية`,
    course_type: "متن",
    season: "1447هـ",
    year: 2026,
    sheikh_names: ["أ. محمد الخالدي"],
    mutoon: ["متن الآجرومية"],
    schedule: [
      { day: "الأحد", time: "بعد المغرب", topic: "حفظ وشرح", sheikh: "أ. محمد الخالدي" },
    ],
    venue_name: "مركز الدراسات الإسلامية",
    venue_city: "الكويت",
    registration_open: true,
    start_date: "2026-02-01",
    end_date: "2026-06-30",
    keywords: ["آجرومية", "نحو", "متن", "مبتدئ"],
    status: "approved",
    view_count: 280,
    created_at: "2026-01-15T06:00:00Z",
  },
  {
    id: "matn-al-waraqat-2026",
    external_key: "matn-al-waraqat-2026",
    title: "متن الورقات في أصول الفقه",
    summary: "حلقة علمية في حفظ وشرح متن الورقات لإمام الحرمين الجويني.",
    body: `**عن الدورة:**
متن الورقات من أوجز المتون وأنفعها في أصول الفقه؛ يُشرح مع التمثيل التطبيقي على المسائل الأصولية.

**المحاور:**
- الأحكام الشرعية
- الأدلة الشرعية
- طرق الاستنباط`,
    course_type: "متن",
    season: "1447هـ",
    year: 2026,
    sheikh_names: ["د. مطلق الجاسر"],
    mutoon: ["الورقات في أصول الفقه"],
    schedule: [
      { day: "الاثنين", time: "بعد العشاء", topic: "حفظ وشرح", sheikh: "د. مطلق الجاسر" },
    ],
    venue_name: "مسجد الإمام أحمد",
    venue_city: "الكويت",
    registration_open: true,
    start_date: "2026-02-15",
    end_date: "2026-07-15",
    keywords: ["ورقات", "أصول الفقه", "متن", "جويني"],
    status: "approved",
    view_count: 310,
    created_at: "2026-01-20T07:00:00Z",
  },
  {
    id: "matn-al-bayquniyyah-2026",
    external_key: "matn-al-bayquniyyah-2026",
    title: "المنظومة البيقونية في مصطلح الحديث",
    summary: "حفظ وشرح المنظومة البيقونية لتعلّم مصطلح الحديث بأسلوب ميسّر.",
    course_type: "متن",
    season: "1447هـ",
    year: 2026,
    sheikh_names: ["د. حاتم بن عارف العوني"],
    mutoon: ["المنظومة البيقونية"],
    schedule: [
      { day: "الخميس", time: "بعد الفجر", topic: "حفظ وشرح المنظومة", sheikh: "د. حاتم العوني" },
    ],
    venue_name: "مسجد الإمام مالك",
    venue_city: "الكويت",
    registration_open: true,
    start_date: "2026-03-01",
    end_date: "2026-06-01",
    keywords: ["بيقونية", "مصطلح الحديث", "منظومة", "متن"],
    status: "approved",
    view_count: 195,
    created_at: "2026-02-01T05:00:00Z",
  },
  {
    id: "matn-nakhbat-al-fikr-2026",
    external_key: "matn-nakhbat-al-fikr-2026",
    title: "نخبة الفكر في مصطلح أهل الأثر",
    summary: "دراسة متن نخبة الفكر لابن حجر مع شرح تطبيقي على الأسانيد.",
    course_type: "متن",
    season: "1447هـ",
    year: 2026,
    sheikh_names: ["د. إبراهيم الدويش"],
    mutoon: ["نخبة الفكر", "نزهة النظر"],
    schedule: [
      { day: "الأربعاء", time: "بعد المغرب", topic: "شرح نخبة الفكر", sheikh: "د. إبراهيم الدويش" },
    ],
    venue_name: "مركز العلوم الشرعية",
    venue_city: "الكويت",
    registration_open: true,
    start_date: "2026-02-20",
    end_date: "2026-08-20",
    keywords: ["نخبة الفكر", "ابن حجر", "مصطلح الحديث", "متن"],
    status: "approved",
    view_count: 370,
    created_at: "2026-01-25T08:00:00Z",
  },
  {
    id: "matn-thalatha-usul-2026",
    external_key: "matn-thalatha-usul-2026",
    title: "ثلاثة الأصول وأدلتها",
    summary: "حلقة علمية لحفظ وشرح ثلاثة الأصول لشيخ الإسلام ابن عبدالوهاب.",
    course_type: "متن",
    season: "1447هـ",
    year: 2026,
    sheikh_names: ["د. عبدالله الشثري"],
    mutoon: ["ثلاثة الأصول وأدلتها"],
    schedule: [
      { day: "الجمعة", time: "بعد صلاة الجمعة", topic: "شرح ثلاثة الأصول", sheikh: "د. عبدالله الشثري" },
    ],
    venue_name: "مسجد ابن تيمية",
    venue_city: "الكويت",
    registration_open: true,
    start_date: "2026-01-30",
    end_date: "2026-05-30",
    keywords: ["ثلاثة الأصول", "عقيدة", "متن", "ابن عبدالوهاب"],
    status: "approved",
    view_count: 490,
    created_at: "2026-01-10T09:00:00Z",
  },

  // ── دورات فقهية ──────────────────────────────────────────────────
  {
    id: "course-zaad-al-mustaqni-2026",
    external_key: "course-zaad-al-mustaqni-2026",
    title: "شرح زاد المستقنع — الفقه الحنبلي",
    summary: "دورة علمية متكاملة في شرح زاد المستقنع للحجاوي من أول كتاب الطهارة.",
    body: `**عن الدورة:**
زاد المستقنع من أهم متون الفقه الحنبلي؛ تُشرح فيه أحكام العبادات والمعاملات تفصيلاً.

**المحاور:**
- كتاب الطهارة والصلاة
- كتاب الزكاة والصيام والحج
- كتاب البيوع والمعاملات`,
    course_type: "سنوية",
    season: "1447هـ",
    year: 2026,
    sheikh_names: ["د. يوسف الشبيلي"],
    mutoon: ["زاد المستقنع"],
    schedule: [
      { day: "الثلاثاء", time: "بعد العصر", topic: "شرح زاد المستقنع", sheikh: "د. يوسف الشبيلي" },
    ],
    venue_name: "المجلس العلمي",
    venue_city: "الكويت",
    registration_open: true,
    start_date: "2026-01-10",
    end_date: "2026-12-31",
    keywords: ["زاد المستقنع", "فقه حنبلي", "طهارة", "صلاة"],
    status: "approved",
    view_count: 620,
    created_at: "2025-12-20T08:00:00Z",
  },
  {
    id: "course-bidayat-al-mujtahid-2026",
    external_key: "course-bidayat-al-mujtahid-2026",
    title: "بداية المجتهد ونهاية المقتصد",
    summary: "دراسة الفقه المقارن من خلال كتاب ابن رشد الشهير في مسائل الخلاف.",
    course_type: "برنامج",
    season: "1447هـ",
    year: 2026,
    sheikh_names: ["د. حامد المسعد", "د. دهام أبو خشبة"],
    mutoon: ["بداية المجتهد ونهاية المقتصد"],
    schedule: [
      { day: "السبت", time: "بعد العشاء", topic: "الفقه المقارن", sheikh: "د. حامد المسعد" },
      { day: "الثلاثاء", time: "بعد المغرب", topic: "مسائل الخلاف", sheikh: "د. دهام أبو خشبة" },
    ],
    venue_name: "مركز المجلس العلمي",
    venue_city: "الكويت",
    registration_open: true,
    start_date: "2026-03-01",
    end_date: "2026-11-30",
    keywords: ["بداية المجتهد", "فقه مقارن", "ابن رشد", "خلاف"],
    status: "approved",
    view_count: 410,
    created_at: "2026-02-10T07:00:00Z",
  },
  {
    id: "course-al-rawdh-al-murbi-2026",
    external_key: "course-al-rawdh-al-murbi-2026",
    title: "شرح الروض المربع — في الفقه",
    summary: "شرح متن الروض المربع شرح دقائق زاد المستقنع للشيخ البهوتي.",
    course_type: "سنوية",
    season: "1447هـ",
    year: 2026,
    sheikh_names: ["د. عبدالله المطلق"],
    mutoon: ["الروض المربع"],
    schedule: [
      { day: "الأحد", time: "بعد المغرب", topic: "شرح الروض المربع", sheikh: "د. عبدالله المطلق" },
    ],
    venue_name: "مسجد الصحابة",
    venue_city: "الكويت",
    registration_open: true,
    start_date: "2026-02-01",
    end_date: "2026-12-31",
    keywords: ["الروض المربع", "فقه حنبلي", "البهوتي"],
    status: "approved",
    view_count: 350,
    created_at: "2026-01-15T06:00:00Z",
  },
  {
    id: "course-umdat-al-talib-2026",
    external_key: "course-umdat-al-talib-2026",
    title: "عمدة الطالب في فقه الإمام أحمد",
    summary: "دراسة متن عمدة الطالب وهو مختصر في الفقه الحنبلي للمبتدئين.",
    course_type: "برنامج",
    season: "1447هـ",
    year: 2026,
    sheikh_names: ["د. مطلق الجاسر"],
    mutoon: ["عمدة الطالب"],
    schedule: [
      { day: "الأربعاء", time: "بعد الفجر", topic: "شرح عمدة الطالب", sheikh: "د. مطلق الجاسر" },
    ],
    venue_name: "مسجد ابن تيمية",
    venue_city: "الكويت",
    registration_open: true,
    start_date: "2026-02-10",
    end_date: "2026-07-10",
    keywords: ["عمدة الطالب", "فقه حنبلي", "مبتدئ"],
    status: "approved",
    view_count: 240,
    created_at: "2026-01-20T05:00:00Z",
  },

  // ── دورات تفسير ──────────────────────────────────────────────────
  {
    id: "course-muqadimat-tafsir-2026",
    external_key: "course-muqadimat-tafsir-2026",
    title: "مقدمة في أصول التفسير",
    summary: "دورة تأسيسية في أصول علم التفسير ومناهج المفسرين.",
    body: `**عن الدورة:**
دراسة أصول علم التفسير من القرآن والسنة والأثر وأقوال الصحابة.

**المحاور:**
- تعريف التفسير ومناهجه
- تفسير القرآن بالقرآن وبالسنة
- اللغة العربية وعلاقتها بالتفسير
- مقدمة ابن تيمية في أصول التفسير`,
    course_type: "برنامج",
    season: "1447هـ",
    year: 2026,
    sheikh_names: ["الشيخ صالح المغامسي"],
    mutoon: ["مقدمة في أصول التفسير — ابن تيمية"],
    schedule: [
      { day: "الجمعة", time: "بعد الفجر", topic: "أصول التفسير", sheikh: "الشيخ صالح المغامسي" },
    ],
    venue_name: "مركز التعليم الإسلامي",
    venue_city: "الكويت",
    registration_open: true,
    start_date: "2026-03-15",
    end_date: "2026-07-15",
    keywords: ["تفسير", "أصول التفسير", "مقدمة", "مناهج"],
    status: "approved",
    view_count: 390,
    created_at: "2026-02-20T07:00:00Z",
  },
  {
    id: "course-al-tibyan-2026",
    external_key: "course-al-tibyan-2026",
    title: "التبيان في آداب حملة القرآن",
    summary: "دراسة كتاب التبيان للنووي في آداب القرآن وأحكام التلاوة.",
    course_type: "برنامج",
    season: "1447هـ",
    year: 2026,
    sheikh_names: ["د. محمد ضاوي العصيمي"],
    mutoon: ["التبيان في آداب حملة القرآن — النووي"],
    schedule: [
      { day: "الخميس", time: "بعد العشاء", topic: "آداب القرآن", sheikh: "د. محمد ضاوي العصيمي" },
    ],
    venue_name: "مسجد الإمام مالك",
    venue_city: "الكويت",
    registration_open: true,
    start_date: "2026-02-15",
    end_date: "2026-06-30",
    keywords: ["التبيان", "آداب القرآن", "تلاوة", "حملة القرآن"],
    status: "approved",
    view_count: 285,
    created_at: "2026-02-01T06:00:00Z",
  },
  {
    id: "course-manhaj-ibn-kathir-2026",
    external_key: "course-manhaj-ibn-kathir-2026",
    title: "منهج ابن كثير في التفسير",
    summary: "دراسة تحليلية لمنهج الإمام ابن كثير في تفسيره وأصوله الاستدلالية.",
    course_type: "برنامج",
    season: "صيف 1447",
    year: 2026,
    sheikh_names: ["د. ناصر بن سليمان العمر"],
    mutoon: ["تفسير القرآن العظيم — ابن كثير"],
    schedule: [
      { day: "السبت", time: "بعد الظهر", topic: "منهج ابن كثير", sheikh: "د. ناصر العمر" },
    ],
    venue_name: "مركز الدراسات الإسلامية",
    venue_city: "الكويت",
    registration_open: true,
    start_date: "2026-06-15",
    end_date: "2026-09-15",
    keywords: ["ابن كثير", "تفسير", "منهج", "دراسة"],
    status: "approved",
    view_count: 340,
    created_at: "2026-05-15T07:00:00Z",
  },

  // ── دورات حديث ───────────────────────────────────────────────────
  {
    id: "course-arbain-nawawiyyah-matn-2026",
    external_key: "course-arbain-nawawiyyah-matn-2026",
    title: "متن الأربعين النووية — حفظاً وفهماً",
    summary: "برنامج تأسيسي لحفظ الأربعين النووية مع استخلاص الفوائد الفقهية.",
    course_type: "متن",
    season: "1447هـ",
    year: 2026,
    sheikh_names: ["الشيخ سليمان الرحيلي"],
    mutoon: ["الأربعون النووية"],
    schedule: [
      { day: "الاثنين", time: "بعد الفجر", topic: "حفظ وفهم الأربعين النووية", sheikh: "الشيخ سليمان الرحيلي" },
    ],
    venue_name: "مسجد الكويت الكبير",
    venue_city: "الكويت",
    registration_open: true,
    start_date: "2026-01-25",
    end_date: "2026-06-25",
    keywords: ["أربعين نووية", "حديث", "حفظ", "متن"],
    status: "approved",
    view_count: 520,
    created_at: "2026-01-05T08:00:00Z",
  },
  {
    id: "course-umdat-al-ahkam-2026",
    external_key: "course-umdat-al-ahkam-2026",
    title: "عمدة الأحكام من كلام خير الأنام",
    summary: "دراسة أحاديث عمدة الأحكام للإمام عبدالغني المقدسي مع استنباط الأحكام.",
    course_type: "سنوية",
    season: "1447هـ",
    year: 2026,
    sheikh_names: ["د. دهام أبو خشبة"],
    mutoon: ["عمدة الأحكام"],
    schedule: [
      { day: "الأحد", time: "بعد العصر", topic: "شرح عمدة الأحكام", sheikh: "د. دهام أبو خشبة" },
    ],
    venue_name: "المجلس العلمي",
    venue_city: "الكويت",
    registration_open: true,
    start_date: "2026-01-15",
    end_date: "2026-12-15",
    keywords: ["عمدة الأحكام", "حديث", "فقه الحديث", "أحكام"],
    status: "approved",
    view_count: 430,
    created_at: "2025-12-25T06:00:00Z",
  },
  {
    id: "course-bulugh-al-maram-2026",
    external_key: "course-bulugh-al-maram-2026",
    title: "بلوغ المرام من أدلة الأحكام",
    summary: "شرح أحاديث بلوغ المرام لابن حجر مع بيان أحكامها الفقهية.",
    body: `**عن الدورة:**
بلوغ المرام من أشهر كتب الحديث الفقهي؛ يجمع ابن حجر فيه أدلة الأحكام الشرعية مرتبةً على أبواب الفقه.

**المحاور:**
- كتاب الطهارة
- كتاب الصلاة
- كتاب الزكاة والصيام
- كتاب البيوع والنكاح`,
    course_type: "سنوية",
    season: "1447هـ",
    year: 2026,
    sheikh_names: ["د. حسين المويزري"],
    mutoon: ["بلوغ المرام من أدلة الأحكام"],
    schedule: [
      { day: "الثلاثاء", time: "بعد الفجر", topic: "شرح بلوغ المرام", sheikh: "د. حسين المويزري" },
      { day: "السبت", time: "بعد المغرب", topic: "مراجعة وتطبيق", sheikh: "د. حسين المويزري" },
    ],
    venue_name: "مسجد الصحابة",
    venue_city: "الكويت",
    registration_open: true,
    start_date: "2026-01-01",
    end_date: "2026-12-31",
    keywords: ["بلوغ المرام", "ابن حجر", "حديث فقهي", "أدلة الأحكام"],
    status: "approved",
    view_count: 680,
    created_at: "2025-12-15T07:00:00Z",
  },

  // ── برامج صيفية ──────────────────────────────────────────────────
  {
    id: "mukhayam-sayfi-1447",
    external_key: "mukhayam-sayfi-1447",
    title: "مخيم صيفي 1447هـ — إجازة العلم والعمل",
    summary: "مخيم علمي تربوي صيفي يجمع بين طلب العلم والأنشطة الترفيهية الهادفة.",
    body: `**عن المخيم:**
مخيم علمي متكامل يُقام خلال الإجازة الصيفية؛ يستهدف الشباب من 15—25 سنة.

**البرنامج:**
- دروس علمية صباحية في العقيدة والفقه
- ورش عمل في التلاوة والتجويد
- أنشطة رياضية وترفيهية هادفة
- محاضرات في السيرة النبوية والتاريخ

**المدة:**
أسبوعان متواصلان`,
    course_type: "موسمية",
    season: "صيف 1447",
    year: 2026,
    sheikh_names: ["الشيخ نبيل العوضي", "الشيخ خالد الراشد"],
    mutoon: ["ثلاثة الأصول وأدلتها", "الأربعون النووية"],
    schedule: [
      { day: "يومياً", time: "08:00 صباحاً", topic: "درس علمي", sheikh: "الشيخ نبيل العوضي" },
      { day: "يومياً", time: "بعد المغرب", topic: "محاضرة", sheikh: "الشيخ خالد الراشد" },
    ],
    venue_name: "مركز الشباب الإسلامي",
    venue_city: "الكويت",
    registration_open: true,
    start_date: "2026-07-01",
    end_date: "2026-07-14",
    keywords: ["مخيم", "صيفي", "شباب", "إجازة", "تربية"],
    status: "approved",
    view_count: 730,
    created_at: "2026-05-01T08:00:00Z",
  },
  {
    id: "course-sayf-kuwait-ilmi-1447",
    external_key: "course-sayf-kuwait-ilmi-1447",
    title: "دورة صيف الكويت العلمي — 1447هـ",
    summary: "دورة علمية صيفية مكثفة تُعقد سنوياً في الكويت بمشاركة علماء ومشايخ متعددين.",
    body: `**عن الدورة:**
دورة صيفية سنوية تجمع شيوخاً وطلاباً من مختلف التخصصات في برنامج علمي مكثف.

**التخصصات:**
- حلقة العقيدة
- حلقة الفقه
- حلقة التفسير
- حلقة الحديث
- حلقة العربية`,
    course_type: "موسمية",
    season: "صيف 1447",
    year: 2026,
    sheikh_names: ["د. محمد ضاوي العصيمي", "د. مطلق الجاسر", "د. دهام أبو خشبة"],
    mutoon: ["زاد المستقنع", "نخبة الفكر", "الورقات"],
    schedule: [
      { day: "السبت—الأربعاء", time: "08:00—14:00", topic: "برنامج مكثف متعدد المواد", sheikh: "د. محمد ضاوي العصيمي" },
    ],
    venue_name: "مسجد الصحابة",
    venue_address: "الجابرية، شارع 10",
    venue_city: "الكويت",
    registration_url: "/lessons?tab=courses",
    registration_open: true,
    start_date: "2026-07-15",
    end_date: "2026-08-10",
    keywords: ["صيف الكويت", "دورة مكثفة", "علوم شرعية", "صيفية"],
    status: "approved",
    view_count: 920,
    created_at: "2026-05-15T09:00:00Z",
  },
  {
    id: "barnamaj-al-talib-al-mutamayyiz-2026",
    external_key: "barnamaj-al-talib-al-mutamayyiz-2026",
    title: "برنامج الطالب المتميز — المسار العلمي",
    summary: "برنامج نخبوي لاستقطاب المتفوقين من طلاب العلم وتأهيلهم للمسار العلمي الاحترافي.",
    body: `**عن البرنامج:**
برنامج متخصص يستهدف طلاب العلم المتقدمين الراغبين في التعمق والتأهل للتدريس.

**مميزات البرنامج:**
- منهج دراسي شامل ومتدرج
- إشراف مباشر من شيوخ متخصصين
- اختبارات دورية ومحاضرات أسبوعية
- شهادة إتمام معتمدة
- تدريب على الإلقاء والتدريس`,
    course_type: "برنامج",
    season: "1447—1448هـ",
    year: 2026,
    sheikh_names: ["د. مطلق الجاسر", "د. محمد ضاوي العصيمي"],
    mutoon: ["زاد المستقنع", "الورقات", "نخبة الفكر", "ألفية ابن مالك"],
    schedule: [
      { day: "السبت", time: "09:00 صباحاً", topic: "الفقه والأصول", sheikh: "د. مطلق الجاسر" },
      { day: "الثلاثاء", time: "بعد المغرب", topic: "الحديث والتفسير", sheikh: "د. محمد ضاوي العصيمي" },
    ],
    venue_name: "مركز المجلس العلمي",
    venue_city: "الكويت",
    registration_open: true,
    start_date: "2026-09-01",
    end_date: "2027-06-30",
    keywords: ["برنامج", "طالب متميز", "مسار علمي", "نخبة", "تأهيل"],
    status: "approved",
    view_count: 510,
    created_at: "2026-06-01T10:00:00Z",
  },
  {
    id: "course-tajweed-jazariyyah-2026",
    external_key: "course-tajweed-jazariyyah-2026",
    title: "المقدمة الجزرية في التجويد — 1447هـ",
    summary: "دورة سنوية لحفظ وشرح منظومة المقدمة الجزرية في أحكام التجويد والتلاوة.",
    body: `**عن الدورة:**
تُعدّ المقدمة الجزرية للإمام ابن الجزري رحمه الله من أمتن المنظومات في علم التجويد، وقد جمعت أحكام التلاوة في أبيات سهلة الحفظ.

**أهداف الدورة:**
- حفظ أبيات المنظومة كاملةً
- فهم أحكام التجويد التطبيقية
- التدرب على التلاوة الصحيحة

**المتون:**
- المقدمة الجزرية
- تحفة الأطفال (مراجعة)

**البرنامج:**
- درس نظري أسبوعي
- تطبيق عملي بالتلاوة
- اختبار حفظ في نهاية كل وحدة
- مجلس إجازة في نهاية الدورة`,
    course_type: "سنوية",
    season: "1447هـ",
    year: 2026,
    sheikh_names: ["الشيخ أحمد العجمي", "الشيخ عبد الباسط هاشم"],
    mutoon: ["المقدمة الجزرية", "تحفة الأطفال"],
    schedule: [
      { day: "الأحد", time: "بعد المغرب", topic: "شرح وحفظ الأبيات", sheikh: "الشيخ أحمد العجمي" },
      { day: "الأربعاء", time: "بعد العشاء", topic: "تطبيق وتلاوة", sheikh: "الشيخ عبد الباسط هاشم" },
    ],
    venue_name: "مسجد الرحمن",
    venue_city: "الكويت",
    registration_open: true,
    start_date: "2026-02-01",
    end_date: "2026-11-30",
    keywords: ["تجويد", "جزرية", "قرآن", "تلاوة", "إجازة", "حفظ"],
    status: "approved",
    view_count: 730,
    created_at: "2025-12-15T09:00:00Z",
  },
  {
    id: "course-balaghah-jawhar-2026",
    external_key: "course-balaghah-jawhar-2026",
    title: "الجوهر المكنون في البلاغة — 1447هـ",
    summary: "شرح متن الجوهر المكنون في علوم البيان والبديع والمعاني لطلاب المستوى المتوسط.",
    body: `**عن الدورة:**
الجوهر المكنون للأخضري منظومة جامعة في علم البلاغة بفروعه الثلاثة: المعاني والبيان والبديع. وهي مرحلة متوسطة لطالب العلم بعد إتقان النحو.

**أهداف الدورة:**
- فهم أبواب علم المعاني (الخبر والإنشاء، الإسناد...)
- إتقان فنون البيان (التشبيه، الاستعارة، الكناية)
- التعرف على محسّنات البديع اللفظية والمعنوية
- تطبيق ذلك على الآيات القرآنية والأحاديث النبوية

**البرنامج:**
- درس أسبوعي مع تطبيقات قرآنية
- مذاكرة جماعية
- ورقة بحثية في ختام الدورة`,
    course_type: "برنامج",
    season: "1447هـ",
    year: 2026,
    sheikh_names: ["د. فهد الحمود", "أ. عبد الرحمن الشمري"],
    mutoon: ["الجوهر المكنون", "مختصر المعاني"],
    schedule: [
      { day: "الاثنين", time: "بعد المغرب", topic: "علم المعاني والبيان", sheikh: "د. فهد الحمود" },
    ],
    venue_name: "مركز تعليم اللغة العربية",
    venue_city: "الكويت",
    registration_open: false,
    start_date: "2026-03-01",
    end_date: "2026-12-15",
    keywords: ["بلاغة", "جوهر مكنون", "معاني", "بيان", "بديع", "أخضري"],
    status: "approved",
    view_count: 490,
    created_at: "2026-01-10T08:00:00Z",
  },
  {
    id: "course-mawarith-rahbiyyah-2026",
    external_key: "course-mawarith-rahbiyyah-2026",
    title: "الرحبية في المواريث — 1447هـ",
    summary: "شرح منظومة الرحبية في علم الفرائض لطلاب العلم الراغبين في إتقان أحكام الإرث.",
    body: `**عن الدورة:**
الرحبية منظومة عظيمة في الفرائض نظمها الإمام الرحّبي رحمه الله، وقد جمعت مسائل الإرث بطريقة ميسّرة.

**أهداف الدورة:**
- معرفة أسباب الإرث وموانعه
- حساب حصص الورثة بالفريضة والعول والردّ
- التطبيق على مسائل الحساب والتخريج
- إتقان الحالات الخاصة (المشتركة، الأكدرية...)

**المتون:**
- منظومة الرحبية
- مسائل تطبيقية من الفقه المقارن

**البرنامج:**
- 24 درساً موزعاً على الفصل الدراسي
- اختبار عملي في نهاية كل باب`,
    course_type: "سنوية",
    season: "1447هـ",
    year: 2026,
    sheikh_names: ["الشيخ صالح العصيمي", "د. عبد الله الغفيلي"],
    mutoon: ["منظومة الرحبية في الفرائض"],
    schedule: [
      { day: "الخميس", time: "بعد العصر", topic: "شرح الرحبية وتطبيقاتها", sheikh: "الشيخ صالح العصيمي" },
    ],
    venue_name: "مسجد ابن عقيل",
    venue_city: "الكويت",
    registration_open: true,
    start_date: "2026-01-20",
    end_date: "2026-10-30",
    keywords: ["مواريث", "فرائض", "رحبية", "إرث", "حساب"],
    status: "approved",
    view_count: 420,
    created_at: "2025-11-20T09:00:00Z",
  },
  {
    id: "course-tazkiyah-ihya-2026",
    external_key: "course-tazkiyah-ihya-2026",
    title: "برنامج التزكية والسلوك — 1447هـ",
    summary: "برنامج سنوي في تزكية النفس وعلم السلوك، بالتأصيل من القرآن والسنة وكلام السلف.",
    body: `**عن البرنامج:**
علم التزكية أصل عظيم من أصول الدين، إذ لا يصلح ظاهر العبد إلا بصلاح باطنه. يُعنى هذا البرنامج بتأصيل هذا العلم من الكتاب والسنة وكلام أئمة السلف.

**المحاور الرئيسية:**
- باب التوبة ومحاسبة النفس
- باب الإخلاص والنية
- باب الصبر والشكر
- باب الرجاء والخوف والمحبة
- علاج أمراض القلوب (الحسد، الكبر، الغفلة)
- فقه التعامل مع الفتن

**المصادر:**
- مدارج السالكين (لابن القيم)
- الرسالة القشيرية (مختارات)
- كلام ابن رجب في الحكم والرقائق`,
    course_type: "برنامج",
    season: "1447—1448هـ",
    year: 2026,
    sheikh_names: ["د. محمد الشنقيطي", "الشيخ عبد الرزاق البدر"],
    mutoon: ["مدارج السالكين", "مختصر منهاج القاصدين"],
    schedule: [
      { day: "الجمعة", time: "بعد الجمعة", topic: "دروس التزكية والسلوك", sheikh: "د. محمد الشنقيطي" },
    ],
    venue_name: "مسجد السلام",
    venue_city: "الكويت",
    registration_open: true,
    start_date: "2026-04-01",
    end_date: "2027-03-31",
    keywords: ["تزكية", "سلوك", "قلب", "إخلاص", "توبة", "أخلاق"],
    status: "approved",
    view_count: 870,
    created_at: "2026-02-01T09:00:00Z",
  },
  {
    id: "course-hadith-moqizah-2026",
    external_key: "course-hadith-moqizah-2026",
    title: "الموقظة في علم مصطلح الحديث — 1447هـ",
    summary: "شرح كتاب الموقظة للإمام الذهبي — مرحلة متوسطة في علوم الحديث لمن أتمّ مرحلة البيقونية.",
    body: `**عن الدورة:**
الموقظة للإمام الحافظ الذهبي رحمه الله من أنفع الكتب المتوسطة في علوم الحديث، تجمع بين العمق العلمي والإيجاز، وتُبنى عليها مراحل متقدمة في هذا الفن.

**أهداف الدورة:**
- فهم تقسيمات الحديث وأنواعه (الصحيح، الحسن، الضعيف وأقسامها)
- دراسة أحوال الرواة وطبقاتهم
- التعرف على اصطلاحات المحدثين وعباراتهم في الجرح والتعديل
- ربط ذلك بكتب الرجال والعلل

**المتطلبات:** إتمام دراسة البيقونية أو نخبة الفكر

**البرنامج:**
- 30 درساً مع تطبيق عملي على أحاديث الصحيحين`,
    course_type: "برنامج",
    season: "صيف 1447",
    year: 2026,
    sheikh_names: ["د. ماهر الفحل", "د. خالد الدريس"],
    mutoon: ["الموقظة للذهبي", "نخبة الفكر (مراجعة)"],
    schedule: [
      { day: "الثلاثاء", time: "بعد المغرب", topic: "شرح الموقظة", sheikh: "د. ماهر الفحل" },
      { day: "الجمعة", time: "بعد الفجر", topic: "تطبيق ومناقشة", sheikh: "د. خالد الدريس" },
    ],
    venue_name: "مركز المجلس العلمي",
    venue_city: "الكويت",
    registration_open: true,
    start_date: "2026-06-15",
    end_date: "2026-09-15",
    keywords: ["حديث", "موقظة", "ذهبي", "مصطلح", "رجال", "جرح وتعديل"],
    status: "approved",
    view_count: 380,
    created_at: "2026-04-01T09:00:00Z",
  },
  {
    id: "course-nisaiyyah-fiqh-2026",
    external_key: "course-nisaiyyah-fiqh-2026",
    title: "الدورة النسائية الفقهية — أحكام المرأة المسلمة 1447هـ",
    summary: "برنامج سنوي متخصص للنساء في الفقه المتعلق بالمرأة من الطهارة إلى العبادات والمعاملات الأسرية.",
    body: `**عن الدورة:**
دورة نسائية متخصصة تُعنى بتأهيل المرأة المسلمة في أحكام دينها، من مسائل الطهارة والصلاة إلى أحكام النكاح والأسرة.

**المحاور:**
1. **باب الطهارة:** الحيض والنفاس وأحكامهما
2. **باب الصلاة:** أحكام صلاة المرأة وشروطها وسننها
3. **باب الصيام والزكاة:** أحكام خاصة بالمرأة
4. **باب الحج والعمرة:** محرمات المرأة وشروط سفرها
5. **باب النكاح:** الخطبة والزواج والحقوق الزوجية
6. **باب العدة والطلاق:** مبسّطاً بأسلوب عملي

**المميزات:**
- محاضرات مسجّلة للاستماع في أي وقت
- ورقة عمل في نهاية كل باب
- مجموعة نقاش مع الأستاذة`,
    course_type: "برنامج",
    season: "1447—1448هـ",
    year: 2026,
    sheikh_names: ["أ. نورة السبيعي", "أ. منى الحمد"],
    mutoon: ["منهج طالبة العلم", "مختصر الفقه الإسلامي للتويجري"],
    schedule: [
      { day: "الإثنين", time: "10:00 صباحاً", topic: "أحكام الطهارة والصلاة", sheikh: "أ. نورة السبيعي" },
      { day: "الخميس", time: "10:00 صباحاً", topic: "أحكام النكاح والأسرة", sheikh: "أ. منى الحمد" },
    ],
    venue_name: "قاعة المجلس النسائي",
    venue_city: "الكويت",
    registration_open: true,
    start_date: "2026-09-15",
    end_date: "2027-05-31",
    keywords: ["نسائي", "فقه المرأة", "طهارة", "حيض", "نكاح", "دورة نسائية"],
    status: "approved",
    view_count: 940,
    created_at: "2026-06-15T09:00:00Z",
  },
];

export function findAnnualCourseById(id: string) {
  return ANNUAL_COURSES_SEED.find((c) => c.id === id || c.external_key === id) || null;
}
