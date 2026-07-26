/**
 * شجرة تصنيفات المسارات — مصدر موحّد للـ breadcrumbs وروابط الأقسام الشقيقة.
 * عند إضافة مسار جديد يكفي تسجيله هنا ليظهر تلقائيًا في الربط الداخلي.
 */

export type TaxonomyNode = {
  href: string;
  label: string;
  parent?: string;
  siblings?: string[];
  tags?: string[];
};

/** مسارات المحاور الرئيسية */
export const TAXONOMY: Record<string, TaxonomyNode> = {
  "/": { href: "/", label: "الرئيسية" },

  "/quran-hub": {
    href: "/quran-hub",
    label: "القرآن الكريم",
    parent: "/",
    siblings: ["/ulum-quran", "/hadith", "/tawhid"],
    tags: ["قرآن", "تلاوة", "تفسير"],
  },
  "/mushaf": { href: "/mushaf", label: "المصحف", parent: "/quran-hub", tags: ["قرآن", "مصحف"] },
  "/ulum-quran": {
    href: "/ulum-quran",
    label: "علوم القرآن",
    parent: "/quran-hub",
    siblings: ["/quran/tajweed", "/mutashabihat", "/quran/surah-stories"],
    tags: ["قرآن", "علوم"],
  },
  "/quran/tajweed": { href: "/quran/tajweed", label: "التجويد", parent: "/ulum-quran", tags: ["تجويد"] },
  "/quran/surah-stories": { href: "/quran/surah-stories", label: "قصص السور", parent: "/quran-hub", tags: ["سور", "قصص"] },
  "/surah-stories": { href: "/surah-stories", label: "قصص السور", parent: "/quran-hub", tags: ["سور"] },
  "/mutashabihat": { href: "/mutashabihat", label: "المتشابهات", parent: "/ulum-quran", tags: ["متشابهات"] },
  "/duas-quran": { href: "/duas-quran", label: "أدعية القرآن", parent: "/quran-hub", tags: ["دعاء", "قرآن"] },
  "/daily-wird": { href: "/daily-wird", label: "الورد اليومي", parent: "/quran-hub", tags: ["ورد"] },

  "/hadith": {
    href: "/hadith",
    label: "الحديث",
    parent: "/",
    siblings: ["/hadith-science", "/library", "/scholars"],
    tags: ["حديث", "سنة"],
  },
  "/hadith/sahih": { href: "/hadith/sahih", label: "الصحيح", parent: "/hadith", tags: ["صحيح"] },
  "/hadith/daif": { href: "/hadith/daif", label: "الضعيف", parent: "/hadith", tags: ["ضعيف"] },
  "/hadith/mawdu": { href: "/hadith/mawdu", label: "الموضوع", parent: "/hadith", tags: ["موضوع"] },
  "/hadith/books": { href: "/hadith/books", label: "كتب الحديث", parent: "/hadith", tags: ["كتب", "حديث"] },
  "/hadith-science": { href: "/hadith-science", label: "علوم الحديث", parent: "/hadith", tags: ["مصطلح"] },
  "/arbaeen-nawawi": { href: "/arbaeen-nawawi", label: "الأربعون النووية", parent: "/hadith", tags: ["نووي"] },
  "/wasaya-nabawiyya": { href: "/wasaya-nabawiyya", label: "الوصايا النبوية", parent: "/hadith", tags: ["وصايا"] },

  "/library": {
    href: "/library",
    label: "المكتبة",
    parent: "/",
    siblings: ["/scholars", "/hadith", "/fiqh"],
    tags: ["كتب"],
  },
  "/scholars": {
    href: "/scholars",
    label: "العلماء",
    parent: "/",
    siblings: ["/library", "/madhahib", "/hadith"],
    tags: ["علماء", "تراجم"],
  },

  "/prophets": {
    href: "/prophets",
    label: "قصص الأنبياء",
    parent: "/",
    siblings: ["/nations", "/stories", "/quran-hub"],
    tags: ["أنبياء", "قصص"],
  },
  "/prophets/tree": { href: "/prophets/tree", label: "شجرة الأنبياء", parent: "/prophets", tags: ["أنساب"] },
  "/nations": {
    href: "/nations",
    label: "الأمم السابقة",
    parent: "/prophets",
    siblings: ["/stories", "/prophets"],
    tags: ["أمم", "قصص"],
  },
  "/stories": { href: "/stories", label: "القصص الإسلامية", parent: "/", siblings: ["/prophets", "/nations"], tags: ["قصص"] },
  "/sahabah": { href: "/sahabah", label: "الصحابة", parent: "/", siblings: ["/prophets", "/hadith"], tags: ["صحابة"] },

  "/fiqh": {
    href: "/fiqh",
    label: "الفقه",
    parent: "/",
    siblings: ["/rulings", "/madhahib", "/fiqh-council"],
    tags: ["فقه"],
  },
  "/rulings": { href: "/rulings", label: "الموسوعة الفقهية", parent: "/fiqh", tags: ["أحكام"] },
  "/madhahib": { href: "/madhahib", label: "المذاهب", parent: "/fiqh", siblings: ["/scholars"], tags: ["مذاهب"] },
  "/fiqh-council": { href: "/fiqh-council", label: "المجمع الفقهي", parent: "/fiqh", tags: ["مجمع"] },
  "/fiqh-qawaid": { href: "/fiqh-qawaid", label: "القواعد الفقهية", parent: "/fiqh", tags: ["قواعد"] },
  "/mawarith": { href: "/mawarith", label: "المواريث", parent: "/fiqh", tags: ["مواريث"] },

  "/tawhid": {
    href: "/tawhid",
    label: "التوحيد",
    parent: "/",
    siblings: ["/arkan-iman", "/asma-husna", "/aqidah"],
    tags: ["عقيدة", "توحيد"],
  },
  "/arkan": { href: "/arkan", label: "أركان الإسلام", parent: "/", tags: ["أركان"] },
  "/arkan-iman": { href: "/arkan-iman", label: "أركان الإيمان", parent: "/tawhid", tags: ["إيمان"] },
  "/asma-husna": { href: "/asma-husna", label: "الأسماء الحسنى", parent: "/tawhid", tags: ["أسماء"] },
  "/malaika": { href: "/malaika", label: "الملائكة", parent: "/arkan-iman", tags: ["ملائكة"] },
  "/janna-naar": { href: "/janna-naar", label: "الجنة والنار", parent: "/arkan-iman", tags: ["آخرة"] },
  "/alamat-saah": { href: "/alamat-saah", label: "أشراط الساعة", parent: "/arkan-iman", tags: ["ساعة"] },
  "/sins-and-rights": { href: "/sins-and-rights", label: "الذنوب والحقوق", parent: "/tawhid", tags: ["ذنوب"] },

  "/adhkar": {
    href: "/adhkar",
    label: "الأذكار",
    parent: "/",
    siblings: ["/duas", "/tasbih", "/daily-wird"],
    tags: ["أذكار"],
  },
  "/duas": { href: "/duas", label: "الأدعية", parent: "/adhkar", tags: ["دعاء"] },
  "/tasbih": { href: "/tasbih", label: "التسبيح", parent: "/adhkar", tags: ["تسبيح"] },
  "/salah-guide": { href: "/salah-guide", label: "دليل الصلاة", parent: "/fiqh", siblings: ["/prayer-times", "/tahara"], tags: ["صلاة"] },
  "/prayer-times": { href: "/prayer-times", label: "مواقيت الصلاة", parent: "/", tags: ["صلاة"] },
  "/tahara": { href: "/tahara", label: "الطهارة", parent: "/fiqh", tags: ["طهارة"] },
  "/zakat": { href: "/zakat", label: "الزكاة", parent: "/fiqh", tags: ["زكاة"] },
  "/sawm": { href: "/sawm", label: "الصيام", parent: "/fiqh", tags: ["صيام"] },
  "/hajj": { href: "/hajj", label: "الحج", parent: "/fiqh", tags: ["حج"] },
  "/janaza": { href: "/janaza", label: "الجنازة", parent: "/fiqh", tags: ["جنازة"] },

  "/learn": {
    href: "/learn",
    label: "التعلم",
    parent: "/",
    siblings: ["/lessons", "/learning/paths", "/library"],
    tags: ["تعلم"],
  },
  "/lessons": { href: "/lessons", label: "الدروس", parent: "/learn", tags: ["دروس"] },
  "/learning/paths": { href: "/learning/paths", label: "مسارات التعلم", parent: "/learn", tags: ["مسارات"] },
  "/annual-courses": { href: "/annual-courses", label: "الدورات", parent: "/learn", tags: ["دورات"] },
  "/adab-talab-ilm": { href: "/adab-talab-ilm", label: "آداب طلب العلم", parent: "/learn", tags: ["آداب"] },
  "/start-here": { href: "/start-here", label: "ابدأ من هنا", parent: "/learn", tags: ["بداية"] },

  "/qa": { href: "/qa", label: "أسئلة وأجوبة", parent: "/", siblings: ["/fawaid", "/rulings"], tags: ["أسئلة"] },
  "/fawaid": { href: "/fawaid", label: "الفوائد", parent: "/", siblings: ["/qa"], tags: ["فوائد"] },
  "/topics": { href: "/topics", label: "المواضيع", parent: "/", tags: ["مواضيع"] },
  "/miracles": { href: "/miracles", label: "الإشارات الكونية", parent: "/", tags: ["إعجاز"] },
  "/prophetic-medicine": { href: "/prophetic-medicine", label: "الطب النبوي", parent: "/", tags: ["طب"] },
  "/islamic-glossary": { href: "/islamic-glossary", label: "المصطلحات", parent: "/", tags: ["مصطلحات"] },
  "/knowledge-graph": { href: "/knowledge-graph", label: "مخطط المعرفة", parent: "/", tags: ["معرفة"] },
  "/knowledge-map": { href: "/knowledge-map", label: "خارطة المعرفة", parent: "/", tags: ["معرفة"] },
  "/universities": { href: "/universities", label: "الجامعات", parent: "/learn", tags: ["جامعات"] },
  "/akhlaq": { href: "/akhlaq", label: "الأخلاق", parent: "/", siblings: ["/adab-talab-ilm", "/raqaiq"], tags: ["أخلاق"] },
  "/raqaiq": { href: "/raqaiq", label: "الرقائق", parent: "/", siblings: ["/adhkar", "/akhlaq"], tags: ["رقائق"] },
  "/search": { href: "/search", label: "البحث", parent: "/" },
};

