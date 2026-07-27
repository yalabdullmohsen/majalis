import { lazy, Suspense, useEffect, useState, type CSSProperties } from "react";
import contentCounts from "@/data/content-counts.json";
import { applyPageSeo } from "@/lib/seo";
import { Link } from "wouter";
import { useDailyContext } from "@/lib/daily-context";
import { useAuth } from "@/components/AuthProvider";
import { getRecentPages, type RecentPage } from "@/lib/recent-pages";
import { Wrench } from "lucide-react";
import { SectionErrorBoundary } from "@/components/ErrorBoundary";
import { HomeAboutSection } from "@/components/home/HomeAboutSection";
import { HomeUpcomingLessons } from "@/components/home/HomeUpcomingLessons";
import { HomeDailyProgress } from "@/components/home/HomeDailyProgress";
import { HomeContinueWidget } from "@/components/home/HomeContinueWidget";
import { HomeLearningSeasonsWidget } from "@/components/home/HomeLearningSeasonsWidget";
import { HomeUpcomingCourses } from "@/components/home/HomeUpcomingCourses";
import { FridayBanner } from "@/components/FridayBanner";
import { getHijriDateString } from "@/lib/hijri-utils";
import { fetchPrayerTimes, computePrayerCountdown, type PrayerTimesPayload } from "@/lib/prayer-times";
import { getSiteSettings, isMaintenanceMode } from "@/lib/site-settings";
import { toArabicDigits } from "@/lib/utils";
import { HomeCustomizeSheet } from "@/components/home/HomeCustomizeSheet";
import { HomeRecentPagesBar } from "@/components/home/HomeRecentPagesBar";
import { HomeStartHereSection } from "@/components/home/HomeStartHereSection";
import { HomeExplorePlatform } from "@/components/home/HomeExplorePlatform";
import { QUICK_LINKS } from "@/lib/home-feature-catalog";
import {
  HOME_WIDGET_DEFS,
  getLocalHomepagePrefs,
  saveLocalHomepagePrefs,
  fetchRemoteHomepagePrefs,
  visibleWidgetOrder,
  type HomepagePrefs,
} from "@/lib/homepage-layout";
import "@/styles/pages/home.css";
import "@/styles/components/home/home-quick-access.css";

// الودجتات الاختيارية لا تدخل حزمة الرئيسية للمستخدم الجديد. تُحمَّل فقط
// إذا فعّلها المستخدم من شاشة التخصيص، مع بقاء الوظيفة والحالة المحفوظة.
const HomeCompactPrayer = lazy(() => import("@/components/home/HomeCompactPrayer").then((m) => ({ default: m.HomeCompactPrayer })));
const HomeDailyBenefits = lazy(() => import("@/components/home/HomeDailyBenefits").then((m) => ({ default: m.HomeDailyBenefits })));
const HomeUpcomingEvents = lazy(() => import("@/components/home/HomeUpcomingEvents").then((m) => ({ default: m.HomeUpcomingEvents })));
const HomeSunnahByTime = lazy(() => import("@/components/home/HomeSunnahByTime").then((m) => ({ default: m.HomeSunnahByTime })));
const HomeIslamicOccasions = lazy(() => import("@/components/home/HomeIslamicOccasions").then((m) => ({ default: m.HomeIslamicOccasions })));
const HomeLatestUpdates = lazy(() => import("@/components/home/HomeLatestUpdates").then((m) => ({ default: m.HomeLatestUpdates })));
const HomePrayerRanks = lazy(() => import("@/components/home/HomePrayerRanks").then((m) => ({ default: m.HomePrayerRanks })));
const HomeFeaturedLibrary = lazy(() => import("@/components/home/HomeFeaturedLibrary").then((m) => ({ default: m.HomeFeaturedLibrary })));
const HomeQuizCard = lazy(() => import("@/components/home/HomeQuizCard").then((m) => ({ default: m.HomeQuizCard })));
const HomeWeekStreak = lazy(() => import("@/components/home/HomeWeekStreak").then((m) => ({ default: m.HomeWeekStreak })));
const HomeInterestingTopics = lazy(() => import("@/components/home/HomeInterestingTopics").then((m) => ({ default: m.HomeInterestingTopics })));
const HomeMindMapSection = lazy(() => import("@/components/home/HomeMindMapSection").then((m) => ({ default: m.HomeMindMapSection })));


