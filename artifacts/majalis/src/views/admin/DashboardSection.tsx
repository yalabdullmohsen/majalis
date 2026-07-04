import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { adminGetDashboardStats, adminResolveReport } from "@/lib/supabase";
import { getCmsDashboardStats } from "@/lib/cms/supabase-cms";
import { getTopSearchQueries } from "@/lib/search-history";
import { isSupabaseConfigured } from "@/lib/supabase-config";
import { Loading } from "@/components/ui-common";
import { useAuth } from "@/components/AuthProvider";
import { useAdminShell, type AdminSection } from "./AdminShell";

// ── أنواع ──────────────────────────────────────────────────────────────
type DashboardData = Awaited<ReturnType<typeof adminGetDashboardStats>>;

type SectionCard = {
  key: AdminSection;
  icon: string;
  label: string;
  description: string;
  whatItDoes: string;
  whenToUse: string;
  dataManaged: string;
  affectsPublic: boolean;
  group: string;
};

// ── كتالوج الأقسام ─────────────────────────────────────────────────────
const SECTION_CATALOG: SectionCard[] = [
  // ── إدارة المحتوى ──────────────────────────────────────────────────
  {
    key: "lessons", icon: "▶", label: "الدروس", group: "المحتوى",
    description: "إدارة كامل جدول الدروس العلمية الأسبوعية في المساجد",
    whatItDoes: "تعرض جميع الدروس المُسجَّلة في قاعدة البيانات مع إمكانية إضافة درس يدوياً أو تعديله أو حذفه.",
    whenToUse: "استخدمه لإضافة درس جديد أو تصحيح بيانات درس موجود أو إيقاف درس انتهى.",
    dataManaged: "عنوان الدرس، الشيخ، المسجد، الوقت، اليوم، المحافظة، التصنيف، الوصف، الروابط",
    affectsPublic: true,
  },
  {
    key: "sheikhs", icon: "👤", label: "المشايخ", group: "المحتوى",
    description: "إدارة ملفات المشايخ والعلماء المُسجَّلين في المنصة",
    whatItDoes: "تتيح إضافة شيخ جديد أو تعديل بياناته أو ربطه بدروسه الموجودة.",
    whenToUse: "عند إضافة شيخ جديد لم يُسجَّل سابقاً أو تحديث صورته ومعلوماته.",
    dataManaged: "الاسم، الصورة، التخصص، السيرة المختصرة، الروابط الخارجية",
    affectsPublic: true,
  },
  {
    key: "library", icon: "📚", label: "المكتبة", group: "المحتوى",
    description: "إدارة الكتب والمراجع العلمية في المكتبة الرقمية",
    whatItDoes: "تتيح إضافة كتب ومراجع علمية مع بيانات المؤلف والناشر وملف PDF.",
    whenToUse: "لإضافة كتاب جديد أو تحديث بيانات كتاب موجود أو ربطه بموضوع.",
    dataManaged: "عنوان الكتاب، المؤلف، الموضوع، رابط PDF، صورة الغلاف",
    affectsPublic: true,
  },
  {
    key: "fawaid", icon: "💡", label: "الفوائد", group: "المحتوى",
    description: "إدارة الفوائد والتنبيهات الشرعية المختارة",
    whatItDoes: "تتيح إضافة فوائد علمية مختصرة ومراجعة الفوائد المقترحة من المستخدمين.",
    whenToUse: "لنشر فوائد علمية جديدة أو اعتماد فوائد مقترحة من الزوار.",
    dataManaged: "نص الفائدة، المصدر، التصنيف، الشيخ المنسوبة إليه",
    affectsPublic: true,
  },
  {
    key: "adhkar", icon: "◎", label: "الأذكار", group: "المحتوى",
    description: "إدارة مجموعات الأذكار والأدعية الشرعية الموثقة",
    whatItDoes: "يتيح إضافة أذكار جديدة ومراجعة بيانات الأذكار القائمة.",
    whenToUse: "لإضافة ذكر جديد أو تصحيح نص ذكر موجود أو تعديل مصدره.",
    dataManaged: "نص الذكر، عدد التكرار، المصدر، التصنيف (صباح/مساء/صلاة…)",
    affectsPublic: true,
  },
  {
    key: "miracles", icon: "✨", label: "الإعجاز العلمي", group: "المحتوى",
    description: "إدارة محتوى الإعجاز العلمي في القرآن والسنة",
    whatItDoes: "تتيح إضافة مقالات الإعجاز العلمي ومراجعتها قبل النشر.",
    whenToUse: "لإضافة محتوى جديد أو تعديل مقالة موجودة أو إزالة محتوى غير دقيق.",
    dataManaged: "عنوان المقال، النص، المصادر، الصور، التصنيف",
    affectsPublic: true,
  },
  {
    key: "qa", icon: "❓", label: "الأسئلة والأجوبة", group: "المحتوى",
    description: "إدارة الأسئلة الشرعية والفتاوى المُجابة",
    whatItDoes: "تتيح إضافة أسئلة وأجوبة شرعية أو مراجعة المقترحات من الزوار.",
    whenToUse: "لنشر سؤال وجواب جديد أو اعتماد سؤال مُقترح أو تعديل إجابة.",
    dataManaged: "نص السؤال، الإجابة، المصدر، الشيخ، التصنيف، حالة النشر",
    affectsPublic: true,
  },
  {
    key: "quiz", icon: "🎯", label: "المسابقة", group: "المحتوى",
    description: "إدارة أسئلة المسابقة والاختبارات التفاعلية",
    whatItDoes: "تتيح إضافة أسئلة المسابقة مع خيارات الإجابة وتحديد الإجابة الصحيحة.",
    whenToUse: "لإثراء بنك الأسئلة أو تصحيح سؤال موجود أو تعديل درجة صعوبته.",
    dataManaged: "نص السؤال، الخيارات الأربعة، الإجابة الصحيحة، التصنيف، الصعوبة",
    affectsPublic: true,
  },
  // ── الشريعة ──────────────────────────────────────────────────────────
  {
    key: "fiqh-council", icon: "⚖", label: "المجمع الفقهي", group: "الشريعة",
    description: "إدارة قرارات ووثائق المجمع الفقهي الكويتي والخليجي",
    whatItDoes: "تتيح استعراض وإضافة قرارات المجامع الفقهية وتصنيفها وربطها بموضوعاتها.",
    whenToUse: "لإدخال قرارات جديدة من دورات المجمع أو تحديث بيانات قرار قديم.",
    dataManaged: "القرارات، الفتاوى، التوصيات، الأبحاث، جلسات المجمع، المجالات الفقهية",
    affectsPublic: true,
  },
  {
    key: "fatwa", icon: "📜", label: "الفتاوى", group: "الشريعة",
    description: "إدارة قاعدة الفتاوى الشرعية الموثقة",
    whatItDoes: "تتيح إدارة الفتاوى الشرعية مع بيانات المُفتي والسند والمراجع.",
    whenToUse: "لإضافة فتوى جديدة أو مراجعة فتاوى مُقترحة أو تصحيح بيانات فتوى.",
    dataManaged: "نص الفتوى، المُفتي، التاريخ، المصدر، التصنيف، حالة الاعتماد",
    affectsPublic: true,
  },
  {
    key: "rulings", icon: "🏛", label: "الأحكام الشرعية", group: "الشريعة",
    description: "إدارة موسوعة الأحكام الشرعية المُصنَّفة",
    whatItDoes: "تتيح إدارة الأحكام الشرعية مُصنَّفةً حسب الموضوع مع المصادر الفقهية.",
    whenToUse: "لإضافة حكم جديد أو تعديل حكم موجود أو تصنيفه ضمن أبواب الفقه.",
    dataManaged: "الحكم، المصادر الفقهية، التصنيف، درجة الاتفاق، الخلاف الفقهي",
    affectsPublic: true,
  },
  {
    key: "annual-courses", icon: "🎓", label: "الدورات العلمية", group: "الشريعة",
    description: "إدارة الدورات العلمية والبرامج التعليمية السنوية",
    whatItDoes: "تتيح إدارة الدورات العلمية الدورية مع جداولها وبرامجها ومشايخها.",
    whenToUse: "قبل موسم الدورات أو عند الإعلان عن دورة جديدة.",
    dataManaged: "اسم الدورة، التواريخ، المشايخ، المناهج، مكان الانعقاد",
    affectsPublic: true,
  },
  // ── الاستيراد والذكاء الاصطناعي ──────────────────────────────────────
  {
    key: "image-import", icon: "🖼", label: "استخلاص من صور", group: "الاستيراد والذكاء الاصطناعي",
    description: "رفع صور الإعلانات واستخلاص بيانات الدروس تلقائياً بالذكاء الاصطناعي",
    whatItDoes: "يحلل الذكاء الاصطناعي صورة الإعلان ويستخرج منها جميع البيانات (الشيخ، الوقت، المسجد…) تلقائياً دون إدخال يدوي.",
    whenToUse: "عند وصول صور إعلانات الدروس من التليجرام أو الواتساب أو الإنستقرام.",
    dataManaged: "كافة بيانات الدرس المُستخرجة من الصورة، ثم مراجعتها يدوياً قبل النشر",
    affectsPublic: true,
  },
  {
    key: "smart-cms", icon: "🤖", label: "CMS الذكي", group: "الاستيراد والذكاء الاصطناعي",
    description: "مركز إدارة المحتوى الذكي المُدعوم بالذكاء الاصطناعي",
    whatItDoes: "يوفر أدوات ذكية لاستيراد المحتوى وتصنيفه ومراجعته وفهرسته تلقائياً.",
    whenToUse: "للعمليات الدورية من استيراد وتصنيف ومراجعة جماعية للمحتوى.",
    dataManaged: "فهرس المحتوى، قوائم الاستيراد، سجلات التدقيق، المحتوى المجدول",
    affectsPublic: false,
  },
  {
    key: "aggregator", icon: "⚙", label: "محرك التجميع", group: "الاستيراد والذكاء الاصطناعي",
    description: "تجميع المحتوى العلمي تلقائياً من مصادر متعددة",
    whatItDoes: "يسحب المحتوى من مصادر خارجية (قنوات، مواقع، APIs) ويُهيّئه للمراجعة والنشر.",
    whenToUse: "لأتمتة عملية جلب المحتوى من مصادر موثوقة دون إدخال يدوي.",
    dataManaged: "قوائم المصادر، المحتوى المُجمَّع، حالة الاستيراد",
    affectsPublic: false,
  },
  {
    key: "knowledge-engine", icon: "🧠", label: "Auto Knowledge", group: "الاستيراد والذكاء الاصطناعي",
    description: "محرك المعرفة الآلي لاكتشاف المحتوى وتصنيفه تلقائياً",
    whatItDoes: "يحلل المحتوى الموجود ويقترح تصنيفات وعلاقات وتوصيات جديدة باستخدام NLP.",
    whenToUse: "دورياً لتحسين جودة التصنيف واكتشاف المحتوى غير المُصنَّف.",
    dataManaged: "تصنيفات المحتوى، الكلمات المفتاحية، العلاقات الدلالية",
    affectsPublic: false,
  },
  {
    key: "telegram", icon: "📢", label: "Telegram", group: "الاستيراد والذكاء الاصطناعي",
    description: "استيراد الإعلانات العلمية من قنوات التليجرام",
    whatItDoes: "يراقب قنوات التليجرام ويستخرج إعلانات الدروس تلقائياً ويُعرضها للمراجعة.",
    whenToUse: "لاستيراد الدروس المُعلَن عنها في القنوات الرسمية للمشايخ.",
    dataManaged: "رسائل القنوات، الإعلانات المُستخرجة، حالة المعالجة",
    affectsPublic: false,
  },
  {
    key: "prophet-stories", icon: "📖", label: "قصص الأنبياء", group: "الاستيراد والذكاء الاصطناعي",
    description: "إدارة محتوى قصص الأنبياء عليهم السلام",
    whatItDoes: "تتيح إضافة ومراجعة قصص الأنبياء المُستخرجة من المصادر الشرعية.",
    whenToUse: "لإضافة قصة جديدة أو مراجعة قصة مُقترحة.",
    dataManaged: "نص القصة، المراجع الشرعية، الصور، التصنيف",
    affectsPublic: true,
  },
  {
    key: "islamic-stories", icon: "🕌", label: "القصص الإسلامية", group: "الاستيراد والذكاء الاصطناعي",
    description: "إدارة القصص الإسلامية التاريخية والتربوية",
    whatItDoes: "تتيح إدارة القصص الإسلامية المُوجَّهة للتربية والتعليم.",
    whenToUse: "لنشر قصص إسلامية جديدة أو مراجعة ما تم استيراده.",
    dataManaged: "نص القصة، العصر التاريخي، الشخصيات، المصادر",
    affectsPublic: true,
  },
  {
    key: "updates", icon: "📡", label: "المستجدات", group: "الاستيراد والذكاء الاصطناعي",
    description: "متابعة آخر المستجدات والأخبار العلمية",
    whatItDoes: "يعرض المحتوى المُجمَّع حديثاً ويتيح مراجعته واعتماده للنشر.",
    whenToUse: "دورياً لمتابعة المستجدات المُجمَّعة ومراجعتها.",
    dataManaged: "الأخبار والمستجدات، تاريخ الجمع، حالة الاعتماد",
    affectsPublic: true,
  },
  {
    key: "universities", icon: "🏫", label: "دليل الجامعات", group: "الاستيراد والذكاء الاصطناعي",
    description: "إدارة دليل الجامعات والمؤسسات الإسلامية",
    whatItDoes: "تتيح إدارة قائمة الجامعات والمعاهد الإسلامية مع بياناتها الكاملة.",
    whenToUse: "لإضافة جامعة جديدة أو تحديث بيانات مؤسسة موجودة.",
    dataManaged: "اسم المؤسسة، الموقع، التخصصات، روابط القبول، الدرجات",
    affectsPublic: true,
  },
  // ── التحليل ─────────────────────────────────────────────────────────
  {
    key: "search-analytics", icon: "🔍", label: "تحليل البحث", group: "التحليل والذكاء",
    description: "تحليل استعلامات البحث وسلوك الزوار في المنصة",
    whatItDoes: "يعرض أكثر الكلمات بحثاً وأكثر الصفحات زيارة واتجاهات البحث عبر الزمن.",
    whenToUse: "لفهم اهتمامات الزوار واتخاذ قرارات المحتوى بناءً على البيانات.",
    dataManaged: "سجلات البحث، التوزيع الجغرافي، الكلمات المفتاحية الرائجة",
    affectsPublic: false,
  },
  {
    key: "verified-knowledge", icon: "✅", label: "المعرفة الموثقة", group: "التحليل والذكاء",
    description: "عرض المحتوى الموثق والمُصادَق عليه من العلماء",
    whatItDoes: "يجمع المحتوى الذي مر بعملية التحقق الشرعي ويعرضه في قائمة موحدة.",
    whenToUse: "للتحقق من جودة المحتوى المُوثَّق ومراجعة ما يحتاج إعادة تقييم.",
    dataManaged: "سجلات التوثيق، المُراجِع، التاريخ، درجة الموثوقية",
    affectsPublic: false,
  },
  {
    key: "scholarly-verification", icon: "🔏", label: "التوثيق العلمي", group: "التحليل والذكاء",
    description: "إدارة عملية التحقق الشرعي للمحتوى العلمي",
    whatItDoes: "يوفر قوائم عمل للمراجعين العلميين لتوثيق المحتوى وإضافة ملاحظات التحقق.",
    whenToUse: "عندما يُرسَل محتوى للتحقق أو عند مراجعة المحتوى المُعلَّق.",
    dataManaged: "طلبات التحقق، ملاحظات المراجعين، درجات الموثوقية",
    affectsPublic: false,
  },
  {
    key: "knowledge-reasoning", icon: "💭", label: "محرك الاستدلال", group: "التحليل والذكاء",
    description: "محرك الاستدلال المنطقي للمحتوى الشرعي",
    whatItDoes: "يستخدم الذكاء الاصطناعي للاستدلال على العلاقات المنطقية بين المحتوى الشرعي.",
    whenToUse: "للبحث في التناقضات أو اكتشاف الروابط غير الواضحة بين المواضيع.",
    dataManaged: "نتائج التحليل المنطقي، سلاسل الاستدلال، الثغرات المعرفية",
    affectsPublic: false,
  },
  {
    key: "digital-learning", icon: "📱", label: "التعليم الرقمي", group: "التحليل والذكاء",
    description: "إدارة مسارات التعلم والبرامج التعليمية الرقمية",
    whatItDoes: "يتيح تصميم مسارات تعلم مُنظَّمة وتتبع تقدم المستخدمين.",
    whenToUse: "لإطلاق برنامج تعليمي جديد أو متابعة تقدم المتعلمين.",
    dataManaged: "مسارات التعلم، نقاط التقدم، الشهادات، إحصائيات الإتمام",
    affectsPublic: true,
  },
  // ── المجتمع ──────────────────────────────────────────────────────────
  {
    key: "users", icon: "👥", label: "المستخدمون", group: "المجتمع والإدارة",
    description: "إدارة حسابات المستخدمين وصلاحياتهم",
    whatItDoes: "يعرض قائمة المستخدمين ويتيح تعديل صلاحياتهم أو تعليق حساباتهم.",
    whenToUse: "لترقية مستخدم إلى مراجع أو مشرف أو لمعالجة شكوى متعلقة بحساب.",
    dataManaged: "بيانات الحسابات، الصلاحيات، سجل النشاط، حالة الحساب",
    affectsPublic: false,
  },
  {
    key: "submissions", icon: "📩", label: "المقترحات", group: "المجتمع والإدارة",
    description: "مراجعة المحتوى المُقترح من زوار الموقع",
    whatItDoes: "يعرض المحتوى الذي أرسله الزوار (فوائد، أسئلة، تصحيحات) لمراجعته واعتماده.",
    whenToUse: "دورياً لمراجعة ما أرسله المجتمع والرد عليه.",
    dataManaged: "طلبات المجتمع، نوع المحتوى المُقترح، حالة المراجعة",
    affectsPublic: false,
  },
  {
    key: "reports", icon: "📊", label: "التقارير والبلاغات", group: "المجتمع والإدارة",
    description: "مراجعة البلاغات والتقارير المُرسَلة عن المحتوى",
    whatItDoes: "يجمع البلاغات التي أرسلها الزوار عن محتوى مُشكِل ويتيح معالجتها.",
    whenToUse: "عند وجود بلاغات جديدة أو بشكل دوري للمراجعة.",
    dataManaged: "نوع البلاغ، وصفه، المحتوى المُبلَّغ عنه، حالة المعالجة",
    affectsPublic: false,
  },
  // ── النظام المتقدم ───────────────────────────────────────────────────
  {
    key: "autonomous-ai", icon: "🔬", label: "المنظومة الذاتية", group: "النظام المتقدم",
    description: "منظومة الذكاء الاصطناعي المستقل لأتمتة المحتوى",
    whatItDoes: "تشغّل عمليات الإنتاج والمراجعة والنشر تلقائياً وفق قواعد مُبرمَجة.",
    whenToUse: "لإعداد سير عمل تلقائية أو مراقبة العمليات الآلية الجارية.",
    dataManaged: "قواعد الأتمتة، سجلات التشغيل، الجدولة الزمنية",
    affectsPublic: false,
  },
  {
    key: "global-reference", icon: "🌍", label: "المرجع العالمي", group: "النظام المتقدم",
    description: "قاعدة بيانات المرجعية الشرعية العالمية",
    whatItDoes: "يربط محتوى المنصة بالمصادر الشرعية العالمية الموثوقة.",
    whenToUse: "لإثراء بيانات المراجع أو التحقق من مصدر حكم شرعي.",
    dataManaged: "قاعدة المصادر، التصنيفات، الروابط المرجعية",
    affectsPublic: false,
  },
  {
    key: "islamic-intelligence", icon: "🧬", label: "الاستخبارات العلمية", group: "النظام المتقدم",
    description: "تحليل التوجهات والأنماط في المحتوى الشرعي",
    whatItDoes: "يحلل الأنماط والاتجاهات في المحتوى باستخدام نماذج الذكاء الاصطناعي.",
    whenToUse: "للكشف عن فجوات المحتوى أو الموضوعات الأكثر استفساراً.",
    dataManaged: "تقارير التحليل، الأنماط، اقتراحات المحتوى",
    affectsPublic: false,
  },
  {
    key: "open-platform", icon: "🔓", label: "Open Platform", group: "النظام المتقدم",
    description: "واجهة برمجة التطبيقات المفتوحة للمطورين",
    whatItDoes: "تتيح إدارة مفاتيح API والتطبيقات الخارجية المُتكاملة مع المنصة.",
    whenToUse: "لإضافة تطبيق خارجي جديد أو مراجعة بيانات استخدام API.",
    dataManaged: "مفاتيح API، إحصائيات الاستخدام، قائمة التطبيقات المُتكاملة",
    affectsPublic: false,
  },
  {
    key: "governance", icon: "🏛", label: "الحوكمة المؤسسية", group: "النظام المتقدم",
    description: "إدارة الصلاحيات والأدوار والحوكمة المؤسسية",
    whatItDoes: "يُعرِّف الأدوار والصلاحيات ويُخصِّصها للمستخدمين.",
    whenToUse: "لإضافة دور جديد أو تعديل صلاحيات دور قائم.",
    dataManaged: "قائمة الأدوار، الصلاحيات المُخصَّصة، سياسات الوصول",
    affectsPublic: false,
  },
  {
    key: "knowledge-graph", icon: "🕸", label: "الرسم البياني", group: "النظام المتقدم",
    description: "خريطة العلاقات بين عناصر المحتوى في المنصة",
    whatItDoes: "يعرض شبكة العلاقات بين الدروس والمشايخ والمواضيع والمصادر.",
    whenToUse: "لاستكشاف الارتباطات الخفية بين المحتوى أو إدارة العلاقات.",
    dataManaged: "العلاقات بين عناصر المحتوى، أوزان الارتباط",
    affectsPublic: false,
  },
  {
    key: "settings", icon: "⚙", label: "الإعدادات", group: "النظام المتقدم",
    description: "إعدادات المنصة العامة والتكوينات التقنية",
    whatItDoes: "تتيح ضبط الإعدادات العامة للمنصة مثل الثيم والإشعارات والتكاملات.",
    whenToUse: "لتغيير إعداد عام أو ضبط تكامل خارجي.",
    dataManaged: "الإعدادات العامة، التكوينات، متغيرات البيئة المرئية",
    affectsPublic: true,
  },
];