/** تصنيف المكتبة → محاور ذات صلة */
export const LIBRARY_CATEGORY_HUBS: Record<string, string[]> = {
  حديث: ["/hadith", "/hadith-science", "/scholars"],
  تفسير: ["/quran-hub", "/ulum-quran"],
  عقيدة: ["/tawhid", "/arkan-iman"],
  فقه: ["/fiqh", "/rulings", "/madhahib"],
  سيرة: ["/prophets", "/sahabah"],
  آداب: ["/adab-talab-ilm", "/akhlaq"],
  لغة: ["/islamic-glossary"],
  "أصول الفقه": ["/fiqh", "/fiqh-qawaid"],
  "علوم القرآن": ["/ulum-quran", "/quran-hub"],
  "مصطلح الحديث": ["/hadith-science", "/hadith"],
  رقائق: ["/adhkar", "/raqaiq"],
  تاريخ: ["/nations", "/prophets"],
};

export function taxonomyBreadcrumbs(path: string): { label: string; href?: string }[] {
  const clean = path.split("?")[0].replace(/\/$/, "") || "/";
  const crumbs: { label: string; href?: string }[] = [{ label: "الرئيسية", href: "/" }];
  if (clean === "/") return crumbs;

  const chain: TaxonomyNode[] = [];
  let cursor: string | undefined = clean;
  const seen = new Set<string>();

  // ابحث عن أطول بادئة مسجّلة
  const parts = clean.split("/").filter(Boolean);
  let matched: string | undefined;
  for (let len = parts.length; len >= 1; len--) {
    const candidate = "/" + parts.slice(0, len).join("/");
    if (TAXONOMY[candidate]) {
      matched = candidate;
      break;
    }
  }

  cursor = matched;
  while (cursor && TAXONOMY[cursor] && !seen.has(cursor)) {
    seen.add(cursor);
    chain.unshift(TAXONOMY[cursor]);
    cursor = TAXONOMY[cursor].parent;
  }

  for (const node of chain) {
    if (node.href === "/") continue;
    crumbs.push({ label: node.label, href: node.href === clean ? undefined : node.href });
  }

  // إن لم يُطابق المسار عقدة كاملة، أضف آخر جزء كتسمية حالية
  if (!TAXONOMY[clean] && parts.length) {
    const last = crumbs[crumbs.length - 1];
    if (last?.href === undefined && crumbs.length > 1) {
      /* already current */
    } else {
      crumbs.push({ label: parts[parts.length - 1] });
    }
  } else if (crumbs.length) {
    const last = crumbs[crumbs.length - 1];
    if (last) delete last.href;
  }

  return crumbs;
}

export function taxonomySiblings(path: string): string[] {
  const clean = path.split("?")[0].replace(/\/$/, "") || "/";
  const parts = clean.split("/").filter(Boolean);
  for (let len = parts.length; len >= 1; len--) {
    const candidate = "/" + parts.slice(0, len).join("/");
    const node = TAXONOMY[candidate];
    if (node?.siblings?.length) return node.siblings.filter((h) => h !== clean);
  }
  const parent = TAXONOMY[clean]?.parent;
  if (parent && TAXONOMY[parent]?.siblings) {
    return TAXONOMY[parent].siblings!.filter((h) => h !== clean);
  }
  return [];
}
