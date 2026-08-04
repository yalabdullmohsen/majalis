import { Suspense, useEffect, useState } from "react";
import contentCounts from "@/data/content-counts.json";
import { applyPageSeo } from "@/lib/seo";
import { Link } from "wouter";
import { useDailyContext } from "@/lib/daily-context";
import { useAuth } from "@/components/AuthProvider";
import { getRecentPages, type RecentPage } from "@/lib/recent-pages";
import {
  BookOpen, Clock, GraduationCap, Target, Wrench,
} from "lucide-react";
import { SectionErrorBoundary } from "@/components/ErrorBoundary";
import { HomeDailyProgress } from "@/components/home/HomeDailyProgress";
import { HomeContinueWidget } from "@/components/home/HomeContinueWidget";
import { HomeLearningSeasonsWidget } from "@/components/home/HomeLearningSeasonsWidget";
import { FridayBanner } from "@/components/FridayBanner";
import { getHijriDateString } from "@/lib/hijri-utils";
import { fetchPrayerTimes, computePrayerCountdown, type PrayerTimesPayload } from "@/lib/prayer-times";
import { getSiteSettings, isMaintenanceMode } from "@/lib/site-settings";
import { toArabicDigits } from "@/lib/utils";
import { HomeCustomizeSheet } from "@/components/home/HomeCustomizeSheet";
import { HomeRecentPagesBar } from "@/components/home/HomeRecentPagesBar";
import { HomeUpcomingLessons } from "@/components/home/HomeUpcomingLessons";
import { HomeUpcomingCourses } from "@/components/home/HomeUpcomingCourses";
import { lazyWithRetry } from "@/lib/lazy-with-retry";
import { FEATURED } from "@/lib/home-feature-catalog";
import {
  HOME_WIDGET_DEFS,
  getLocalHomepagePrefs,
  saveLocalHomepagePrefs,
  fetchRemoteHomepagePrefs,
  visibleWidgetOrder,
  type HomepagePrefs,
} from "@/lib/homepage-layout";
import { IgdsButton, IgdsSectionHeader, IgdsSkeleton } from "@/components/igds";
import "@/styles/igds/components.css";
import "@/styles/pages/home-igds.css";

const HomeCompactPrayer = lazyWithRetry(() => import("@/components/home/HomeCompactPrayer").then((m) => ({ default: m.HomeCompactPrayer })), "HomeCompactPrayer");
const HomeDailyBenefits = lazyWithRetry(() => import("@/components/home/HomeDailyBenefits").then((m) => ({ default: m.HomeDailyBenefits })), "HomeDailyBenefits");
const HomeUpcomingEvents = lazyWithRetry(() => import("@/components/home/HomeUpcomingEvents").then((m) => ({ default: m.HomeUpcomingEvents })), "HomeUpcomingEvents");
const HomeSunnahByTime = lazyWithRetry(() => import("@/components/home/HomeSunnahByTime").then((m) => ({ default: m.HomeSunnahByTime })), "HomeSunnahByTime");
const HomeIslamicOccasions = lazyWithRetry(() => import("@/components/home/HomeIslamicOccasions").then((m) => ({ default: m.HomeIslamicOccasions })), "HomeIslamicOccasions");
const HomePrayerRanks = lazyWithRetry(() => import("@/components/home/HomePrayerRanks").then((m) => ({ default: m.HomePrayerRanks })), "HomePrayerRanks");
const HomeQuizCard = lazyWithRetry(() => import("@/components/home/HomeQuizCard").then((m) => ({ default: m.HomeQuizCard })), "HomeQuizCard");
const HomeWeekStreak = lazyWithRetry(() => import("@/components/home/HomeWeekStreak").then((m) => ({ default: m.HomeWeekStreak })), "HomeWeekStreak");
const HomeInterestingTopics = lazyWithRetry(() => import("@/components/home/HomeInterestingTopics").then((m) => ({ default: m.HomeInterestingTopics })), "HomeInterestingTopics");
const HomeMindMapSection = lazyWithRetry(() => import("@/components/home/HomeMindMapSection").then((m) => ({ default: m.HomeMindMapSection })), "HomeMindMapSection");
const HomeExplorePlatform = lazyWithRetry(() => import("@/components/home/HomeExplorePlatform").then((m) => ({ default: m.HomeExplorePlatform })), "HomeExplorePlatform");

