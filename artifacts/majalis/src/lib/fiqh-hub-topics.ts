/**
 * بطاقات بوابة «الفقه والأحكام» — مصدر واحد للحقيقة.
 *
 * سياسة المسارات (2026-07-27):
 * - كل بطاقة لها `id` فريد ومسار `href` واضح لا يضيع الهوية.
 * - بطاقة «الأحكام الشرعية» وحدها تشير إلى موسوعة `/rulings`.
 * - أي باب فقهي آخر كان يُرمى إلى `/rulings?category=…` يحصل على مسار
 *   مستقل `/fiqh/topics/:id` حتى لا يُفتح غلاف الموسوعة بدل صفحة الباب.
 */

export type FiqhHubTopicKind =
  | "guide"
  | "encyclopedia"
  | "topic"
  | "council"
  | "qa"
  | "learning";

export type FiqhHubTopic = {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  href: string;
  color: string;
  kind: FiqhHubTopicKind;
  /** تصنيف موسوعة الأحكام المرتبط (إن وُجد) — للصفحة الموضوعية فقط */
  rulingsCategory?: string;
  rulingsSubcategory?: string;
  /** روابط أدلة فقهية ذات صلة تُعرض في صفحة الموضوع */
  relatedGuides?: { href: string; label: string }[];
};

/** المسار الوحيد المسموح للموسوعة العامة من شبكة البطاقات */
export const FIQH_ENCYCLOPEDIA_HREF = "/rulings";

