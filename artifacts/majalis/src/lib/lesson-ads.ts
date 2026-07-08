/** كتالوج الدروس والدورات — يُدمج دائماً مع بيانات Supabase ومتاح كاحتياط في جميع البيئات. */
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
  {
    id: "jury-aldahi-sharia-program-4",
    provider: "أكاديمية جوري الضاحي",
    teacher: "د. لولوة الوهيب وأخريات",
    teacherImage: "",
    title: "برنامج شرعي مبسط — المستوى الرابع",
    shortDescription: "برنامج شرعي لفتيات المرحلة المتوسطة والثانوية — حضوري في كيفان. مواد البرنامج: العقيدة، الفقه، التفسير، الحديث، محاسن الدين، السيرة النبوية. يشمل ورش وأنشطة مهارية.",
    category: "program",
    tags: ["برنامج تعليمي", "حضوري", "نساء فقط", "عقيدة", "فقه", "تفسير", "سيرة"],
    hasWomenSection: true,
    startDate: "2026-07-05",
    detailIntro: "للتسجيل: @jouryaldahi على إنستقرام أو الاتصال على 66240438. الفترة: 5–16 يوليو 2026.",
    sessions: [
      {
        label: "جلسات الأحد والثلاثاء والخميس",
        day: "الأحد",
        time: "4:30م – 8:30م",
        venue: "أكاديمية جوري الضاحي",
        district: "كيفان",
        note: "حضوري — للتسجيل: @jouryaldahi (إنستقرام) أو 66240438",
      },
    ],
  },
  {
    id: "rasid-alsolayhim-tasiliyya",
    provider: "مساجد الجهراء — وزارة الشؤون الإسلامية",
    teacher: "د. راشد صليهم فهد الصليهم",
    teacherImage: "",
    title: "الدورة العلمية التأصيلية",
    shortDescription: "ثلاثة دروس في جلسة واحدة كل اثنين: بلوغ المرام، القواعد المثلى في صفات الله وأسمائه الحسنى، ودعوى تعارض السنة مع العلم التجريبي.",
    category: "weekly",
    tags: ["حديث", "عقيدة", "أسبوعي", "حضوري", "بث مباشر"],
    sessions: [
      {
        label: "بلوغ المرام — قبل المغرب",
        day: "الاثنين",
        time: "6:00م",
        venue: "مسجد أبو واقد الليثي",
        district: "القيروان ق2",
      },
      {
        label: "القواعد المثلى — المغرب",
        day: "الاثنين",
        time: "7:20م",
        venue: "مسجد أبو واقد الليثي",
        district: "القيروان ق2",
      },
      {
        label: "دعوى تعارض السنة مع العلم التجريبي — بعد العشاء",
        day: "الاثنين",
        time: "8:50م",
        venue: "مسجد أبو واقد الليثي",
        district: "القيروان ق2",
      },
    ],
  },
  {
    id: "ajraa-murtaqa-course-3",
    provider: "جمعية مرتقى العلمية — مساجد حولي",
    teacher: "الشيخ محمد سليمان الأجراح",
    teacherImage: "",
    title: "دورة الشيخ الأجراح العلمية — الثالثة",
    shortDescription: "دورة علمية مكثفة تضم نخبة من المشايخ، من الأحد إلى الأربعاء بعد صلاة العصر. يوجد مكان للنساء. المحاضرة الافتتاحية للشيخ د.عثمان الخميس.",
    category: "course",
    tags: ["دورة علمية", "حضوري", "عقيدة", "فقه", "نحو", "بث مباشر"],
    hasWomenSection: true,
    startDate: "2026-07-05",
    detailIntro: "للتسجيل: 51104812 أو @murtaqaa_kw. الفترة: 5–29 يوليو 2026. سيتم توزيع المتون.",
    sessions: [
      {
        label: "شرح كتاب التوحيد — د.مطلق الجاسر (7/5–7/8)",
        day: "الأحد",
        time: "بعد صلاة العصر",
        venue: "مسجد موضى السور",
        district: "منطقة الصديق",
        note: "يوجد مكان للنساء — للتسجيل: 51104812",
      },
      {
        label: "شرح تنبيه الفقيه وتفقيه النبيه — الشيخ أسامة الشطي (7/12–7/15)",
        day: "الاثنين",
        time: "بعد صلاة العصر",
        venue: "مسجد موضى السور",
        district: "منطقة الصديق",
      },
      {
        label: "شرح فتح الرحيم الملك العلام — د.عبدالمحسن المعيلي (7/19–7/22)",
        day: "الثلاثاء",
        time: "بعد صلاة العصر",
        venue: "مسجد موضى السور",
        district: "منطقة الصديق",
      },
      {
        label: "شرح متن الأجرومية — الشيخ خالد العتيبي (7/26–7/29)",
        day: "الأربعاء",
        time: "بعد صلاة العصر",
        venue: "مسجد موضى السور",
        district: "منطقة الصديق",
      },
    ],
  },
  {
    id: "murtaqa-madarij-altalab",
    provider: "معهد مرتقى للعلوم الشرعية",
    teacher: "د. مطلق الجاسر وآخرون",
    teacherImage: "",
    title: "دورة مدارج الطلب",
    shortDescription: "دورة شرعية لتأصيل العلم الشرعي — على منصة معهد مرتقى المسار الانتقائي. مجانية للرجال والنساء. مدة ثلاثة أشهر. 24 درساً مسجلة ومتاحة 24 ساعة.",
    category: "course",
    tags: ["دورة علمية", "أونلاين", "مجاني", "عقيدة", "فقه", "حديث", "نحو", "بث مباشر"],
    hasWomenSection: true,
    startDate: "2026-07-05",
    detailIntro: "التسجيل مجاني. المنصة: معهد مرتقى الانتقائي. الفترة: 5 يوليو – 30 سبتمبر 2026.",
    sessions: [
      {
        label: "المسار الانتقائي — متاح 24 ساعة",
        day: "غير محدد",
        time: "متاح 24 ساعة",
        venue: "منصة معهد مرتقى (أونلاين)",
        district: "أونلاين",
        liveUrl: "https://www.instagram.com/murtaqaa_kw",
        note: "تسجيل مجاني للرجال والنساء. متابعة دورية عبر قناة التلقرام.",
      },
    ],
  },
  {
    id: "nabil-alawadhi-seerah-weekly",
    provider: "دروس الشيخ نبيل العوضي",
    teacher: "الشيخ نبيل بن علي العوضي",
    teacherImage: "/sheikhs/nabil-alawadhi.jpg",
    title: "قراءة في السيرة النبوية",
    shortDescription:
      "درس أسبوعي ثابت في السيرة النبوية — يتناول حياة النبي ﷺ وغزواته وأخلاقه بأسلوب مشوق.",
    category: "weekly",
    tags: ["سيرة", "أسبوعي", "حضوري", "بث مباشر", "تاريخ إسلامي"],
    hasWomenSection: true,
    detailIntro: "درس ثابت يُقام أسبوعياً — يُتابعه عدد كبير من المهتمين بالسيرة النبوية.",
    sessions: [
      {
        label: "المجلس الأسبوعي",
        day: "الثلاثاء",
        time: "بعد صلاة العشاء",
        venue: "مسجد الإمام الذهبي",
        district: "الروضة",
        note: "متاح للرجال والنساء — قسم خاص للأسر.",
      },
    ],
  },
  {
    id: "abdulaziz-alfawzan-fiqh-weekly",
    provider: "دروس الشيخ عبدالعزيز الفوزان",
    teacher: "د. عبدالعزيز بن فوزان الفوزان",
    teacherImage: "",
    title: "شرح زاد المستقنع في الفقه الحنبلي",
    shortDescription:
      "درس أسبوعي ثابت في شرح زاد المستقنع — أحد أهم متون الفقه الحنبلي المختصرة.",
    category: "weekly",
    tags: ["فقه", "حنبلي", "أسبوعي", "حضوري", "متن"],
    hasWomenSection: false,
    detailIntro: "شرح منهجي متواصل لكتاب زاد المستقنع — للطلاب المتوسطين في الفقه.",
    sessions: [
      {
        label: "المجلس الأسبوعي",
        day: "الأحد",
        time: "8:30 مساءً",
        venue: "جامع السلام",
        district: "قرطبة",
        note: "للرجال فقط — التسجيلات متاحة على قناة يوتيوب.",
      },
    ],
  },
  {
    id: "khalid-almushlih-usool-program",
    provider: "مركز التأصيل العلمي",
    teacher: "د. خالد بن علي المشيقح",
    teacherImage: "",
    title: "برنامج أصول الفقه للمبتدئين",
    shortDescription:
      "برنامج منهجي لتعليم أصول الفقه من الصفر — يُناسب الطلاب الجدد والمهتمين بالفقه المقارن.",
    category: "program",
    tags: ["أصول الفقه", "برنامج تعليمي", "مبتدئ", "أسبوعي"],
    hasWomenSection: true,
    startDate: "2026-08-20",
    detailIntro: "برنامج منظم يغطي المصطلحات الأساسية في أصول الفقه مع أمثلة تطبيقية.",
    sessions: [
      {
        label: "الجلسة الأسبوعية",
        day: "الخميس",
        time: "7:30 مساءً",
        venue: "مركز التأصيل العلمي",
        district: "الصليبيخات",
        note: "مناسب للرجال والنساء — متاح أونلاين أيضاً.",
      },
    ],
  },
  // ─── دروس جديدة ──────────────────────────────────────────────────
  {
    id: "tafsir-juzama-weekly",
    provider: "جامع الأمير فيصل",
    teacher: "الشيخ فهد بن سليمان العجلان",
    teacherImage: "",
    title: "تفسير جزء عم",
    shortDescription:
      "درس أسبوعي في تفسير جزء عم — مناسب للمبتدئين وطلاب الحلقات القرآنية.",
    category: "weekly",
    tags: ["تفسير", "قرآن", "جزء عم", "أسبوعي", "حضوري"],
    hasWomenSection: false,
    detailIntro: "شرح ميسّر لجزء عم يجمع بين التفسير البياني والتفسير العلمي المختصر.",
    sessions: [
      {
        label: "المجلس الأسبوعي",
        day: "الأثنين",
        time: "بعد صلاة العشاء",
        venue: "جامع الأمير فيصل",
        district: "الرميثية",
        note: "للرجال — التسجيل متاح على تليجرام.",
      },
    ],
  },
  {
    id: "hadith-riyad-salihin-weekly",
    provider: "مسجد البر والإحسان",
    teacher: "الشيخ حسن بن علي الحسيني",
    teacherImage: "",
    title: "شرح رياض الصالحين",
    shortDescription:
      "درس أسبوعي في شرح كتاب رياض الصالحين للإمام النووي — نقطة البداية في باب الجهاد.",
    category: "weekly",
    tags: ["حديث", "رياض الصالحين", "أسبوعي", "حضوري"],
    hasWomenSection: true,
    detailIntro: "شرح هادئ ومنهجي لرياض الصالحين يتناول الأحاديث بالشرح والاستنباط والتطبيق.",
    sessions: [
      {
        label: "المجلس الأسبوعي",
        day: "الأربعاء",
        time: "7:30 مساءً",
        venue: "مسجد البر والإحسان",
        district: "سلوى",
        note: "متاح للرجال والنساء في قاعات مستقلة.",
      },
    ],
  },
  {
    id: "aqeedah-wasitiyya-advanced-weekly",
    provider: "مركز الدراسات الشرعية",
    teacher: "د. عبدالله بن فهد المطلق",
    teacherImage: "",
    title: "شرح العقيدة الواسطية",
    shortDescription:
      "درس أسبوعي متخصص في العقيدة السنية — يُعقد كل أسبوع ببيان أصول الإيمان والرد على المخالفين.",
    category: "weekly",
    tags: ["عقيدة", "واسطية", "ابن تيمية", "أسبوعي"],
    hasWomenSection: false,
    startDate: "2026-09-01",
    detailIntro: "شرح علمي رصين للعقيدة الواسطية يُعنى بالمقارنة المذهبية والدليل النقلي والعقلي.",
    sessions: [
      {
        label: "المجلس الأسبوعي",
        day: "السبت",
        time: "8:00 مساءً",
        venue: "مركز الدراسات الشرعية",
        district: "العارضية",
        note: "للرجال — مُيسَّر ومتاح للتسجيل أونلاين.",
      },
    ],
  },
  {
    id: "fiqh-ibadaat-course",
    provider: "مركز الفقه الكويتي",
    teacher: "د. يوسف بن أحمد القاسم",
    teacherImage: "",
    title: "دورة الفقه العملي للعبادات",
    shortDescription:
      "دورة مكثفة في فقه الطهارة والصلاة والصيام والزكاة — مُصمَّمة للمبتدئ الجاد الذي يريد تأصيلاً شرعياً.",
    category: "course",
    tags: ["فقه", "عبادات", "دورة علمية", "طهارة", "صلاة"],
    hasWomenSection: true,
    startDate: "2026-08-10",
    detailIntro: "دورة متكاملة تُغطي أبواب العبادات الرئيسية وفق منهج الفقه المقارن بأسلوب عملي تطبيقي.",
    sessions: [
      {
        label: "الدرس الأول — الطهارة",
        day: "الخميس",
        time: "5:00 عصراً",
        venue: "مركز الفقه الكويتي",
        district: "الخالدية",
        note: "دورة مكثفة على مدار أربعة أيام — الأماكن محدودة.",
      },
      {
        label: "الدرس الثاني — الصلاة",
        day: "الجمعة",
        time: "5:00 عصراً",
        venue: "مركز الفقه الكويتي",
        district: "الخالدية",
      },
    ],
  },
  {
    id: "seerah-ghazawaat-weekly",
    provider: "جمعية إحياء التراث الإسلامي",
    teacher: "الشيخ عبدالرحمن بن ناصر البراك (تلاوةً من دروسه)",
    teacherImage: "",
    title: "غزوات النبي ﷺ",
    shortDescription:
      "سلسلة تفصيلية في غزوات الرسول ﷺ — الاستعداد والمواقف والدروس المستفادة.",
    category: "weekly",
    tags: ["سيرة", "غزوات", "تاريخ", "أسبوعي"],
    hasWomenSection: true,
    detailIntro: "عرض تحليلي للغزوات النبوية بأسلوب تاريخي ومنهج تربوي — يستخلص من كل معركة دروساً في الإيمان والقيادة.",
    sessions: [
      {
        label: "المجلس الأسبوعي",
        day: "الثلاثاء",
        time: "8:30 مساءً",
        venue: "جامع الرحمة",
        district: "الجابرية",
        note: "بث مباشر على يوتيوب — الأرشيف متاح.",
        liveUrl: "https://youtube.com/@ihya-seerah-live",
      },
    ],
  },
  {
    id: "aqeeda-tahawiyya-weekly",
    provider: "دار ابن رجب العلمية",
    teacher: "الشيخ عبدالله بن سالم الجهني",
    teacherImage: "",
    title: "شرح العقيدة الطحاوية",
    shortDescription: "شرح متن العقيدة الطحاوية للإمام أبي جعفر الطحاوي — مرجع السنة في مسائل الاعتقاد.",
    category: "weekly",
    tags: ["عقيدة", "أسبوعي", "طحاوية", "حضوري"],
    hasWomenSection: false,
    sessions: [
      {
        label: "المجلس الأسبوعي",
        day: "الأحد",
        time: "7:30 مساءً",
        venue: "مسجد الشيخ محمد بن عبدالوهاب",
        district: "الروضة",
        note: "يُشرح المتن بالنص والشرح الموسّع مع الأدلة.",
      },
    ],
  },
  {
    id: "arabic-nahw-beginner-course",
    provider: "معهد اللغة العربية للجميع",
    teacher: "الشيخ أحمد بن عبدالله القحطاني",
    teacherImage: "",
    title: "دورة النحو للمبتدئين",
    shortDescription: "دورة علمية مكثفة في أساسيات النحو العربي — الإعراب والجمل والتراكيب لطالب العلم المبتدئ.",
    category: "course",
    tags: ["نحو", "لغة عربية", "دورة علمية", "مبتدئ"],
    hasWomenSection: true,
    sessions: [
      {
        label: "الفصل الأول",
        day: "الثلاثاء والخميس",
        time: "6:00 مساءً",
        venue: "مركز اللغة العربية",
        district: "السالمية",
        note: "تستغرق الدورة 8 أسابيع — 16 محاضرة.",
      },
    ],
  },
  {
    id: "fiqh-purification-program",
    provider: "منتدى العلوم الشرعية",
    teacher: "الشيخ فيصل بن محمد المشعل",
    teacherImage: "",
    title: "أحكام الطهارة من أوّلها إلى آخرها",
    shortDescription: "برنامج شامل في أحكام الطهارة من المياه والحدث والنجاسة — مع التطبيق العملي.",
    category: "program",
    tags: ["فقه", "طهارة", "برنامج تعليمي", "تطبيق"],
    hasWomenSection: true,
    sessions: [
      {
        label: "الجلسة الأسبوعية",
        day: "الأربعاء",
        time: "9:00 مساءً",
        venue: "جامع عمر بن الخطاب",
        district: "بيان",
        note: "ستة أسابيع — مع اختبار تحريري في النهاية.",
      },
    ],
  },
  {
    id: "tazkiya-nafs-weekly",
    provider: "مجلس التزكية",
    teacher: "الشيخ حامد بن عبدالرحمن الهاشمي",
    teacherImage: "",
    title: "تزكية النفس وإصلاح القلب",
    shortDescription: "درس أسبوعي في الرقائق والزهد وتصفية النفس من الأمراض القلبية — العجب والكبر والغفلة.",
    category: "weekly",
    tags: ["رقائق", "تزكية", "قلب", "أسبوعي"],
    hasWomenSection: true,
    sessions: [
      {
        label: "المجلس الأسبوعي",
        day: "الخميس",
        time: "7:00 مساءً",
        venue: "جامع النور",
        district: "الفروانية",
        note: "اجتماع هادئ مخصص للتدبر والتأمل في سير الصالحين.",
      },
    ],
  },
  {
    id: "hadith-sahih-bukhari-read",
    provider: "مؤسسة السنة",
    teacher: "الشيخ خالد بن عبدالله البسام",
    teacherImage: "",
    title: "قراءة صحيح البخاري",
    shortDescription: "جلسة علمية منتظمة لقراءة صحيح البخاري بالمتن مع الفوائد المنتقاة من شراح الكتاب.",
    category: "weekly",
    tags: ["حديث", "صحيح البخاري", "أسبوعي", "قراءة"],
    hasWomenSection: false,
    sessions: [
      {
        label: "المجلس الأسبوعي",
        day: "الاثنين",
        time: "8:00 مساءً",
        venue: "المركز الإسلامي",
        district: "القادسية",
        note: "القراءة مع انتخاب الشرح من فتح الباري.",
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