function SafeHomeSection({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <SectionErrorBoundary name={name}>
      <Suspense fallback={<div className="igds-skeleton" aria-label={`تحميل ${name}`}><IgdsSkeleton lines={3} /></div>}>
        {children}
      </Suspense>
    </SectionErrorBoundary>
  );
}

const WIDGET_RENDERERS: Record<string, () => React.ReactNode> = {
  lessons: () => (<><HomeUpcomingLessons /><HomeUpcomingCourses /></>),
  prayer: () => <HomeCompactPrayer />,
  continue: () => <HomeContinueWidget />,
  "daily-progress": () => <HomeDailyProgress />,
  "week-streak": () => <HomeWeekStreak />,
  "sunnah-time": () => <HomeSunnahByTime />,
  explore: () => <HomeExplorePlatform />,
  "learning-seasons": () => <HomeLearningSeasonsWidget />,
  occasions: () => <HomeIslamicOccasions />,
  quiz: () => <HomeQuizCard />,
  "daily-benefits": () => <HomeDailyBenefits />,
  "upcoming-events": () => <HomeUpcomingEvents />,
  "prayer-ranks": () => <HomePrayerRanks />,
  "interesting-topics": () => <HomeInterestingTopics />,
  "mind-map": () => <HomeMindMapSection />,
};

const WIDGET_LABEL: Record<string, string> = Object.fromEntries(HOME_WIDGET_DEFS.map((w) => [w.id, w.label]));

const QUICK_ACTIONS = [
  { href: "/mushaf", label: "افتح المصحف", desc: "قراءة وتلاوة", Icon: BookOpen },
  { href: "/prayer-times", label: "الصلاة القادمة", desc: "المواقيت والتنبيه", Icon: Clock },
  { href: "/lessons", label: "تابع التعلم", desc: "دروس ودورات", Icon: GraduationCap },
  { href: "/quiz", label: "ابدأ اختبارًا", desc: "مراجعة سريعة", Icon: Target },
] as const;