function SafeHomeSection({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <SectionErrorBoundary name={name}>
      <Suspense fallback={<div className="skeleton-base hp-skel" aria-label={`تحميل ${name}`} />}>
        {children}
      </Suspense>
    </SectionErrorBoundary>
  );
}

/** خريطة مُعرِّف القسم القابل للتخصيص ← عرضه. تُستهلَك عبر homepage-layout.ts. */
const WIDGET_RENDERERS: Record<string, () => React.ReactNode> = {
  "lessons": () => (<><HomeUpcomingLessons /><HomeUpcomingCourses /></>),
  "prayer": () => <HomeCompactPrayer />,
  "continue": () => <HomeContinueWidget />,
  "daily-progress": () => <HomeDailyProgress />,
  "week-streak": () => <HomeWeekStreak />,
  "sunnah-time": () => <HomeSunnahByTime />,
  "explore": () => <HomeExplorePlatform />,
  "learning-seasons": () => <HomeLearningSeasonsWidget />,
  "occasions": () => <HomeIslamicOccasions />,
  "latest-updates": () => <HomeLatestUpdates />,
  "library": () => <HomeFeaturedLibrary />,
  "quiz": () => <HomeQuizCard />,
  "daily-benefits": () => <HomeDailyBenefits />,
  "upcoming-events": () => <HomeUpcomingEvents />,
  "prayer-ranks": () => <HomePrayerRanks />,
  "interesting-topics": () => <HomeInterestingTopics />,
  "mind-map": () => <HomeMindMapSection />,
};

const WIDGET_LABEL: Record<string, string> = Object.fromEntries(HOME_WIDGET_DEFS.map((w) => [w.id, w.label]));