export const FIQH_HUB_TOPICS: FiqhHubTopic[] = [
  {
    id: "tahara",
    emoji: "🚿",
    title: "الطهارة",
    desc: "الوضوء والغسل والتيمم ونواقضها بترتيب عملي للمبتدئ.",
    href: "/tahara",
    color: "#0F766E",
    kind: "guide",
  },
  {
    id: "salah",
    emoji: "🕌",
    title: "الصلاة",
    desc: "أحكام الصلاة: أركانها وشروطها وواجباتها وسننها وأوقاتها، مع ما يتعلق بالجماعة والمسافر.",
    href: "/salah-guide",
    color: "#143F35",
    kind: "guide",
  },
  {
    id: "zakat",
    emoji: "💰",
    title: "الزكاة",
    desc: "أحكام الزكاة: أنواعها وشروط وجوبها ونصابها ومصارفها، مع حاسبة مبسّطة للأموال الزكوية.",
    href: "/zakat",
    color: "#0F5132",
    kind: "guide",
  },
  {
    id: "sawm",
    emoji: "🌙",
    title: "الصيام",
    desc: "أحكام الصيام: فرض رمضان والنوافل والقضاء والكفارة، مع ما يتعلق بالمسافر والمريض والحامل.",
    href: "/sawm",
    color: "#5B21B6",
    kind: "guide",
  },
  {
    id: "hajj",
    emoji: "🕋",
    title: "الحج والعمرة",
    desc: "مناسك الحج والعمرة: أركانها وواجباتها ومحرمات الإحرام، مرتّبة على مراحل السفر والطواف والرمي.",
    href: "/hajj",
    color: "#226A56",
    kind: "guide",
  },
  {
    id: "janaza",
    emoji: "🕯️",
    title: "الجنائز",
    desc: "أحكام الجنائز: غسل الميت والكفن والصلاة والدفن والتعزية، مع آداب زيارة القبور والدعاء للمتوفى.",
    href: "/janaza",
    color: "#5C5C56",
    kind: "guide",
  },
  {
    id: "jumuah",
    emoji: "📿",
    title: "صلاة الجمعة",
    desc: "حكم الجمعة وشروطها وهيئة الخطبة والصلاة وآداب اليوم، مع ما يسقط الحضور من الأعذار.",
    href: "/jumuah",
    color: "#143F35",
    kind: "guide",
  },
  {
    id: "riba",
    emoji: "🚫",
    title: "الربا",
    desc: "تعريف الربا وأنواعه وحرمة الفائدة، مع البدائل الشرعية وضوابط التحرز من الشبهات المعاصرة.",
    href: "/riba",
    color: "#991B1B",
    kind: "guide",
  },
  {
    id: "nikah",
    emoji: "💍",
    title: "النكاح",
    desc: "أركان عقد النكاح وشروطه والمهر وحقوق الزوجين، مع المحاذير الشرعية في العقود.",
    href: "/nikah",
    color: "#7C3AED",
    kind: "guide",
  },
  {
    id: "talaq",
    emoji: "📄",
    title: "الطلاق والعدة",
    desc: "أنواع الطلاق والعدة والخلع وأدب الفراق وحفظ حقوق الأولاد بعد الفرقة.",
    href: "/talaq",
    color: "#5B21B6",
    kind: "guide",
  },
  {
    id: "udhiya",
    emoji: "🐐",
    title: "الأضحية",
    desc: "حكم الأضحية وشروطها ووقتها وعيوبها المانعة وآداب الذبح والتوزيع.",
    href: "/udhiya",
    color: "#0F766E",
    kind: "guide",
  },
  {
    id: "ruqya",
    emoji: "📖",
    title: "الرقية الشرعية",
    desc: "مشروعية الرقية وضوابط التوحيد وما يُحذر منه من الشرك والدجل، مع الجمع بين الرقية والطب.",
    href: "/ruqya",
    color: "#0F5132",
    kind: "guide",
  },
  {
    id: "waqf",
    emoji: "🕊️",
    title: "الوقف",
    desc: "حقيقة الوقف وشروطه وأمانة النظّار، والفرق بينه وبين الصدقة الجارية المعاصرة.",
    href: "/waqf",
    color: "#226A56",
    kind: "guide",
  },
  {
    id: "sadaqa",
    emoji: "🤲",
    title: "الصدقة",
    desc: "فضل الصدقة وآداب الإنفاق والفرق بينها وبين الزكاة، وصدقة كل معروف.",
    href: "/sadaqa",
    color: "#065F46",
    kind: "guide",
  },
  {
    id: "mawarith",
    emoji: "⚖️",
    title: "المواريث",
    desc: "حاسبة الفرائض: توزيع التركة على الورثة وفق أنصبتهم الشرعية، مع بيان الحجب والعصبة والمسائل الشائعة.",
    href: "/mawarith",
    color: "#DC2626",
    kind: "guide",
  },
  {
    id: "fiqh-qawaid",
    emoji: "📐",
    title: "القواعد الفقهية",
    desc: "القواعد الفقهية الكبرى: اليقين لا يزول بالشك والمشقة تجلب التيسير وغيرها، مع أمثلة تطبيقية في الفروع.",
    href: "/fiqh-qawaid",
    color: "#143F35",
    kind: "guide",
  },
  {
    id: "madhahib",
    emoji: "📚",
    title: "المذاهب الأربعة",
    desc: "المذاهب الفقهية الأربعة: الحنفي والمالكي والشافعي والحنبلي، مؤسسوها ومناهجها ومصادرها وانتشارها.",
    href: "/madhahib",
    color: "#7C3AED",
    kind: "guide",
  },
  {
    id: "qa",
    emoji: "🎮",
    title: "لعبة سين جيم",
    desc: "أسئلة تعليمية شرعية داخل لعبة سين جيم: اختبر معلوماتك مع بنك أسئلة موثّق بالأدلة عند توفرها.",
    href: "/quiz",
    color: "#0F766E",
    kind: "qa",
  },
  {
    id: "fiqh-council",
    emoji: "🏛️",
    title: "المجمع الفقهي",
    desc: "قرارات المجامع الفقهية المعتمدة في النوازل والمسائل المختلف فيها، مع بيان الأدلة والترجيح.",
    href: "/fiqh-council",
    color: "#0F5132",
    kind: "council",
  },
  {
    id: "rulings-encyclopedia",
    emoji: "📋",
    title: "الأحكام الشرعية",
    desc: "موسوعة الأحكام الشرعية: فتاوى وأحكام موثّقة بالأدلة من القرآن والسنة وقول العلماء المعتمدين.",
    href: FIQH_ENCYCLOPEDIA_HREF,
    color: "#065F46",
    kind: "encyclopedia",
  },
  {
    id: "muamalat",
    emoji: "🤝",
    title: "المعاملات",
    desc: "أحكام المعاملات: البيع والإجارة والشركات والغرر، مع ضوابط الحلال والحرام في التجارة.",
    href: "/fiqh/topics/muamalat",
    color: "#0F766E",
    kind: "topic",
    rulingsCategory: "المعاملات",
    relatedGuides: [
      { href: "/riba", label: "الربا" },
      { href: "/sadaqa", label: "الصدقة" },
      { href: "/waqf", label: "الوقف" },
      { href: "/zakat", label: "الزكاة" },
    ],
  },
  {
    id: "atima",
    emoji: "🥩",
    title: "الأطعمة",
    desc: "أحكام الأطعمة والأشربة: الحلال والحرام والذبائح وشروط الذبح، مع ما يتعلق بالمذبوحات والمشتبهات.",
    href: "/fiqh/topics/atima",
    color: "#DC2626",
    kind: "topic",
    rulingsCategory: "الأطعمة والأشربة",
    relatedGuides: [
      { href: "/udhiya", label: "الأضحية" },
      { href: "/fiqh-council/nawazil", label: "النوازل المعاصرة" },
    ],
  },
  {
    id: "medical",
    emoji: "🏥",
    title: "الفقه الطبي",
    desc: "الفقه الطبي: أحكام العلاج والأدوية والعمليات والتبرع بالأعضاء، مع ضوابط الشرع في الطب الحديث.",
    href: "/fiqh/topics/medical",
    color: "#065F46",
    kind: "topic",
    rulingsCategory: "النوازل المعاصرة",
    rulingsSubcategory: "الطب",
    relatedGuides: [
      { href: "/fiqh-council/nawazil", label: "نوازل المجمع" },
      { href: "/prophetic-medicine", label: "الطب النبوي" },
    ],
  },
  {
    id: "islamic-finance",
    emoji: "🏦",
    title: "المال الإسلامي",
    desc: "المال الإسلامي: أحكام البنوك والتأمين والاستثمار والصكوك، مع ضوابط التمويل الحلال.",
    href: "/fiqh/topics/islamic-finance",
    color: "#143F35",
    kind: "topic",
    rulingsCategory: "المعاملات",
    relatedGuides: [
      { href: "/riba", label: "الربا" },
      { href: "/zakat", label: "الزكاة" },
      { href: "/fiqh/topics/financing", label: "التمويل الإسلامي" },
    ],
  },
  {
    id: "usul-fiqh",
    emoji: "📖",
    title: "أصول الفقه",
    desc: "أصول الفقه: مصادر التشريع من قرآن وسنة وإجماع وقياس، وطرق الاستنباط والترجيح بين الأقوال.",
    href: "/fiqh/topics/usul-fiqh",
    color: "#226A56",
    kind: "topic",
    rulingsCategory: "طلب العلم والدعوة",
    relatedGuides: [
      { href: "/learning/paths/usool-fiqh", label: "مسار أصول الفقه" },
      { href: "/fiqh-qawaid", label: "القواعد الفقهية" },
      { href: "/madhahib", label: "المذاهب الأربعة" },
      { href: "/maqasid-sharia", label: "مقاصد الشريعة" },
    ],
  },
  {
    id: "nawazil",
    emoji: "⚡",
    title: "النوازل المعاصرة",
    desc: "النوازل المعاصرة تُحال إلى قرارات المجامع وهيئات الفتوى المعتمدة؛ لا يُفتى فيها ابتداءً هنا بل يُرجع إلى قراراتها.",
    href: "/fiqh-council/nawazil",
    color: "#5C5C56",
    kind: "council",
  },
  {
    id: "hudud",
    emoji: "🔐",
    title: "الحدود والجنايات",
    desc: "أحكام الحدود والقصاص والديات: شروطها وضوابطها وما يتعلق بالجرائم والعقوبات في الشريعة.",
    href: "/fiqh/topics/hudud",
    color: "#991B1B",
    kind: "topic",
    rulingsCategory: "القضاء والحدود",
    relatedGuides: [
      { href: "/fiqh-council", label: "المجمع الفقهي" },
      { href: "/rulings", label: "موسوعة الأحكام" },
    ],
  },
  {
    id: "minorities",
    emoji: "🌍",
    title: "فقه الأقليات",
    desc: "فقه الأقليات: مسائل المسلمين في غير بلاد الإسلام، عبر قرارات المجمع الفقهي المعتمد والفتاوى الرسمية.",
    href: "/fiqh/topics/minorities",
    color: "#143F35",
    kind: "topic",
    rulingsCategory: "النوازل المعاصرة",
    relatedGuides: [
      { href: "/fiqh-council", label: "المجمع الفقهي" },
      { href: "/fiqh-council/nawazil", label: "النوازل" },
      { href: "/rulings", label: "موسوعة الأحكام" },
    ],
  },
  {
    id: "tech-fiqh",
    emoji: "💻",
    title: "فقه التقنية",
    desc: "فقه التقنية: نوازل الإنترنت والذكاء الاصطناعي والعملات الرقمية، عبر قرارات المجامع الفقهية المعتمدة.",
    href: "/fiqh/topics/tech-fiqh",
    color: "#0F766E",
    kind: "topic",
    rulingsCategory: "النوازل المعاصرة",
    rulingsSubcategory: "التقنية",
    relatedGuides: [
      { href: "/fiqh-council/nawazil", label: "النوازل المعاصرة" },
      { href: "/fiqh/topics/financing", label: "التمويل الإسلامي" },
      { href: "/fiqh-council", label: "المجمع الفقهي" },
    ],
  },
  {
    id: "patients",
    emoji: "🩺",
    title: "فقه العبادات للمرضى",
    desc: "فقه العبادات للمرضى: أحكام الصلاة والصيام والطهارة عند العجز أو المرض، مع الرخص الشرعية المعتمدة.",
    href: "/fiqh/topics/patients",
    color: "#5C5C56",
    kind: "topic",
    rulingsCategory: "النوازل المعاصرة",
    rulingsSubcategory: "الطب",
    relatedGuides: [
      { href: "/tahara", label: "الطهارة" },
      { href: "/salah-guide", label: "الصلاة" },
      { href: "/sawm", label: "الصيام" },
    ],
  },
  {
    id: "financing",
    emoji: "🏦",
    title: "التمويل الإسلامي",
    desc: "التمويل الإسلامي: الصيرفة الإسلامية والتكافل والاستثمار الحلال، بضوابط الشرع في المعاملات المالية.",
    href: "/fiqh/topics/financing",
    color: "#065F46",
    kind: "topic",
    rulingsCategory: "المعاملات",
    relatedGuides: [
      { href: "/riba", label: "الربا" },
      { href: "/fiqh/topics/islamic-finance", label: "المال الإسلامي" },
      { href: "/fiqh-council/nawazil", label: "النوازل" },
    ],
  },
];