export default function HomePage() {
  const { isAdmin, user } = useAuth();
  const dailyCtx = useDailyContext();

  const [lastVisited, setLastVisited] = useState<RecentPage | null>(null);
  useEffect(() => {
    const pages = getRecentPages(2);
    const last = pages.find((p) => p.href !== "/") ?? null;
    setLastVisited(last);
  }, []);
  const continueHref = lastVisited?.href ?? "/mushaf";

  const [homePrefs, setHomePrefs] = useState<HomepagePrefs>(() => getLocalHomepagePrefs());
  const [customizeOpen, setCustomizeOpen] = useState(false);
  useEffect(() => {
    if (!user?.id) return;
    fetchRemoteHomepagePrefs(user.id).then((remote) => {
      if (remote) { setHomePrefs(remote); saveLocalHomepagePrefs(remote); }
    });
  }, [user?.id]);

  const visibleWidgets = visibleWidgetOrder(homePrefs);
  const showLessonsWidget = visibleWidgets.includes("lessons");
  const restWidgetOrder = visibleWidgets.filter((id) => id !== "lessons" && id !== "prayer" && id !== "continue");

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
    <div className="home-igds" dir="rtl">
      {isMaintenanceMode() && (
        <p role="status" className="home-igds__maintain">{getSiteSettings().maintenanceMessage}</p>
      )}

      <section className="home-igds-hero igds-geo-wash" aria-label="الصفحة الرئيسية">
        <div className="home-igds-hero__inner">
          <h1 className="home-igds-hero__brand">المجلس العلمي</h1>
          <p className="home-igds-hero__lead">
            منصة علمية تجمع القرآن والحديث والفقه والصلاة والحفظ في تجربة واضحة ومنظمة.
          </p>
          <p className="home-igds-hero__greet">{dailyCtx.greeting}{dailyCtx.subGreeting ? ` — ${dailyCtx.subGreeting}` : ""}</p>
          <div className="home-igds-hero__meta">
            <span className="home-igds-hero__chip">{getHijriDateString()}</span>
            {heroCountdown ? (
              <Link href="/prayer-times" className="home-igds-hero__chip">
                {heroCountdown.name} بعد <span className="home-igds-panel__time">{heroCountdown.hms}</span>
              </Link>
            ) : null}
            {dailyCtx.event ? <span className="home-igds-hero__chip">{dailyCtx.event}</span> : null}
          </div>
          <div className="igds-cluster home-igds-hero__cta">
            <IgdsButton href={continueHref} variant="accent">متابعة</IgdsButton>
            <IgdsButton
              type="button"
              variant="secondary"
              onClick={() => window.dispatchEvent(new CustomEvent("global-search-open"))}
              aria-label="ابحث في المحتوى"
            >
              بحث
            </IgdsButton>
          </div>
          {isAdmin ? (
            <p className="home-igds-hero__greet">
              {toArabicDigits(contentCounts.scholars)} عالم · {toArabicDigits(contentCounts.quizQuestions)} سؤال · {toArabicDigits(contentCounts.fawaid)} فائدة · {toArabicDigits(contentCounts.books)} كتاب
            </p>
          ) : null}
        </div>
      </section>

      <div className="home-igds-body">
        <section aria-label="إجراءات سريعة">
          <IgdsSectionHeader title="ابدأ من هنا" />
          <div className="home-igds-actions">
            {QUICK_ACTIONS.map(({ href, label, desc, Icon }) => (
              <Link key={href} href={href} className="home-igds-action">
                <span className="home-igds-action__icon" aria-hidden="true"><Icon size={18} strokeWidth={1.8} /></span>
                <span className="home-igds-action__label">{label}</span>
                <span className="home-igds-action__desc">{desc}</span>
              </Link>
            ))}
          </div>
        </section>

        {heroCountdown ? (
          <section className="home-igds-panel home-igds-panel--prayer" aria-label="ملخص الصلاة">
            <div>
              <p className="home-igds-panel__kicker">الصلاة القادمة</p>
              <h2 className="home-igds-panel__title">{heroCountdown.name}</h2>
            </div>
            <div className="igds-cluster">
              <span className="home-igds-panel__time" dir="ltr">{heroCountdown.hms}</span>
              <IgdsButton href="/prayer-times" variant="secondary">المواقيت</IgdsButton>
            </div>
          </section>
        ) : null}

        <SafeHomeSection name="المتابعة">
          <HomeContinueWidget />
        </SafeHomeSection>

        <SafeHomeSection name="FridayBanner">
          <FridayBanner />
        </SafeHomeSection>

        {showLessonsWidget ? (
          <section aria-label="محتوى اليوم">
            <IgdsSectionHeader title="اليوم في المجلس" />
            <SafeHomeSection name={WIDGET_LABEL.lessons ?? "lessons"}>
              {WIDGET_RENDERERS.lessons?.()}
            </SafeHomeSection>
          </section>
        ) : null}

        <HomeRecentPagesBar />

        <section aria-label="أقسام علمية">
          <IgdsSectionHeader title="الأقسام العلمية" meta={<Link href="/sitemap">الكل</Link>} />
          <div className="home-igds-cats">
            {FEATURED.slice(0, 8).map((item) => (
              <Link key={item.href} href={item.href} className="home-igds-cat">
                <strong>{item.title}</strong>
                <span>{item.desc}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="home-igds-cta" aria-label="دعوة للمتابعة">
          <div className="home-igds-cta__copy">
            <strong>واصل طلب العلم</strong>
            <span>انتقل للدروس أو اختبر معرفتك في دقائق.</span>
          </div>
          <div className="igds-cluster">
            <IgdsButton href="/lessons" variant="primary">الدروس</IgdsButton>
            <IgdsButton href="/quiz" variant="secondary">اختبار</IgdsButton>
          </div>
        </section>

        <button type="button" className="home-igds-customize" onClick={() => setCustomizeOpen(true)}>
          <Wrench size={14} strokeWidth={2} aria-hidden="true" /> تخصيص الصفحة
        </button>

        <div className="home-igds-widgets">
          {restWidgetOrder.map((id) => (
            <SafeHomeSection key={id} name={WIDGET_LABEL[id] ?? id}>
              {WIDGET_RENDERERS[id]?.()}
            </SafeHomeSection>
          ))}
        </div>
      </div>

      <HomeCustomizeSheet
        open={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
        onChange={setHomePrefs}
      />
    </div>
  );
}
