/* بيانات الخرائط الذهنية لجميع الأقسام */

export interface MindMapNode {
  id: string;
  label: string;
  children?: MindMapNode[];
  color?: string;
  href?: string;
}

export interface MindMap {
  id: string;
  title: string;
  category: string;
  description?: string;
  root: MindMapNode;
}

export const MIND_MAPS: MindMap[] = [
  /* ═══ 1. العقيدة الإسلامية ═══ */
  {
    id: "aqeeda",
    title: "العقيدة الإسلامية",
    category: "العقيدة والتوحيد",
    description: "أصول الإيمان ومسائل العقيدة على منهج أهل السنة والجماعة",
    root: {
      id: "r-aqeeda",
      label: "العقيدة الإسلامية",
      children: [
        {
          id: "tawhid",
          label: "التوحيد",
          href: "/tawhid",
          children: [
            { id: "tw-1", label: "توحيد الربوبية" },
            { id: "tw-2", label: "توحيد الألوهية" },
            { id: "tw-3", label: "توحيد الأسماء والصفات" },
          ],
        },
        {
          id: "arkan-iman",
          label: "أركان الإيمان الستة",
          href: "/arkan-iman",
          children: [
            { id: "ai-1", label: "الإيمان بالله" },
            { id: "ai-2", label: "الإيمان بالملائكة" },
            { id: "ai-3", label: "الإيمان بالكتب" },
            { id: "ai-4", label: "الإيمان بالرسل" },
            { id: "ai-5", label: "الإيمان باليوم الآخر" },
            { id: "ai-6", label: "الإيمان بالقدر" },
          ],
        },
        {
          id: "asma-husna",
          label: "الأسماء الحسنى",
          href: "/asma-husna",
          children: [
            { id: "as-1", label: "أسماء الذات" },
            { id: "as-2", label: "أسماء الكمال" },
            { id: "as-3", label: "أسماء الجمال والجلال" },
          ],
        },
        {
          id: "ghayb",
          label: "الغيب والآخرة",
          children: [
            { id: "gb-1", label: "أشراط الساعة", href: "/alamat-saah" },
            { id: "gb-2", label: "الجنة والنار", href: "/janna-naar" },
            { id: "gb-3", label: "الملائكة", href: "/malaika" },
            { id: "gb-4", label: "الأنبياء والرسل", href: "/anbiya" },
          ],
        },
      ],
    },
  },

  /* ═══ 2. الفقه الإسلامي ═══ */
  {
    id: "fiqh",
    title: "الفقه الإسلامي",
    category: "الفقه والأحكام",
    description: "أقسام الفقه الإسلامي وأبوابه من الطهارة إلى المعاملات",
    root: {
      id: "r-fiqh",
      label: "الفقه الإسلامي",
      children: [
        {
          id: "ibadat",
          label: "العبادات",
          children: [
            { id: "ib-1", label: "الطهارة", href: "/tahara" },
            { id: "ib-2", label: "الصلاة", href: "/salah-guide" },
            { id: "ib-3", label: "الزكاة", href: "/zakat" },
            { id: "ib-4", label: "الصيام", href: "/sawm" },
            { id: "ib-5", label: "الحج والعمرة", href: "/hajj" },
          ],
        },
        {
          id: "muamalat",
          label: "المعاملات",
          children: [
            { id: "mu-1", label: "البيع والتجارة" },
            { id: "mu-2", label: "النكاح والطلاق" },
            { id: "mu-3", label: "المواريث والفرائض", href: "/mawarith" },
            { id: "mu-4", label: "الوقف والوصية" },
          ],
        },
        {
          id: "madhahib",
          label: "المذاهب الأربعة",
          href: "/madhahib",
          children: [
            { id: "md-1", label: "الحنفي" },
            { id: "md-2", label: "المالكي" },
            { id: "md-3", label: "الشافعي" },
            { id: "md-4", label: "الحنبلي" },
          ],
        },
        {
          id: "usul",
          label: "أصول الفقه",
          children: [
            { id: "us-1", label: "القواعد الفقهية", href: "/fiqh-qawaid" },
            { id: "us-2", label: "مصادر الشريعة" },
            { id: "us-3", label: "الاجتهاد والتقليد" },
          ],
        },
        {
          id: "ahkam",
          label: "الأحكام الشرعية",
          children: [
            { id: "ah-1", label: "الفتاوى", href: "/fatwa" },
            { id: "ah-2", label: "أحكام الجنائز", href: "/janaza" },
            { id: "ah-3", label: "الباحث الشرعي", href: "/scholarly-research" },
          ],
        },
      ],
    },
  },

  /* ═══ 3. علوم القرآن ═══ */
  {
    id: "quran-sciences",
    title: "علوم القرآن الكريم",
    category: "القرآن الكريم",
    description: "علوم القرآن من التجويد إلى التفسير والإعجاز",
    root: {
      id: "r-quran",
      label: "القرآن الكريم",
      children: [
        {
          id: "tajweed",
          label: "علم التجويد",
          href: "/quran/tajweed",
          children: [
            { id: "tj-1", label: "مخارج الحروف" },
            { id: "tj-2", label: "صفات الحروف" },
            { id: "tj-3", label: "أحكام النون والميم" },
            { id: "tj-4", label: "المدود والمفصل" },
            { id: "tj-5", label: "الوقف والابتداء" },
          ],
        },
        {
          id: "ulum",
          label: "علوم القرآن",
          href: "/ulum-quran",
          children: [
            { id: "ul-1", label: "أسباب النزول" },
            { id: "ul-2", label: "الناسخ والمنسوخ" },
            { id: "ul-3", label: "المكي والمدني" },
            { id: "ul-4", label: "القراءات القرآنية" },
          ],
        },
        {
          id: "tafseer",
          label: "التفسير",
          children: [
            { id: "tf-1", label: "التفسير بالمأثور" },
            { id: "tf-2", label: "التفسير بالرأي" },
            { id: "tf-3", label: "قصص السور", href: "/quran/surah-stories" },
          ],
        },
        {
          id: "eijaz",
          label: "الإعجاز القرآني",
          children: [
            { id: "ei-1", label: "الإعجاز اللغوي" },
            { id: "ei-2", label: "الإعجاز العلمي", href: "/miracles" },
            { id: "ei-3", label: "الإعجاز العددي" },
          ],
        },
        {
          id: "quran-tools",
          label: "أدوات المصحف",
          children: [
            { id: "qt-1", label: "المصحف الشريف", href: "/quran" },
            { id: "qt-2", label: "الورد اليومي", href: "/daily-wird" },
            { id: "qt-3", label: "أدعية القرآن", href: "/duas-quran" },
          ],
        },
      ],
    },
  },

  /* ═══ 4. الحديث النبوي ═══ */
  {
    id: "hadith-sciences",
    title: "علوم الحديث النبوي",
    category: "الحديث والسنة",
    description: "منهج علماء الحديث في الرواية والدراية والتصنيف",
    root: {
      id: "r-hadith",
      label: "الحديث النبوي",
      children: [
        {
          id: "mustalah",
          label: "مصطلح الحديث",
          href: "/hadith-science",
          children: [
            { id: "ms-1", label: "الحديث الصحيح" },
            { id: "ms-2", label: "الحديث الحسن" },
            { id: "ms-3", label: "الحديث الضعيف" },
            { id: "ms-4", label: "الموضوع والمكذوب" },
          ],
        },
        {
          id: "riwaya",
          label: "الرواية والسند",
          children: [
            { id: "rw-1", label: "شروط الراوي" },
            { id: "rw-2", label: "علم الجرح والتعديل" },
            { id: "rw-3", label: "أنواع التحمل والأداء" },
          ],
        },
        {
          id: "kutub",
          label: "كتب الحديث",
          children: [
            { id: "kb-1", label: "الصحيحان (البخاري ومسلم)" },
            { id: "kb-2", label: "السنن الأربع" },
            { id: "kb-3", label: "الأربعون النووية", href: "/arbaeen-nawawi" },
            { id: "kb-4", label: "الأحاديث النبوية", href: "/hadith" },
          ],
        },
        {
          id: "sunnah-topics",
          label: "موضوعات السنة",
          children: [
            { id: "st-1", label: "الشمائل المحمدية", href: "/shamael" },
            { id: "st-2", label: "الوصايا النبوية", href: "/wasaya-nabawiyya" },
            { id: "st-3", label: "الطب النبوي", href: "/prophetic-medicine" },
          ],
        },
      ],
    },
  },

  /* ═══ 5. العبادة والأذكار ═══ */
  {
    id: "ibadah-map",
    title: "العبادة والأذكار",
    category: "العبادة والأذكار",
    description: "منظومة العبادة اليومية من الصلاة إلى الأذكار والأدعية",
    root: {
      id: "r-ibadah",
      label: "العبادة اليومية",
      children: [
        {
          id: "salah",
          label: "الصلاة",
          children: [
            { id: "sl-1", label: "مواقيت الصلاة", href: "/prayer-times" },
            { id: "sl-2", label: "دليل الصلاة الكامل", href: "/salah-guide" },
            { id: "sl-3", label: "فضائل الصلاة", href: "/prayer-ranks" },
            { id: "sl-4", label: "القبلة", href: "/qibla" },
          ],
        },
        {
          id: "dhikr",
          label: "الأذكار والأدعية",
          children: [
            { id: "dk-1", label: "أذكار الصباح والمساء", href: "/adhkar" },
            { id: "dk-2", label: "الأدعية الشرعية", href: "/duas" },
            { id: "dk-3", label: "التسبيح", href: "/tasbih" },
            { id: "dk-4", label: "الورد اليومي من القرآن", href: "/daily-wird" },
          ],
        },
        {
          id: "sunan",
          label: "السنن والآداب",
          children: [
            { id: "sn-1", label: "السنن اليومية", href: "/sunan-yawmiyya" },
            { id: "sn-2", label: "الأخلاق الإسلامية", href: "/akhlaq" },
            { id: "sn-3", label: "التوبة والاستغفار", href: "/tawba" },
            { id: "sn-4", label: "الرقائق والزهد", href: "/raqaiq" },
          ],
        },
        {
          id: "occasions",
          label: "المناسبات والشعائر",
          children: [
            { id: "oc-1", label: "الصيام وأحكامه", href: "/sawm" },
            { id: "oc-2", label: "الحج والعمرة", href: "/hajj" },
            { id: "oc-3", label: "المناسبات الإسلامية", href: "/occasions" },
          ],
        },
      ],
    },
  },

  /* ═══ 6. السيرة النبوية ═══ */
  {
    id: "seerah",
    title: "السيرة النبوية الشريفة",
    category: "السيرة والتاريخ",
    description: "مراحل السيرة النبوية من المولد إلى الوفاة",
    root: {
      id: "r-seerah",
      label: "السيرة النبوية",
      children: [
        {
          id: "mecca-phase",
          label: "المرحلة المكية (٥٧٠–٦٢٢م)",
          children: [
            { id: "mk-1", label: "مولده ﷺ ونشأته" },
            { id: "mk-2", label: "البعثة وبدء الوحي" },
            { id: "mk-3", label: "الإسراء والمعراج" },
            { id: "mk-4", label: "الهجرة إلى الحبشة" },
          ],
        },
        {
          id: "medina-phase",
          label: "المرحلة المدنية (٦٢٢–٦٣٢م)",
          children: [
            { id: "md-1", label: "الهجرة إلى المدينة" },
            { id: "md-2", label: "الغزوات والسرايا" },
            { id: "md-3", label: "فتح مكة" },
            { id: "md-4", label: "حجة الوداع" },
          ],
        },
        {
          id: "companions",
          label: "الصحابة الكرام",
          href: "/sahabah",
          children: [
            { id: "cp-1", label: "العشرة المبشرون بالجنة" },
            { id: "cp-2", label: "أمهات المؤمنين" },
            { id: "cp-3", label: "أصحاب بدر" },
          ],
        },
        {
          id: "prophets-chain",
          label: "الأنبياء والرسل",
          href: "/anbiya",
          children: [
            { id: "pr-1", label: "أولو العزم من الرسل" },
            { id: "pr-2", label: "قصص الأنبياء", href: "/prophets" },
          ],
        },
      ],
    },
  },

  /* ═══ 7. طرق التعلم الإسلامي ═══ */
  {
    id: "learning-path",
    title: "طريق طالب العلم",
    category: "التعلّم والأدوات",
    description: "المراحل والأولويات لطالب العلم الشرعي المبتدئ والمتوسط والمتقدم",
    root: {
      id: "r-learning",
      label: "طريق طالب العلم",
      children: [
        {
          id: "beginner",
          label: "المرحلة الأولى: الأساسيات",
          children: [
            { id: "bg-1", label: "تعلم الفاتحة والسور القصيرة" },
            { id: "bg-2", label: "أذكار الصباح والمساء", href: "/adhkar" },
            { id: "bg-3", label: "أركان الإسلام والإيمان", href: "/arkan" },
            { id: "bg-4", label: "أحكام الطهارة والصلاة", href: "/tahara" },
          ],
        },
        {
          id: "intermediate",
          label: "المرحلة الثانية: التأصيل",
          children: [
            { id: "im-1", label: "حفظ الأربعين النووية", href: "/arbaeen-nawawi" },
            { id: "im-2", label: "تعلم التجويد", href: "/quran/tajweed" },
            { id: "im-3", label: "دراسة العقيدة", href: "/tawhid" },
            { id: "im-4", label: "أصول الفقه والقواعد", href: "/fiqh-qawaid" },
          ],
        },
        {
          id: "advanced",
          label: "المرحلة الثالثة: التعمق",
          children: [
            { id: "ad-1", label: "علوم الحديث", href: "/hadith-science" },
            { id: "ad-2", label: "التفسير وعلوم القرآن", href: "/ulum-quran" },
            { id: "ad-3", label: "الفقه المقارن والمذاهب", href: "/madhahib" },
            { id: "ad-4", label: "السيرة والتاريخ", href: "/seerah" },
          ],
        },
        {
          id: "tools",
          label: "أدوات التعلم",
          children: [
            { id: "tl-1", label: "المسابقة التعليمية", href: "/quiz" },
            { id: "tl-2", label: "بطاقات المراجعة", href: "/flashcards" },
            { id: "tl-3", label: "خطة التعلم", href: "/learning-plan" },
            { id: "tl-4", label: "المكتبة الشرعية", href: "/library" },
          ],
        },
      ],
    },
  },

  /* ═══ 8. الأخلاق والتزكية ═══ */
  {
    id: "akhlaq",
    title: "الأخلاق والتزكية",
    category: "الدروس والمكتبة",
    description: "منظومة الأخلاق الإسلامية وتزكية النفس",
    root: {
      id: "r-akhlaq",
      label: "الأخلاق والتزكية",
      children: [
        {
          id: "virtues",
          label: "الأخلاق الحميدة",
          href: "/akhlaq",
          children: [
            { id: "vt-1", label: "الصدق والأمانة" },
            { id: "vt-2", label: "الصبر والشكر" },
            { id: "vt-3", label: "التواضع والزهد" },
            { id: "vt-4", label: "الكرم وصلة الرحم" },
          ],
        },
        {
          id: "vices",
          label: "الأخلاق الذميمة",
          children: [
            { id: "vc-1", label: "الكبر والغرور" },
            { id: "vc-2", label: "الغيبة والنميمة" },
            { id: "vc-3", label: "الحسد والبغضاء" },
          ],
        },
        {
          id: "tazkiya",
          label: "التزكية والسلوك",
          children: [
            { id: "tz-1", label: "التوبة والاستغفار", href: "/tawba" },
            { id: "tz-2", label: "الرقائق والمواعظ", href: "/raqaiq" },
            { id: "tz-3", label: "فضائل الأعمال", href: "/fadail-aamal" },
            { id: "tz-4", label: "حكم السلف الصالح", href: "/hikam-salaf" },
          ],
        },
        {
          id: "adab",
          label: "آداب الحياة الإسلامية",
          children: [
            { id: "ab-1", label: "آداب طالب العلم", href: "/adab-talab-ilm" },
            { id: "ab-2", label: "الآداب الاجتماعية" },
            { id: "ab-3", label: "آداب القرآن والصلاة" },
          ],
        },
      ],
    },
  },
];

export const MIND_MAP_CATEGORIES = [
  "الكل",
  "القرآن الكريم",
  "الحديث والسنة",
  "العقيدة والتوحيد",
  "الفقه والأحكام",
  "العبادة والأذكار",
  "السيرة والتاريخ",
  "الدروس والمكتبة",
  "التعلّم والأدوات",
] as const;