const GROUPS = [
  "المحتوى",
  "الشريعة",
  "الاستيراد والذكاء الاصطناعي",
  "التحليل والذكاء",
  "المجتمع والإدارة",
  "النظام المتقدم",
];

// ── مساعدون ────────────────────────────────────────────────────────────
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 5)  return "طاب سهركم";
  if (h < 12) return "صباح الخير";
  if (h < 18) return "مساء الخير";
  return "مساء النور";
}

function getArabicDate(): string {
  return new Date().toLocaleDateString("ar-KW", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

// ── مكوّن بطاقة القسم ──────────────────────────────────────────────────
function SectionCard({
  card,
  onEnter,
}: {
  card: SectionCard;
  onEnter: (key: AdminSection) => void;
}) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="dsc-card">
      <div className="dsc-card__head">
        <span className="dsc-card__icon" aria-hidden="true">{card.icon}</span>
        <div className="dsc-card__meta">
          <p className="dsc-card__title">{card.label}</p>
          <span className={`dsc-card__pub ${card.affectsPublic ? "dsc-card__pub--yes" : "dsc-card__pub--no"}`}>
            {card.affectsPublic ? "يؤثر على الموقع" : "داخلي فقط"}
          </span>
        </div>
      </div>
      <p className="dsc-card__desc">{card.description}</p>

      {showInfo && (
        <div className="dsc-card__info">
          <p><strong>الوظيفة:</strong> {card.whatItDoes}</p>
          <p><strong>متى تستخدمه:</strong> {card.whenToUse}</p>
          <p><strong>البيانات التي يُدير:</strong> {card.dataManaged}</p>
        </div>
      )}

      <div className="dsc-card__actions">
        <button
          type="button"
          className="dsc-card__info-btn"
          onClick={() => setShowInfo((v) => !v)}
          aria-expanded={showInfo}
        >
          {showInfo ? "إخفاء" : "ماذا تفعل هذه الخانة؟"}
        </button>
        <button
          type="button"
          className="dsc-card__enter-btn"
          onClick={() => onEnter(card.key)}
        >
          دخول ←
        </button>
      </div>
    </div>
  );
}