export default function HomePage() {
  const { isAdmin, user } = useAuth();
  const dailyCtx = useDailyContext();

  // زر المتابعة الوحيد في البطاقة اليومية: آخر صفحة زارها المستخدم فعليًا،
  // أو دعوة افتراضية لزائر جديد بلا سجل تصفّح (يُقرأ بعد التركيب لتفادي
  // اختلاف الترطيب SSR/prerender، بنفس نمط RecentPagesBar أدناه).
  const [lastVisited, setLastVisited] = useState<RecentPage | null>(null);
  useEffect(() => {
    const pages = getRecentPages(2);
    // أول عنصر هو الصفحة الحالية غالبًا ("/")، فنأخذ أول صفحة مختلفة عنها
    const last = pages.find((p) => p.href !== "/") ?? null;
    setLastVisited(last);
  }, []);
  const continueHref  = lastVisited?.href ?? "/daily-wird";
  const continueLabel = lastVisited ? `تابع: ${lastVisited.label}` : "ابدأ يومك: الورد اليومي";

  // تخصيص أقسام الصفحة الرئيسية: محلي فورًا، مع مزامنة اختيارية من Supabase عند تسجيل الدخول
  const [homePrefs, setHomePrefs] = useState<HomepagePrefs>(() => getLocalHomepagePrefs());
  const [customizeOpen, setCustomizeOpen] = useState(false);
  useEffect(() => {
    if (!user?.id) return;
    fetchRemoteHomepagePrefs(user.id).then((remote) => {
      if (remote) { setHomePrefs(remote); saveLocalHomepagePrefs(remote); }
    });
  }, [user?.id]);

  // "دروس اليوم" (lessons) رُفعت لتصبح ثابتة مباشرة تحت البطل (طلب
  // مباشر)، فتُستثنى من حلقة الودجات القابلة لإعادة الترتيب العادية —
  // مع إبقاء احترام تفضيل الإخفاء الشخصي (visibleWidgetOrder نفسها).
  const visibleWidgets = visibleWidgetOrder(homePrefs);
  const showLessonsWidget = visibleWidgets.includes("lessons");
  const restWidgetOrder = visibleWidgets.filter((id) => id !== "lessons");

  // شريط الترويسة المُصغَّر: الصلاة القادمة والوقت المتبقي (بديل الشعار الكبير)
  const [heroPrayers, setHeroPrayers] = useState<PrayerTimesPayload | null>(null);
  useEffect(() => {
    fetchPrayerTimes().then(setHeroPrayers).catch(() => {});
  }, []);
  const [heroCountdown, setHeroCountdown] = useState<{ name: string; hms: string } | null>(null);
  useEffect(() => {
    if (!heroPrayers?.prayers?.length) return;
    const tick = () => {
      const cd = computePrayerCountdown(heroPrayers.prayers);
      const inGrace = cd.sinceSeconds != null;
      const name = inGrace && cd.graceNextSlot ? cd.graceNextSlot.name : cd.next?.name;
      const hms = inGrace && cd.graceNextHms ? cd.graceNextHms : cd.remainingHms;
      if (name && hms) setHeroCountdown({ name, hms });
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [heroPrayers]);

  useEffect(() => {
    applyPageSeo({
      path: "/",
      title: "المجلس العلمي، منصة العلوم الإسلامية",
      description: "منصة إسلامية شاملة للعلوم الشرعية: القرآن الكريم، الأذكار، الدروس العلمية، الأحكام الشرعية، والفقه المعاصر. محتوى معتمد في منهج المجلس العلمي",
      keywords: ["المجلس العلمي", "علوم إسلامية", "قرآن كريم", "أذكار", "أحكام شرعية", "دروس علمية"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "المجلس العلمي",
          url: "https://www.majlisilm.com",
          logo: "https://www.majlisilm.com/logo.png",
          description: "منصة إسلامية شاملة للعلوم الشرعية: القرآن الكريم والأذكار والدروس والأحكام الشرعية والفقه؛ محتوى معتمد في منهج المجلس العلمي",
          inLanguage: "ar",
          areaServed: { "@type": "Country", name: "الكويت" },
          sameAs: ["https://www.majlisilm.com"],
        },
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "المجلس العلمي",
          url: "https://www.majlisilm.com",
          inLanguage: "ar",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://www.majlisilm.com/search?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        },
      ],
    });
  }, []);


  return (
    <div className="home-page home-page--v4" dir="rtl">
      {isMaintenanceMode() && (
        <div role="status" className="home-maintenance-banner">
          {getSiteSettings().maintenanceMessage}
        </div>
      )}

      {/* ══════════════════ Hero الموحّد ══════════════════ */}
      <section className="hpv4-hero" aria-label="الصفحة الرئيسية">
        <div aria-hidden="true" className="hpv4-hero__edge-line" />

        <div className="home-hero-pattern" aria-hidden="true" />

        <svg aria-hidden="true" width="90" height="90" viewBox="0 0 90 90" className="hpv4-hero__corner hpv4-hero__corner--end">
          <g transform="translate(0,0)">
            <polygon points="45,5 55,25 75,15 65,35 85,45 65,55 75,75 55,65 45,85 35,65 15,75 25,55 5,45 25,35 15,15 35,25" fill="none" stroke="white" strokeWidth="0.8"/>
            <polygon points="45,20 52,35 67,30 57,42 68,55 52,50 45,65 38,50 22,55 33,42 23,30 38,35" fill="none" stroke="white" strokeWidth="0.5"/>
            <circle cx="45" cy="45" r="10" fill="none" stroke="white" strokeWidth="0.5"/>
          </g>
        </svg>

        <svg aria-hidden="true" width="90" height="90" viewBox="0 0 90 90" className="hpv4-hero__corner hpv4-hero__corner--start">
          <g transform="translate(0,0)">
            <polygon points="45,5 55,25 75,15 65,35 85,45 65,55 75,75 55,65 45,85 35,65 15,75 25,55 5,45 25,35 15,15 35,25" fill="none" stroke="white" strokeWidth="0.8"/>
            <polygon points="45,20 52,35 67,30 57,42 68,55 52,50 45,65 38,50 22,55 33,42 23,30 38,35" fill="none" stroke="white" strokeWidth="0.5"/>
            <circle cx="45" cy="45" r="10" fill="none" stroke="white" strokeWidth="0.5"/>
          </g>
        </svg>

        <div className="hpv4-hero__inner">

          <h1 className="hpv4-vision-title">ريادة المعرفة الإسلامية الرقمية</h1>

          <div className="hpv4-hero__greet">
            <p className="hpv4-hero__greet-main">
              {dailyCtx.greeting}
            </p>
            {dailyCtx.subGreeting && (
              <p className="hpv4-hero__greet-sub">
                {dailyCtx.subGreeting}
              </p>
            )}
            {dailyCtx.event && (
              <div
                className="hpv4-event-chip"
                style={{ "--hp-event-accent": dailyCtx.accentColor } as CSSProperties}
              >
                ✦ {dailyCtx.event}
              </div>
            )}
            {/* شريط التاريخ والصلاة القادمة — بديل الشعار الكبير واسم التطبيق
                (يبقى الشعار في شاشة البداية وصفحة "عن التطبيق" والأيقونة فقط) */}
            <div className="hpv4-meta-row">
              <span className="hpv4-meta-chip">
                <svg width="11" height="11" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                  <circle cx="9" cy="9" r="7"/><path d="M9 2C6.5 4 5 6.3 5 9s1.5 5 4 7"/><path d="M9 2c2.5 2 4 4.3 4 7s-1.5 5-4 7"/><path d="M2 9h14"/>
                </svg>
                {getHijriDateString()}
              </span>
              {heroCountdown && (
                <Link href="/prayer-times" className="hpv4-prayer-chip">
                  <svg width="11" height="11" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="9" cy="9" r="7.5"/><path d="M9 5v4l3 2"/>
                  </svg>
                  {heroCountdown.name} بعد <span dir="ltr">{heroCountdown.hms}</span>
                </Link>
              )}
            </div>
          </div>

          <div aria-hidden="true" className="hpv4-divider">
            <svg width="280" height="20" viewBox="0 0 280 20">
              <line x1="0" y1="10" x2="118" y2="10" stroke="rgba(255,255,255,0.8)" strokeWidth="0.7"/>
              <polygon points="130,4 140,10 130,16 120,10" fill="rgba(255,255,255,0.9)"/>
              <polygon points="150,7 157,10 150,13 143,10" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.5"/>
              <polygon points="130,4 140,10 130,16 120,10" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.4" transform="translate(20,0) scale(0.7) translate(-140,-10)"/>
              <line x1="162" y1="10" x2="280" y2="10" stroke="rgba(255,255,255,0.8)" strokeWidth="0.7"/>
            </svg>
          </div>

          {/* زر متابعة واحد — العنصر الثالث من البطاقة اليومية (ديناميكي: آخر صفحة
              زارها المستخدم، أو دعوة افتراضية لبدء الورد اليومي لزائر جديد) */}
          <div className="hpv4-hero__cta-wrap">
            <Link href={continueHref} className="hpv4-hero__cta-primary">
              <svg width="15" height="15" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 3l8 6-8 6V3z"/></svg>
              {continueLabel}
            </Link>
          </div>

          {isAdmin && (
            <div className="hpv4-admin-stats">
              {[
                { num: toArabicDigits(contentCounts.scholars),      label: "عالم مرجعي",   icon: "👤" },
                { num: toArabicDigits(contentCounts.quizQuestions), label: "سؤال اختباري", icon: "🧠" },
                { num: toArabicDigits(contentCounts.fawaid),        label: "فائدة علمية",  icon: "💡" },
                { num: toArabicDigits(contentCounts.books),         label: "كتاب علمي",    icon: "📚" },
              ].map(({ num, label, icon }) => (
                <div key={label} className="hpv4-admin-stat">
                  <div className="hpv4-admin-stat__icon">{icon}</div>
                  <div className="hpv4-admin-stat__num">{num}</div>
                  <div className="hpv4-admin-stat__label">{label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══ دروس اليوم ══ — ثابتة مباشرة تحت البطل. استُثنيت من حلقة
          الودجات (restWidgetOrder) لتفادي التكرار، مع احترام تفضيل الإخفاء. */}
      {showLessonsWidget && (
        <SafeHomeSection name={WIDGET_LABEL["lessons"] ?? "lessons"}>
          {WIDGET_RENDERERS["lessons"]?.()}
        </SafeHomeSection>
      )}

      {/* ══ زرتَ مؤخراً ══ */}
      <HomeRecentPagesBar />

      {/* ملاحظة: "لوحة المستخدم الشخصية" (ترحيب + آخر نشاطين) حُذفت من هنا —
          كانت تكرارًا حرفيًا لودجت "استمر من حيث توقفت" (HomeContinueWidget)
          الذي يعرض نفس البيانات (useRecentProgress) بمعالجة حالات أشمل
          (تسجيل دخول/تحميل/فراغ) ضمن قسم "أكمل من حيث توقفت" أدناه — لا حذف
          وظيفة، فقط إزالة ازدواج بصري (إعادة هيكلة الرئيسية، الأولوية 1). */}

      {/* ══ وصول سريع ══ */}
      <nav aria-label="وصول سريع" className="hp-quick-nav">
        <div className="hp-quick-nav__head">
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18">
            <polygon points="9,1 12,7 18,7 13,11 15,17 9,13 3,17 5,11 0,7 6,7" fill="currentColor" opacity="0.85"/>
          </svg>
          <p className="hp-quick-nav__title">وصول سريع</p>
        </div>
        <div className="hp-quick-nav__grid">
          {QUICK_LINKS.map(({ href, Icon: Ico, label, desc }) => (
            <Link key={label + href} href={href} aria-label={label} className="hp-quick-card">
              <span className="hp-quick-card__icon">
                <Ico size={14} strokeWidth={2} />
              </span>
              <div className="hp-quick-card__body">
                <div className="hp-quick-card__label">{label}</div>
                <div className="hp-quick-card__desc">{desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </nav>

      {/* ══ بانر صلاة الجمعة — إشعار صلاة، يبقى بحسب تعليمات الحفاظ على
          إشعارات الأذان والصلوات. بانرا التذكير بالصيام والشهر الهجري
          أُزيلا من الرئيسية (2026-07-22)؛ شهر الهجري يستمر بالعمل في
          صفحة التقويم كما هو. ══ */}
      <div className="hp-section-wrap hp-section-wrap--banners">
        <SafeHomeSection name="FridayBanner">
          <FridayBanner />
        </SafeHomeSection>
      </div>

      {/* ══ ابدأ من هنا ══ */}
      <HomeStartHereSection />

      <div className="hp-section-wrap hp-section-wrap--customize">
        <button type="button" className="hpv4-customize-trigger" onClick={() => setCustomizeOpen(true)}>
          <Wrench size={13} strokeWidth={2} aria-hidden="true" /> تخصيص الصفحة الرئيسية
        </button>
      </div>

      {/* ══════════════════ Main Content ══════════════════ */}
      <main className="home-container home-main home-main--v3">

        {restWidgetOrder.map((id) => (
          <SafeHomeSection key={id} name={WIDGET_LABEL[id] ?? id}>
            {WIDGET_RENDERERS[id]?.()}
          </SafeHomeSection>
        ))}

        <SafeHomeSection name="عن المجلس العلمي">
          <HomeAboutSection />
        </SafeHomeSection>

      </main>

      <HomeCustomizeSheet
        open={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
        onChange={setHomePrefs}
      />
    </div>
  );
}
