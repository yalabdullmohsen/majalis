/**
 * سجل الميزات المركزي — Feature Registry
 *
 * يوثّق كل صفحة وقسم في المشروع مع Route وحالته.
 * يُستخدم للفحص التلقائي أثناء البناء وللتوثيق.
 * قاعدة: أي صفحة تُضاف لـ App.tsx يجب أن تُضاف هنا.
 */

export type FeatureStatus = "active" | "coming-soon" | "admin-only" | "requires-auth" | "disabled";

export type FeatureEntry = {
  id: string;
  label: string;
  path: string;
  group: string;
  status: FeatureStatus;
  inSideNav: boolean;
  inBottomNav: boolean;
};

export const FEATURE_REGISTRY: FeatureEntry[] = [
  // ── الصفحة الرئيسية ──────────────────────────────────────────
  { id: "home",         label: "الرئيسية",          path: "/",             group: "رئيسي",         status: "active",       inSideNav: true,  inBottomNav: true  },
  { id: "kids",         label: "الأطفال",           path: "/kids",         group: "رئيسي",         status: "active",       inSideNav: true,  inBottomNav: false },

  // ── المحتوى التعليمي ─────────────────────────────────────────
  { id: "lessons",      label: "الدروس",             path: "/lessons",      group: "تعليم",         status: "active",       inSideNav: true,  inBottomNav: true  },
  { id: "annual-courses",label:"الدورات العلمية",    path: "/annual-courses",group:"تعليم",         status: "active",       inSideNav: true,  inBottomNav: false },
  { id: "library",      label: "المكتبة",            path: "/library",      group: "تعليم",         status: "active",       inSideNav: true,  inBottomNav: false },
  { id: "fawaid",       label: "الفوائد",            path: "/fawaid",       group: "تعليم",         status: "active",       inSideNav: true,  inBottomNav: false },
  { id: "hadith-index", label: "الأحاديث النبوية",   path: "/hadith",       group: "حديث",          status: "active",       inSideNav: true,  inBottomNav: false },
  { id: "hadith-sahih", label: "الأحاديث الصحيحة",  path: "/hadith/sahih", group: "حديث",          status: "active",       inSideNav: false, inBottomNav: false },
  { id: "hadith-daif",  label: "الأحاديث الضعيفة",  path: "/hadith/daif",  group: "حديث",          status: "active",       inSideNav: false, inBottomNav: false },
  { id: "hadith-mawdu", label: "الأحاديث الموضوعة", path: "/hadith/mawdu", group: "حديث",          status: "active",       inSideNav: false, inBottomNav: false },
  { id: "tawhid",       label: "التوحيد",            path: "/tawhid",       group: "عقيدة",         status: "active",       inSideNav: true,  inBottomNav: false },
  { id: "adhkar",       label: "الأذكار",            path: "/adhkar",       group: "عبادات",        status: "active",       inSideNav: true,  inBottomNav: false },
  { id: "arbaeen",      label: "الأربعون النووية",   path: "/arbaeen-nawawi",group:"حديث",          status: "active",       inSideNav: true,  inBottomNav: false },
  { id: "daily-wird",   label: "الورد اليومي",       path: "/daily-wird",   group: "عبادات",        status: "active",       inSideNav: true,  inBottomNav: false },
  { id: "tasbih",       label: "التسبيح",            path: "/tasbih",       group: "عبادات",        status: "active",       inSideNav: true,  inBottomNav: false },
  { id: "qa",           label: "الأسئلة والأجوبة",  path: "/qa",           group: "تعليم",         status: "active",       inSideNav: true,  inBottomNav: false },
  { id: "quiz",         label: "لعبة سين جيم – أسئلة وأجوبة", path: "/quiz",   group: "تفاعلي",        status: "active",       inSideNav: true,  inBottomNav: false },
  { id: "stories",      label: "القصص الإسلامية",   path: "/stories",      group: "قصص",           status: "active",       inSideNav: true,  inBottomNav: false },
  { id: "prophets",     label: "قصص الأنبياء",      path: "/prophets",     group: "قصص",           status: "active",       inSideNav: true,  inBottomNav: false },
  { id: "updates",      label: "آخر المستجدات",     path: "/updates",      group: "أخبار",         status: "active",       inSideNav: true,  inBottomNav: false },
  { id: "miracles",     label: "الإعجاز العلمي",    path: "/miracles",     group: "علم",           status: "active",       inSideNav: true,  inBottomNav: false },
  { id: "seerah",       label: "السيرة النبوية",    path: "/seerah",       group: "سيرة",          status: "active",       inSideNav: true,  inBottomNav: false },
  { id: "fiqh",         label: "الفقه الإسلامي",   path: "/fiqh",         group: "فقه",           status: "active",       inSideNav: false, inBottomNav: false },

  // ── الأحكام والفقه ───────────────────────────────────────────
  { id: "rulings",      label: "الأحكام الشرعية",  path: "/rulings",      group: "فقه",           status: "active",       inSideNav: true,  inBottomNav: false },
  { id: "fiqh-council", label: "المجمع الفقهي",    path: "/fiqh-council", group: "فقه",           status: "active",       inSideNav: true,  inBottomNav: false },

  // ── القرآن والأذكار ──────────────────────────────────────────
  { id: "mushaf",        label: "المصحف الشريف",   path: "/mushaf",       group: "قرآن",          status: "active",       inSideNav: true,  inBottomNav: false },
  { id: "quran",        label: "القرآن الكريم",    path: "/quran-hub",    group: "قرآن",          status: "active",       inSideNav: true,  inBottomNav: false },
  { id: "quran-circles",label:"حلقات التحفيظ",     path: "/quran-circles",group:"قرآن",           status: "coming-soon",  inSideNav: true,  inBottomNav: false },

  // ── الأدوات والتفاعل ─────────────────────────────────────────
  { id: "prayer-times", label: "مواقيت الصلاة",    path: "/prayer-times", group: "صلاة",          status: "active",       inSideNav: true,  inBottomNav: true  },
  { id: "qibla",        label: "القبلة",            path: "/qibla",        group: "صلاة",          status: "active",       inSideNav: true,  inBottomNav: false },
  { id: "calendar",     label: "التقويم",           path: "/calendar",     group: "أدوات",         status: "active",       inSideNav: true,  inBottomNav: false },
  { id: "occasions",    label: "المناسبات",         path: "/occasions",    group: "أدوات",         status: "active",       inSideNav: true,  inBottomNav: false },
  { id: "search",       label: "البحث",             path: "/search",       group: "أدوات",         status: "active",       inSideNav: true,  inBottomNav: true  },
  { id: "assistant",    label: "المساعد الذكي",     path: "/assistant",    group: "أدوات",         status: "active",       inSideNav: true,  inBottomNav: false },
  { id: "flashcards",   label: "بطاقات المراجعة",  path: "/flashcards",   group: "تعليم",         status: "active",       inSideNav: true,  inBottomNav: false },
  { id: "knowledge-graph",label:"خارطة المعرفة",   path: "/knowledge-graph",group:"أدوات",        status: "active",       inSideNav: true,  inBottomNav: false },
  /* عُطِّلت 2026-07-23: أُزيلت من كل نقاط الدخول (رئيسية/قوائم/خرائط ذهنية/
     مسارات)، والمسار القديم يُعاد توجيهه دائمًا إلى /qa (App.tsx + vercel.json).
     الكود (ScholarlyResearchPage.tsx وrag-service.ts) لم يُحذف عمدًا — بلا
     أي معتمِد آخر (تحقّقتُ)، فيمكن إعادة تفعيله لاحقًا دون إعادة بناء. */
  { id: "scholarly-research",label:"الباحث الشرعي",path: "/scholarly-research",group:"أدوات",    status: "disabled",     inSideNav: false, inBottomNav: false },
  { id: "universities", label: "دليل الجامعات",    path: "/universities", group: "مؤسسات",        status: "active",       inSideNav: true,  inBottomNav: false },

  // ── التعلم ───────────────────────────────────────────────────
  { id: "learn",         label: "أبواب العلم",       path: "/learn",        group: "تعلم",          status: "active",       inSideNav: true,  inBottomNav: false },
  { id: "learning-paths",label: "المسارات العلمية", path: "/learning/paths",group: "تعلم",     status: "active",       inSideNav: true,  inBottomNav: false },
  { id: "my-learning",  label: "لوحتي التعليمية",  path: "/my-learning",  group: "تعلم",          status: "requires-auth",inSideNav: true,  inBottomNav: false },
  { id: "learning-plan",label: "خطة التعلم",       path: "/learning-plan",group: "تعلم",          status: "active",       inSideNav: true,  inBottomNav: false },

  // ── التطبيق والقانونية ────────────────────────────────────────
  { id: "about",        label: "من نحن",             path: "/about",        group: "تطبيق",         status: "active",       inSideNav: true,  inBottomNav: false },
  { id: "contact",      label: "تواصل معنا",          path: "/contact",      group: "تطبيق",         status: "active",       inSideNav: true,  inBottomNav: false },
  { id: "privacy",      label: "سياسة الخصوصية",     path: "/privacy",      group: "تطبيق",         status: "active",       inSideNav: false, inBottomNav: false },
  { id: "terms",        label: "شروط الاستخدام",      path: "/terms",        group: "تطبيق",         status: "active",       inSideNav: false, inBottomNav: false },
  { id: "submit",       label: "أضف محتوى",           path: "/submit",       group: "تطبيق",         status: "active",       inSideNav: true,  inBottomNav: false },
  { id: "features-in-progress", label: "قيد التطوير", path: "/features-in-progress", group: "تطبيق", status: "active",     inSideNav: true,  inBottomNav: false },
  { id: "topics",       label: "الموضوعات",           path: "/topics",       group: "تعليم",         status: "active",       inSideNav: false, inBottomNav: false },

  // ── الإدارة ───────────────────────────────────────────────────
  { id: "admin",        label: "لوحة التحكم",       path: "/admin",        group: "إدارة",         status: "admin-only",   inSideNav: true,  inBottomNav: false },
  { id: "settings",     label: "الإعدادات",          path: "/settings",     group: "حساب",          status: "requires-auth",inSideNav: true,  inBottomNav: false },
];

// ─── وظيفة الفحص السريع ─────────────────────────────────────────────────────

/**
 * تُرجع قائمة بالمسارات الموثّقة في السجل.
 * استخدامها: للتحقق من أن كل route مسجّل رسمياً.
 */
export function getRegisteredPaths(): string[] {
  return FEATURE_REGISTRY.map((f) => f.path);
}

/**
 * تُرجع الميزات الفعّالة فقط.
 */
export function getActiveFeatures(): FeatureEntry[] {
  return FEATURE_REGISTRY.filter((f) => f.status === "active");
}

/**
 * تُرجع الميزات حسب المجموعة.
 */
export function getFeaturesByGroup(): Record<string, FeatureEntry[]> {
  const groups: Record<string, FeatureEntry[]> = {};
  for (const f of FEATURE_REGISTRY) {
    if (!groups[f.group]) groups[f.group] = [];
    groups[f.group].push(f);
  }
  return groups;
}

/**
 * للتحقق من وجود صفحة بمسار معين في السجل.
 */
export function isPathRegistered(path: string): boolean {
  return FEATURE_REGISTRY.some((f) => f.path === path);
}