// ── المكوّن الرئيسي ──────────────────────────────────────────────────────
export function DashboardSection() {
  const { showError, showSuccess, onSectionChange } = useAdminShell();
  const { user } = useAuth();

  const [data, setData]           = useState<DashboardData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [cmsStats, setCmsStats]   = useState<Awaited<ReturnType<typeof getCmsDashboardStats>> | null>(null);
  const [localSearches, setLocalSearches] = useState<{ query: string; count: number }[]>([]);
  const [search, setSearch]       = useState("");
  const [activeGroup, setActiveGroup] = useState<string>("الكل");

  const load = () => {
    setLoading(true);
    Promise.all([adminGetDashboardStats(), getCmsDashboardStats()])
      .then(([result, cms]) => {
        setData(result);
        setCmsStats(cms);
      })
      .catch(() => showError("تعذّر تحميل بيانات لوحة التحكم."))
      .finally(() => setLoading(false));
    setLocalSearches(getTopSearchQueries(6));
  };

  useEffect(() => { load(); }, []);

  const resolveReport = async (id: string) => {
    const { error } = await adminResolveReport(id);
    if (error) { showError("تعذّر إغلاق البلاغ."); return; }
    showSuccess("تم إغلاق البلاغ.");
    load();
  };

  // فلترة الأقسام
  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase();
    return SECTION_CATALOG.filter((c) => {
      if (activeGroup !== "الكل" && c.group !== activeGroup) return false;
      if (!q) return true;
      return (
        c.label.includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.group.includes(q)
      );
    });
  }, [search, activeGroup]);

  const groupedCards = useMemo(() => {
    const groups: Record<string, SectionCard[]> = {};
    filteredCards.forEach((c) => {
      if (!groups[c.group]) groups[c.group] = [];
      groups[c.group].push(c);
    });
    return groups;
  }, [filteredCards]);

  if (loading || !data) return <Loading />;

  const { stats, recentReports, recentLessons, topViewedLessons, topSearches } = data;
  const searches  = topSearches.length > 0 ? topSearches : localSearches;
  const fullName  = user?.profile?.full_name ?? "المشرف";
  const dbOk      = isSupabaseConfigured() && stats.dbConnected !== false;

  return (
    <div>
      {/* ── بانر الترحيب ── */}
      <div className="admin-welcome">
        <div className="admin-welcome__text">
          <p className="admin-welcome__greeting">{getGreeting()}</p>
          <p className="admin-welcome__name">{fullName}</p>
          <p className="admin-welcome__date">{getArabicDate()}</p>
        </div>
        <div className="admin-welcome__icon" aria-hidden="true">🕌</div>
      </div>

      {/* ── حالة النظام ── */}
      <div className="admin-status-row">
        <span className={`admin-status-dot admin-status-dot--${dbOk ? "ok" : "warn"}`}>
          قاعدة البيانات: {dbOk ? "متصلة" : "غير متاحة"}
        </span>
        <span className={`admin-status-dot admin-status-dot--${stats.serverOk ? "ok" : "warn"}`}>
          الخادم: {stats.serverOk ? "يعمل" : "تحقق يدوياً"}
        </span>
        {stats.pendingReports > 0 && (
          <span className="admin-status-dot admin-status-dot--error">
            {stats.pendingReports} بلاغ معلّق
          </span>
        )}
        {cmsStats && (
          <span className="admin-status-dot admin-status-dot--ok">
            CMS: {cmsStats.indexTotal.toLocaleString("ar")} مفهرس
          </span>
        )}
      </div>

      {/* ── إحصائيات مختصرة ── */}
      <div className="dsc-quick-stats">
        {[
          { n: stats.totalLessons,  label: "درس",      icon: "▶" },
          { n: stats.totalSheikhs,  label: "شيخ",      icon: "👤" },
          { n: stats.totalBooks,    label: "كتاب",     icon: "📚" },
          { n: stats.totalUsers,    label: "مستخدم",   icon: "👥" },
          { n: stats.todayViews,    label: "مشاهدة اليوم", icon: "👁" },
          { n: stats.pendingReports,label: "بلاغ معلّق", icon: "🚩" },
        ].map(({ n, label, icon }) => (
          <div key={label} className="dsc-qstat">
            <span className="dsc-qstat__icon">{icon}</span>
            <span className="dsc-qstat__n">{n.toLocaleString("ar")}</span>
            <span className="dsc-qstat__label">{label}</span>
          </div>
        ))}
      </div>

      {/* ── بلاغات معلّقة ── */}
      {recentReports.length > 0 && (
        <div className="admin-reports-panel" style={{ marginBottom: "1.5rem" }}>
          <p className="admin-reports-panel__title">🚩 بلاغات تحتاج مراجعة</p>
          {recentReports.map((rep: any) => (
            <div key={rep.id} className="admin-report-item">
              <span className="admin-report-item__type">{rep.report_type}</span>
              <p className="admin-report-item__desc">{rep.description}</p>
              <button type="button" onClick={() => resolveReport(rep.id)} className="admin-report-item__btn">
                تمت المراجعة
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── فاصل ── */}
      <div className="dsc-divider">
        <span>مركز إدارة الأقسام</span>
      </div>

      {/* ── شريط البحث والفلترة ── */}
      <div className="dsc-toolbar">
        <div className="dsc-search-wrap">
          <span className="dsc-search-icon" aria-hidden="true">🔍</span>
          <input
            className="dsc-search"
            type="search"
            placeholder="ابحث في أقسام لوحة التحكم…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="بحث في الأقسام"
          />
        </div>
        <div className="dsc-group-tabs" role="tablist" aria-label="تصفية حسب المجموعة">
          {["الكل", ...GROUPS].map((g) => (
            <button
              key={g}
              role="tab"
              type="button"
              className={`dsc-group-tab${activeGroup === g ? " is-active" : ""}`}
              aria-selected={activeGroup === g}
              onClick={() => setActiveGroup(g)}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* ── بطاقات الأقسام ── */}
      {Object.keys(groupedCards).length === 0 ? (
        <p className="dsc-empty">لا توجد أقسام تطابق البحث.</p>
      ) : (
        Object.entries(groupedCards).map(([group, cards]) => (
          <div key={group} className="dsc-group">
            <h3 className="dsc-group__title">{group}</h3>
            <div className="dsc-cards-grid">
              {cards.map((card) => (
                <SectionCard
                  key={card.key}
                  card={card}
                  onEnter={onSectionChange}
                />
              ))}
            </div>
          </div>
        ))
      )}

      {/* ── لوحات المعلومات الإضافية ── */}
      <div className="dsc-divider" style={{ marginTop: "2rem" }}>
        <span>آخر النشاطات</span>
      </div>
      <div className="admin-info-grid">
        <div className="admin-info-panel">
          <p className="admin-info-panel__title">🕒 آخر تحديثات الدروس</p>
          {recentLessons.length === 0 ? (
            <p className="admin-info-panel__empty">لا توجد تحديثات حديثة.</p>
          ) : (
            <ul className="admin-info-panel__list">
              {recentLessons.map((lesson: any) => (
                <li key={lesson.id} className="admin-info-panel__item">
                  <span className="admin-info-panel__item-title">{lesson.title}</span>
                  <span className="admin-info-panel__item-meta">
                    {lesson.updated_at ? new Date(lesson.updated_at).toLocaleDateString("ar-KW") : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="admin-info-panel">
          <p className="admin-info-panel__title">🔥 أكثر الدروس مشاهدة</p>
          {topViewedLessons.length === 0 ? (
            <p className="admin-info-panel__empty">لا توجد مشاهدات مسجّلة بعد.</p>
          ) : (
            <ol className="admin-info-panel__list" style={{ paddingInlineStart: "1.25rem", listStyle: "decimal" }}>
              {topViewedLessons.map((item) => (
                <li key={item.id} className="admin-info-panel__item">
                  <Link href={`/lessons/${item.id}`} className="admin-info-panel__item-title">{item.title}</Link>
                  <span className="admin-info-panel__item-meta">{item.views} مشاهدة</span>
                </li>
              ))}
            </ol>
          )}
        </div>
        <div className="admin-info-panel">
          <p className="admin-info-panel__title">🔍 أكثر عمليات البحث</p>
          {searches.length === 0 ? (
            <p className="admin-info-panel__empty">لا توجد عمليات بحث مسجّلة بعد.</p>
          ) : (
            <ol className="admin-info-panel__list" style={{ paddingInlineStart: "1.25rem", listStyle: "decimal" }}>
              {searches.map((item) => (
                <li key={item.query} className="admin-info-panel__item">
                  <Link href={`/search/${encodeURIComponent(item.query)}`} className="admin-info-panel__item-title">
                    {item.query}
                  </Link>
                  <span className="admin-info-panel__item-meta">{item.count} مرة</span>
                </li>
              ))}
            </ol>
          )}
        </div>
        {cmsStats && (
          <div className="admin-info-panel">
            <p className="admin-info-panel__title">📊 فهرس CMS</p>
            <ul className="admin-info-panel__list">
              {[
                { label: "إجمالي المفهرس", value: cmsStats.indexTotal.toLocaleString("ar") },
                { label: "عمليات استيراد",  value: cmsStats.importJobsTotal.toLocaleString("ar") },
                { label: "أذكار موثقة",     value: cmsStats.verifiedAdhkarTotal.toLocaleString("ar") },
                { label: "سجل تدقيق اليوم",value: cmsStats.auditLogsToday.toLocaleString("ar") },
                { label: "مجدولة للنشر",   value: cmsStats.scheduledCount.toLocaleString("ar") },
              ].map((row) => (
                <li key={row.label} className="admin-info-panel__item">
                  <span className="admin-info-panel__item-title">{row.label}</span>
                  <span className="admin-info-panel__item-meta">{row.value}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