export function getFiqhHubTopic(id: string): FiqhHubTopic | undefined {
  return FIQH_HUB_TOPICS.find((t) => t.id === id);
}

/** هل المسار يشير إلى موسوعة الأحكام العامة (بما فيها فلاتر الفئة)؟ */
export function isRulingsEncyclopediaHref(href: string): boolean {
  return href === "/rulings" || href.startsWith("/rulings?") || href.startsWith("/rulings/");
}

/**
 * البطاقات المسموح لها بالإشارة إلى موسوعة الأحكام فقط:
 * - بطاقة الموسوعة نفسها → `/rulings`
 * - روابط «موسوعة الأحكام» داخل relatedGuides في صفحات المواضيع (ليست بطاقات شبكة)
 */
export function assertFiqhHubCardHrefsSafe(topics: FiqhHubTopic[] = FIQH_HUB_TOPICS): string[] {
  const violations: string[] = [];
  for (const t of topics) {
    if (t.kind === "encyclopedia") {
      if (t.href !== FIQH_ENCYCLOPEDIA_HREF) {
        violations.push(`${t.id}: encyclopedia must be exactly ${FIQH_ENCYCLOPEDIA_HREF}`);
      }
      continue;
    }
    if (isRulingsEncyclopediaHref(t.href)) {
      violations.push(`${t.id} («${t.title}») يوجّه إلى موسوعة الأحكام بالخطأ: ${t.href}`);
    }
  }
  return violations;
}
