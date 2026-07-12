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
  {
    id: "arabic-sciences",
    title: "علوم اللغة العربية",
    category: "اللغة والبلاغة",
    description: "فروع اللغة العربية وعلوم البيان والبلاغة وأهميتها في فهم القرآن",
    root: {
      id: "r-arabic",
      label: "علوم اللغة العربية",
      children: [
        {
          id: "nahw",
          label: "النحو والصرف",
          children: [
            { id: "nh-1", label: "الإعراب والبناء" },
            { id: "nh-2", label: "أقسام الكلام: اسم وفعل وحرف" },
            { id: "nh-3", label: "المرفوعات والمنصوبات والمجرورات" },
            { id: "nh-4", label: "الصرف واشتقاق الكلمات" },
          ],
        },
        {
          id: "balaghah",
          label: "البلاغة",
          children: [
            { id: "bl-1", label: "علم المعاني" },
            { id: "bl-2", label: "علم البيان (الاستعارة والتشبيه والكناية)" },
            { id: "bl-3", label: "علم البديع" },
            { id: "bl-4", label: "الإعجاز البلاغي في القرآن" },
          ],
        },
        {
          id: "lugha-tools",
          label: "أدوات اللغة",
          children: [
            { id: "lt-1", label: "المعاجم اللغوية (لسان العرب، القاموس المحيط)" },
            { id: "lt-2", label: "غريب القرآن والحديث" },
            { id: "lt-3", label: "المشترك اللفظي والترادف" },
          ],
        },
        {
          id: "arabic-importance",
          label: "أهمية العربية في الشريعة",
          children: [
            { id: "ai-1", label: "شرط فهم القرآن والسنة" },
            { id: "ai-2", label: "دورها في استنباط الأحكام" },
            { id: "ai-3", label: "الفصاحة والبيان النبوي" },
          ],
        },
      ],
    },
  },
  {
    id: "tafsir-sciences",
    title: "التفسير وعلومه",
    category: "القرآن الكريم",
    description: "طرق التفسير وأنواعه وقواعده وأبرز المفسرين في التاريخ الإسلامي",
    root: {
      id: "r-tafsir",
      label: "التفسير وعلومه",
      children: [
        {
          id: "tafsir-types",
          label: "أنواع التفسير",
          children: [
            { id: "tt-1", label: "التفسير بالمأثور (الأثر والنقل)" },
            { id: "tt-2", label: "التفسير بالرأي المحمود والمذموم" },
            { id: "tt-3", label: "التفسير الإشاري (الصوفي)" },
            { id: "tt-4", label: "التفسير العلمي" },
          ],
        },
        {
          id: "tafsir-rules",
          label: "قواعد التفسير",
          children: [
            { id: "tr-1", label: "تفسير القرآن بالقرآن" },
            { id: "tr-2", label: "تفسير القرآن بالسنة" },
            { id: "tr-3", label: "تفسير القرآن بأقوال الصحابة" },
            { id: "tr-4", label: "الرجوع إلى اللغة العربية" },
          ],
        },
        {
          id: "tafsir-books",
          label: "أبرز كتب التفسير",
          children: [
            { id: "tb-1", label: "جامع البيان — الطبري" },
            { id: "tb-2", label: "الكشاف — الزمخشري" },
            { id: "tb-3", label: "تفسير القرآن العظيم — ابن كثير" },
            { id: "tb-4", label: "الجامع لأحكام القرآن — القرطبي" },
            { id: "tb-5", label: "فتح القدير — الشوكاني" },
          ],
        },
        {
          id: "tafsir-scholars",
          label: "أبرز المفسرين",
          children: [
            { id: "ts-1", label: "عبدالله بن عباس — ترجمان القرآن" },
            { id: "ts-2", label: "ابن جرير الطبري" },
            { id: "ts-3", label: "ابن كثير الدمشقي" },
            { id: "ts-4", label: "الإمام القرطبي" },
          ],
        },
      ],
    },
  },
  {
    id: "faraid-mirath",
    title: "علم الفرائض والمواريث",
    category: "الفقه والأحكام",
    description: "أحكام المواريث وأسبابها وشروطها وطريقة حساب الأنصبة",
    root: {
      id: "r-faraid",
      label: "علم الفرائض",
      children: [
        {
          id: "faraid-bases",
          label: "أسباب الإرث وشروطه",
          children: [
            { id: "fb-1", label: "أسباب الإرث: النكاح والنسب والولاء" },
            { id: "fb-2", label: "شروط الإرث: موت المورّث وحياة الوارث" },
            { id: "fb-3", label: "موانع الإرث: القتل والردة والرق" },
          ],
        },
        {
          id: "faraid-portions",
          label: "الأنصبة المقدّرة",
          children: [
            { id: "fp-1", label: "النصف: الزوج والبنت الواحدة وبنت الابن" },
            { id: "fp-2", label: "الربع: الزوج مع الفرع والزوجة بلا فرع" },
            { id: "fp-3", label: "الثمن: الزوجة مع الفرع" },
            { id: "fp-4", label: "الثلثان: البنتان فأكثر" },
            { id: "fp-5", label: "الثلث: الأم والاثنان من الإخوة الأم" },
            { id: "fp-6", label: "السدس: الأب أو الأم مع الفرع" },
          ],
        },
        {
          id: "faraid-rules",
          label: "قواعد المواريث",
          children: [
            { id: "fr-1", label: "التعصيب: الذكور يرثون الباقي" },
            { id: "fr-2", label: "العَوْل: زيادة السهام وتخفيضها" },
            { id: "fr-3", label: "الرَّدّ: إعادة الباقي للورثة" },
            { id: "fr-4", label: "الحجب: الحرمان والنقص" },
          ],
        },
      ],
    },
  },
  {
    id: "zuhd-raqaiq",
    title: "الرقائق والزهد",
    category: "العبادة والأذكار",
    description: "مفهوم الزهد والرقائق وفضائل الأعمال القلبية في الإسلام",
    root: {
      id: "r-zuhd",
      label: "الرقائق والزهد",
      children: [
        {
          id: "zuhd-def",
          label: "مفهوم الزهد",
          children: [
            { id: "zd-1", label: "الزهد في الدنيا" },
            { id: "zd-2", label: "الفرق بين الزهد والفقر" },
            { id: "zd-3", label: "زهد النبي ﷺ والصحابة" },
          ],
        },
        {
          id: "heart-diseases",
          label: "أمراض القلوب وعلاجها",
          children: [
            { id: "hd-1", label: "الرياء وعلاجه بالإخلاص" },
            { id: "hd-2", label: "العُجب وعلاجه بالتواضع" },
            { id: "hd-3", label: "الكبر وعلاجه بذكر المآل" },
            { id: "hd-4", label: "الحسد وعلاجه بالرضا والشكر" },
            { id: "hd-5", label: "الغفلة وعلاجها بالذكر والتفكر" },
          ],
        },
        {
          id: "heart-virtues",
          label: "منازل القلوب الحسنة",
          children: [
            { id: "hv-1", label: "التوبة والإنابة" },
            { id: "hv-2", label: "الصبر والشكر" },
            { id: "hv-3", label: "التوكل على الله" },
            { id: "hv-4", label: "الرجاء والخوف" },
            { id: "hv-5", label: "المحبة والإنس بالله" },
            { id: "hv-6", label: "اليقين والرضا" },
          ],
        },
        {
          id: "raqaiq-books",
          label: "كتب الرقائق",
          children: [
            { id: "rb-1", label: "إحياء علوم الدين — الغزالي" },
            { id: "rb-2", label: "مدارج السالكين — ابن القيم" },
            { id: "rb-3", label: "الرسالة القشيرية" },
            { id: "rb-4", label: "منهاج القاصدين — ابن قدامة" },
          ],
        },
      ],
    },
  },
  {
    id: "usul-fiqh",
    title: "أصول الفقه",
    category: "الفقه والأحكام",
    description: "قواعد ومصادر الاستنباط الفقهي وطرق الاجتهاد",
    root: {
      id: "r-usul",
      label: "أصول الفقه",
      children: [
        {
          id: "masadir",
          label: "مصادر التشريع",
          children: [
            { id: "ms-1", label: "القرآن الكريم" },
            { id: "ms-2", label: "السنة النبوية" },
            { id: "ms-3", label: "الإجماع" },
            { id: "ms-4", label: "القياس" },
          ],
        },
        {
          id: "ahkam-shari",
          label: "الأحكام الشرعية",
          href: "/rulings",
          children: [
            { id: "ah-1", label: "الواجب والمستحب" },
            { id: "ah-2", label: "المحرم والمكروه" },
            { id: "ah-3", label: "المباح" },
            { id: "ah-4", label: "الصحيح والفاسد والباطل" },
          ],
        },
        {
          id: "qawaid-usul",
          label: "القواعد الأصولية",
          children: [
            { id: "qu-1", label: "الأمر للوجوب حتى يصرفه صارف" },
            { id: "qu-2", label: "النهي للتحريم حتى يصرفه صارف" },
            { id: "qu-3", label: "الأصل في الأشياء الإباحة" },
            { id: "qu-4", label: "الاجتهاد لا يُنقض بالاجتهاد" },
          ],
        },
        {
          id: "ijtihad",
          label: "الاجتهاد والتقليد",
          children: [
            { id: "ij-1", label: "شروط المجتهد" },
            { id: "ij-2", label: "أنواع الاجتهاد" },
            { id: "ij-3", label: "التقليد وشروطه" },
            { id: "ij-4", label: "المذاهب الأربعة", href: "/fiqh" },
          ],
        },
      ],
    },
  },
  {
    id: "tajweed-sciences",
    title: "علم التجويد",
    category: "القرآن الكريم",
    description: "أحكام تجويد القرآن الكريم ومخارج الحروف وصفاتها",
    root: {
      id: "r-tajweed",
      label: "علم التجويد",
      children: [
        {
          id: "makharij",
          label: "مخارج الحروف",
          children: [
            { id: "mk-1", label: "الجوف — حروف المد" },
            { id: "mk-2", label: "الحلق — الهمزة والهاء والعين والحاء والغين والخاء" },
            { id: "mk-3", label: "اللسان — ١٨ حرفاً" },
            { id: "mk-4", label: "الشفتان — الباء والميم والواو والفاء" },
          ],
        },
        {
          id: "ahkam-nun",
          label: "أحكام النون الساكنة والتنوين",
          children: [
            { id: "an-1", label: "الإظهار الحلقي" },
            { id: "an-2", label: "الإدغام بغنة وبغير غنة" },
            { id: "an-3", label: "الإقلاب" },
            { id: "an-4", label: "الإخفاء الحقيقي" },
          ],
        },
        {
          id: "madd",
          label: "أحكام المد",
          children: [
            { id: "md-1", label: "المد الطبيعي — حرفان" },
            { id: "md-2", label: "المد المتصل — واجب" },
            { id: "md-3", label: "المد المنفصل — جائز" },
            { id: "md-4", label: "المد العارض للسكون" },
          ],
        },
        {
          id: "sifat-huruf",
          label: "صفات الحروف",
          children: [
            { id: "sf-1", label: "الصفات ذات الأضداد: الهمس/الجهر" },
            { id: "sf-2", label: "الشدة والرخاوة والتوسط" },
            { id: "sf-3", label: "الاستعلاء والاستفال" },
            { id: "sf-4", label: "الإطباق والانفتاح" },
          ],
        },
      ],
    },
  },
  {
    id: "hadith-terminology",
    title: "مصطلح الحديث",
    category: "الحديث والسنة",
    description: "علوم الحديث ومصطلحاته وأنواع الأسانيد والرواة",
    root: {
      id: "r-mustalah",
      label: "مصطلح الحديث",
      children: [
        {
          id: "anwa-hadith",
          label: "أنواع الحديث",
          href: "/hadith-science",
          children: [
            { id: "nh-1", label: "الصحيح والحسن — مقبول" },
            { id: "nh-2", label: "الضعيف — مردود" },
            { id: "nh-3", label: "الموضوع — مكذوب" },
            { id: "nh-4", label: "المتواتر والآحاد" },
          ],
        },
        {
          id: "isnad-types",
          label: "أنواع الإسناد",
          children: [
            { id: "is-1", label: "المرفوع — إلى النبي ﷺ" },
            { id: "is-2", label: "الموقوف — إلى الصحابي" },
            { id: "is-3", label: "المقطوع — إلى التابعي" },
            { id: "is-4", label: "المرسل — انقطاع في الإسناد" },
          ],
        },
        {
          id: "jarh-tadil",
          label: "الجرح والتعديل",
          children: [
            { id: "jt-1", label: "مراتب التعديل" },
            { id: "jt-2", label: "مراتب الجرح" },
            { id: "jt-3", label: "الثقة والمجهول والمتروك" },
            { id: "jt-4", label: "أئمة الجرح والتعديل" },
          ],
        },
        {
          id: "kutub-hadith",
          label: "كتب الحديث الكبرى",
          href: "/hadith",
          children: [
            { id: "kh-1", label: "صحيح البخاري" },
            { id: "kh-2", label: "صحيح مسلم" },
            { id: "kh-3", label: "سنن الأربعة" },
            { id: "kh-4", label: "موطأ مالك ومسند أحمد" },
          ],
        },
      ],
    },
  },
  /* ═══ 17. التاريخ الإسلامي ═══ */
  {
    id: "islamic-history",
    title: "التاريخ الإسلامي",
    category: "السيرة والتاريخ",
    description: "حقب التاريخ الإسلامي من البعثة النبوية حتى العصر الحديث",
    root: {
      id: "r-history",
      label: "التاريخ الإسلامي",
      children: [
        {
          id: "hist-1",
          label: "العصر النبوي (610–632م)",
          children: [
            { id: "h1-1", label: "المرحلة المكية (610–622م)" },
            { id: "h1-2", label: "الهجرة النبوية (622م)" },
            { id: "h1-3", label: "المرحلة المدنية (622–632م)" },
            { id: "h1-4", label: "فتح مكة (630م)" },
          ],
        },
        {
          id: "hist-2",
          label: "عصر الخلافة الراشدة (632–661م)",
          href: "/seerah",
          children: [
            { id: "h2-1", label: "أبو بكر الصديق" },
            { id: "h2-2", label: "عمر بن الخطاب" },
            { id: "h2-3", label: "عثمان بن عفان" },
            { id: "h2-4", label: "علي بن أبي طالب" },
          ],
        },
        {
          id: "hist-3",
          label: "الدولة الأموية (661–750م)",
          children: [
            { id: "h3-1", label: "التوسع في الفتوحات" },
            { id: "h3-2", label: "الأندلس (711م)" },
            { id: "h3-3", label: "عمر بن عبد العزيز" },
          ],
        },
        {
          id: "hist-4",
          label: "الدولة العباسية (750–1258م)",
          children: [
            { id: "h4-1", label: "العصر الذهبي للحضارة" },
            { id: "h4-2", label: "ازدهار العلوم" },
            { id: "h4-3", label: "سقوط بغداد (1258م)" },
          ],
        },
        {
          id: "hist-5",
          label: "الدولة العثمانية (1299–1923م)",
          children: [
            { id: "h5-1", label: "فتح القسطنطينية (1453م)" },
            { id: "h5-2", label: "الامتداد في ثلاث قارات" },
            { id: "h5-3", label: "خلافة عثمانية لـ 600 سنة" },
          ],
        },
        {
          id: "hist-6",
          label: "العصر الحديث",
          children: [
            { id: "h6-1", label: "النهضة الإسلامية" },
            { id: "h6-2", label: "حركات التجديد" },
            { id: "h6-3", label: "التحديات المعاصرة" },
          ],
        },
      ],
    },
  },

  /* ═══ 18. الأسماء الحسنى ═══ */
  {
    id: "asma-husna",
    title: "الأسماء الحسنى",
    category: "العقيدة والتوحيد",
    description: "تصنيف أسماء الله الحسنى التسعة والتسعين حسب معانيها",
    root: {
      id: "r-asma",
      label: "الأسماء الحسنى",
      children: [
        {
          id: "asma-jalal",
          label: "أسماء الجلال",
          children: [
            { id: "aj-1", label: "الجليل · الكبير · العظيم" },
            { id: "aj-2", label: "القهار · الجبار · المتكبر" },
            { id: "aj-3", label: "العلي · المتعال" },
            { id: "aj-4", label: "القدوس · السلام" },
          ],
        },
        {
          id: "asma-jamal",
          label: "أسماء الجمال",
          children: [
            { id: "ajm-1", label: "الجميل · اللطيف · الكريم" },
            { id: "ajm-2", label: "الودود · الحليم · الصبور" },
            { id: "ajm-3", label: "الغفور · العفو · التواب" },
          ],
        },
        {
          id: "asma-rahmah",
          label: "أسماء الرحمة",
          children: [
            { id: "ar-1", label: "الرحمن · الرحيم" },
            { id: "ar-2", label: "الوهاب · الرزاق · المجيب" },
            { id: "ar-3", label: "المؤمن · الولي · الشكور" },
          ],
        },
        {
          id: "asma-qudra",
          label: "أسماء القدرة",
          children: [
            { id: "aq-1", label: "القادر · المقتدر · القوي" },
            { id: "aq-2", label: "العزيز · المتين · الوكيل" },
            { id: "aq-3", label: "الخالق · البارئ · المصور" },
          ],
        },
        {
          id: "asma-ilm",
          label: "أسماء العلم",
          children: [
            { id: "ai-1", label: "العليم · الخبير · الحكيم" },
            { id: "ai-2", label: "السميع · البصير · الشهيد" },
            { id: "ai-3", label: "الرقيب · المحيط · المحصي" },
          ],
        },
      ],
    },
  },

  /* ═══ 19. مناسك الحج ═══ */
  {
    id: "hajj-manasik",
    title: "مناسك الحج والعمرة",
    category: "الفقه والأحكام",
    description: "خطوات أداء الحج والعمرة بالترتيب الصحيح",
    root: {
      id: "r-hajj",
      label: "مناسك الحج والعمرة",
      children: [
        {
          id: "umra-steps",
          label: "أعمال العمرة",
          children: [
            { id: "u-1", label: "الإحرام من الميقات ونية العمرة" },
            { id: "u-2", label: "الطواف بالبيت سبع أشواط" },
            { id: "u-3", label: "السعي بين الصفا والمروة" },
            { id: "u-4", label: "التقصير أو الحلق — الحل" },
          ],
        },
        {
          id: "hajj-steps",
          label: "أعمال الحج",
          children: [
            { id: "h-1", label: "الإحرام بالحج يوم التروية (8 ذي الحجة)" },
            { id: "h-2", label: "الوقوف بعرفة (9 ذي الحجة)" },
            { id: "h-3", label: "المبيت بمزدلفة وجمع الحصى" },
            { id: "h-4", label: "رمي جمرة العقبة الكبرى" },
            { id: "h-5", label: "الذبح والحلق والتقصير" },
            { id: "h-6", label: "طواف الإفاضة (الزيارة)" },
            { id: "h-7", label: "المبيت بمنى أيام التشريق" },
            { id: "h-8", label: "رمي الجمرات الثلاث" },
            { id: "h-9", label: "طواف الوداع عند المغادرة" },
          ],
        },
        {
          id: "hajj-types",
          label: "أنواع الحج",
          children: [
            { id: "ht-1", label: "التمتع — الأيسر للآفاقيين" },
            { id: "ht-2", label: "الإفراد — الأكثر عملاً" },
            { id: "ht-3", label: "القران — الجمع بين النيتين" },
          ],
        },
        {
          id: "hajj-conditions",
          label: "شروط وجوب الحج",
          children: [
            { id: "hc-1", label: "الإسلام · البلوغ · العقل" },
            { id: "hc-2", label: "الاستطاعة الجسدية والمالية" },
            { id: "hc-3", label: "أمن الطريق" },
          ],
        },
      ],
    },
  },

  /* ═══ 20. الصحابة الكرام ═══ */
  {
    id: "sahabah",
    title: "أعيان الصحابة الكرام",
    category: "السيرة والتاريخ",
    description: "تصنيف الصحابة الكرام وأبرز فضائلهم وأدوارهم",
    root: {
      id: "r-sahaba",
      label: "الصحابة الكرام",
      children: [
        {
          id: "ashr-mubasshirun",
          label: "العشرة المبشرون بالجنة",
          children: [
            { id: "am-1", label: "أبو بكر الصديق — الخليفة الأول" },
            { id: "am-2", label: "عمر بن الخطاب — الفاروق" },
            { id: "am-3", label: "عثمان بن عفان — ذو النورين" },
            { id: "am-4", label: "علي بن أبي طالب — الكرار" },
            { id: "am-5", label: "طلحة · الزبير · سعد · سعيد · عبد الرحمن · أبو عبيدة" },
          ],
        },
        {
          id: "ahl-badr",
          label: "أهل بدر (313)",
          children: [
            { id: "ab-1", label: "المهاجرون الأوائل" },
            { id: "ab-2", label: "الأنصار — الأوس والخزرج" },
          ],
        },
        {
          id: "mukthirun",
          label: "المكثرون من الرواية",
          children: [
            { id: "mk-1", label: "أبو هريرة — 5374 حديثاً" },
            { id: "mk-2", label: "عبد الله بن عمر — 2630 حديثاً" },
            { id: "mk-3", label: "أنس بن مالك — 2286 حديثاً" },
            { id: "mk-4", label: "عائشة أم المؤمنين — 2210 حديثاً" },
          ],
        },
        {
          id: "ahl-ilm",
          label: "علماء الصحابة",
          children: [
            { id: "ae-1", label: "عبد الله بن مسعود — الفقه" },
            { id: "ae-2", label: "معاذ بن جبل — أعلم بالحلال والحرام" },
            { id: "ae-3", label: "زيد بن ثابت — علم الفرائض" },
            { id: "ae-4", label: "عبد الله بن عباس — حبر الأمة" },
          ],
        },
      ],
    },
  },
  /* ═══ 21. مقاصد الشريعة ═══ */
  {
    id: "maqasid-sharia",
    title: "مقاصد الشريعة الإسلامية",
    category: "الدروس والمكتبة",
    description: "الأهداف الكبرى لأحكام الشريعة الإسلامية وتصنيفاتها",
    root: {
      id: "r-maqasid",
      label: "مقاصد الشريعة الإسلامية",
      children: [
        {
          id: "mq-def",
          label: "تعريف المقاصد",
          children: [
            { id: "mq-d1", label: "الغايات التي تهدف إليها أحكام الشريعة" },
            { id: "mq-d2", label: "التأسيس: الجويني → الغزالي → الشاطبي" },
            { id: "mq-d3", label: "المرجع الأساسي: الموافقات للشاطبي" },
          ],
        },
        {
          id: "mq-daruriyyat",
          label: "المقاصد الضرورية (الكليات الخمس)",
          children: [
            { id: "mq-dr1", label: "حفظ الدين — قاعدة التوحيد والعبادة" },
            { id: "mq-dr2", label: "حفظ النفس — النهي عن القتل والأذى" },
            { id: "mq-dr3", label: "حفظ العقل — النهي عن المسكرات" },
            { id: "mq-dr4", label: "حفظ النسل — أحكام الزواج والأسرة" },
            { id: "mq-dr5", label: "حفظ المال — أحكام المعاملات والملكية" },
          ],
        },
        {
          id: "mq-hajiyyat",
          label: "المقاصد الحاجية",
          children: [
            { id: "mq-h1", label: "رفع الحرج والمشقة في العبادات" },
            { id: "mq-h2", label: "التيسير في المعاملات والعقود" },
            { id: "mq-h3", label: "الرخص الشرعية (سفر، مرض، إكراه)" },
          ],
        },
        {
          id: "mq-tahsiniyyat",
          label: "المقاصد التحسينية",
          children: [
            { id: "mq-t1", label: "مكارم الأخلاق والآداب" },
            { id: "mq-t2", label: "الطهارة والتجمّل في العبادة" },
            { id: "mq-t3", label: "الإحسان في التعامل مع الخلق" },
          ],
        },
        {
          id: "mq-scholars",
          label: "كبار علماء المقاصد",
          children: [
            { id: "mq-s1", label: "إمام الحرمين الجويني (ت 478ه)" },
            { id: "mq-s2", label: "حجة الإسلام الغزالي (ت 505ه)" },
            { id: "mq-s3", label: "إمام الشاطبي (ت 790ه) — الموافقات" },
            { id: "mq-s4", label: "الطاهر بن عاشور (ت 1393ه)" },
          ],
        },
      ],
    },
  },

  /* ═══ 22. علم البلاغة ═══ */
  {
    id: "arabic-balagha",
    title: "علم البلاغة العربية",
    category: "اللغة والبلاغة",
    description: "الفروع الثلاثة للبلاغة: المعاني والبيان والبديع وأبرز مسائلها",
    root: {
      id: "r-balagha",
      label: "علم البلاغة",
      children: [
        {
          id: "bl-intro",
          label: "مقدمة في البلاغة",
          children: [
            { id: "bl-i1", label: "البلاغة: مطابقة الكلام لمقتضى الحال" },
            { id: "bl-i2", label: "الفصاحة: خلوّ الكلام من العيوب" },
            { id: "bl-i3", label: "المرجع: دلائل الإعجاز لعبدالقاهر الجرجاني" },
          ],
        },
        {
          id: "bl-maani",
          label: "علم المعاني",
          children: [
            { id: "bl-m1", label: "الخبر والإنشاء" },
            { id: "bl-m2", label: "الإسناد والمسند إليه" },
            { id: "bl-m3", label: "القصر والوصل والفصل" },
            { id: "bl-m4", label: "الإيجاز والإطناب والمساواة" },
          ],
        },
        {
          id: "bl-bayan",
          label: "علم البيان",
          children: [
            { id: "bl-b1", label: "التشبيه: أركانه وأقسامه" },
            { id: "bl-b2", label: "الاستعارة: تصريحية ومكنية" },
            { id: "bl-b3", label: "المجاز: لغوي ومرسل وعقلي" },
            { id: "bl-b4", label: "الكناية: مطلوب بها لازم المعنى" },
          ],
        },
        {
          id: "bl-badi",
          label: "علم البديع",
          children: [
            { id: "bl-bd1", label: "المحسّنات اللفظية: الجناس والسجع" },
            { id: "bl-bd2", label: "المحسّنات المعنوية: الطباق والمقابلة" },
            { id: "bl-bd3", label: "الاقتباس والتورية" },
          ],
        },
        {
          id: "bl-refs",
          label: "أهم المراجع",
          children: [
            { id: "bl-r1", label: "دلائل الإعجاز — عبدالقاهر الجرجاني" },
            { id: "bl-r2", label: "الإيضاح في علوم البلاغة — الخطيب القزويني" },
            { id: "bl-r3", label: "جواهر البلاغة — أحمد الهاشمي" },
          ],
        },
      ],
    },
  },

  /* ═══ 23. مراتب طلب العلم ═══ */
  {
    id: "ilm-maratib",
    title: "مراتب طلب العلم",
    category: "التعلّم والأدوات",
    description: "ترتيب العلوم الشرعية حسب الأهمية وخطة الطالب في التلقي",
    root: {
      id: "r-maratib",
      label: "مراتب طلب العلم",
      children: [
        {
          id: "mr-mubadi",
          label: "المرحلة الأولى: التأسيس",
          children: [
            { id: "mr-mb1", label: "تجويد القرآن وحفظ المتون الصغيرة" },
            { id: "mr-mb2", label: "الأربعون النووية — مدخل إلى الحديث" },
            { id: "mr-mb3", label: "الأصول الثلاثة — في العقيدة والتوحيد" },
            { id: "mr-mb4", label: "متن الورقات أو الآجرومية" },
          ],
        },
        {
          id: "mr-wasit",
          label: "المرحلة الثانية: الوسيط",
          children: [
            { id: "mr-w1", label: "متون أصول الفقه: مختصر التحرير" },
            { id: "mr-w2", label: "مختصرات الفقه: الدليل والزاد" },
            { id: "mr-w3", label: "البيقونية ونخبة الفكر — في المصطلح" },
            { id: "mr-w4", label: "حفظ ما تيسّر من القرآن مع التفسير" },
          ],
        },
        {
          id: "mr-mutaqaddim",
          label: "المرحلة الثالثة: المتقدم",
          children: [
            { id: "mr-mt1", label: "الكتب الكبار: البخاري، ومسلم، والموطأ" },
            { id: "mr-mt2", label: "فقه المذهب: الإنصاف، والمجموع" },
            { id: "mr-mt3", label: "تفسير ابن كثير وتفسير الطبري" },
            { id: "mr-mt4", label: "الاختصاص بفن: دراسة عمق في علم" },
          ],
        },
        {
          id: "mr-adab",
          label: "آداب طلب العلم",
          children: [
            { id: "mr-a1", label: "الإخلاص لله في الطلب" },
            { id: "mr-a2", label: "ملازمة شيخ أو عالم موثوق" },
            { id: "mr-a3", label: "المذاكرة والمراجعة المستمرة" },
            { id: "mr-a4", label: "العمل بما تعلّمت قبل الزيادة" },
          ],
        },
        {
          id: "mr-books",
          label: "مراجع منهج التعلم",
          href: "/start-here",
          children: [
            { id: "mr-bk1", label: "تذكرة السامع والمتكلم — ابن جماعة" },
            { id: "mr-bk2", label: "حلية طالب العلم — ابن عثيمين" },
            { id: "mr-bk3", label: "الشيخ بكر أبو زيد — طالب العلم والكتب" },
          ],
        },
      ],
    },
  },
  /* ═══ 23. علم الكلام والمذاهب العقدية ═══ */
  {
    id: "ilm-kalam",
    title: "علم الكلام والمذاهب العقدية",
    category: "العقيدة والتوحيد",
    description: "تاريخ المذاهب العقدية الإسلامية ومناهجها وأبرز قضاياها",
    root: {
      id: "r-kalam",
      label: "علم الكلام والمذاهب",
      children: [
        {
          id: "kl-ahl-sunna",
          label: "أهل السنة والجماعة",
          href: "/tawhid",
          children: [
            { id: "kl-as1", label: "الأشعرية — المنهج الكلامي" },
            { id: "kl-as2", label: "الماتريدية — كلام ما وراء النهر" },
            { id: "kl-as3", label: "أهل الحديث — السلفية" },
          ],
        },
        {
          id: "kl-mutazila",
          label: "المعتزلة",
          children: [
            { id: "kl-m1", label: "الأصول الخمسة — التوحيد والعدل" },
            { id: "kl-m2", label: "الاعتزال التاريخي والمتكلمون" },
            { id: "kl-m3", label: "نقد المعتزلة عند أهل السنة" },
          ],
        },
        {
          id: "kl-shia",
          label: "الشيعة — المذاهب الكلامية",
          children: [
            { id: "kl-sh1", label: "الإمامية — أصولها الكلامية" },
            { id: "kl-sh2", label: "الزيدية — المنهج المعتزلي" },
            { id: "kl-sh3", label: "الإسماعيلية — الباطنية" },
          ],
        },
        {
          id: "kl-khawarij",
          label: "الخوارج والمرجئة",
          children: [
            { id: "kl-k1", label: "الخوارج — التكفير بالذنب" },
            { id: "kl-k2", label: "المرجئة — الإرجاء في الإيمان" },
          ],
        },
        {
          id: "kl-masail",
          label: "أبرز مسائل علم الكلام",
          children: [
            { id: "kl-ms1", label: "القرآن: مخلوق أم غير مخلوق؟" },
            { id: "kl-ms2", label: "الأسماء والصفات — التأويل والتفويض" },
            { id: "kl-ms3", label: "خلق الأفعال وحرية الإرادة" },
            { id: "kl-ms4", label: "القضاء والقدر — مذاهب الفرق" },
            { id: "kl-ms5", label: "رؤية الله — بين الإثبات والنفي" },
          ],
        },
        {
          id: "kl-books",
          label: "المراجع الأساسية",
          children: [
            { id: "kl-bk1", label: "الملل والنحل — الشهرستاني" },
            { id: "kl-bk2", label: "الفَرق بين الفِرَق — البغدادي" },
            { id: "kl-bk3", label: "مقالات الإسلاميين — الأشعري" },
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
  "اللغة والبلاغة",
] as const;
