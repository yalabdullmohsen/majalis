import { Suspense, useEffect, useState } from "react";
import { Link } from "wouter";
import { BookMarked, BookOpen, GraduationCap, Scale, Scroll, Target, Wrench } from "lucide-react";
import contentCounts from "@/data/content-counts.json";
import { applyPageSeo } from "@/lib/seo";
import { defaultSiteJsonLd } from "@/lib/seo-structured-data";
import { useDailyContext } from "@/lib/daily-context";
import { useAuth } from "@/components/AuthProvider";
import { getRecentPages, type RecentPage } from "@/lib/recent-pages";
import { SectionErrorBoundary } from "@/components/ErrorBoundary";
import { HomeDailyProgress } from "@/components/home/HomeDailyProgress";
import { HomeContinueWidget } from "@/components/home/HomeContinueWidget";
import { HomeLocalResumeCard } from "@/components/home/HomeLocalResumeCard";
import { HomeUniversalSearch } from "@/components/home/HomeUniversalSearch";
import { HomeLearningSeasonsWidget } from "@/components/home/HomeLearningSeasonsWidget";
import { FridayBanner } from "@/components/FridayBanner";
import { getSiteSettings, isMaintenanceMode } from "@/lib/site-settings";
import { toArabicDigits } from "@/lib/utils";
import { PageHero } from "@/components/ui/PageHero";
import "@/styles/components/home-brand-title.css";
import { HomeCustomizeSheet } from "@/components/home/HomeCustomizeSheet";
import { HomeRecentPagesBar } from "@/components/home/HomeRecentPagesBar";
import { HomeExplorePlatform } from "@/components/home/HomeExplorePlatform";
import { HomeContentHub } from "@/components/home/HomeContentHub";
import { HomeUpcomingLessons } from "@/components/home/HomeUpcomingLessons";
import { HomeUpcomingCourses } from "@/components/home/HomeUpcomingCourses";
import { HomeStartHereSection } from "@/components/home/HomeStartHereSection";
import { HomeDailyWirdBand } from "@/components/home/HomeDailyWirdBand";
import { HomeMostReadBand } from "@/components/home/HomeMostReadBand";
import { HomeLiveStatsStrip } from "@/components/home/HomeLiveStatsStrip";
import { lazyWithRetry } from "@/lib/lazy-with-retry";
import { QUICK_LINKS } from "@/lib/home-feature-catalog";
import {
  HOME_WIDGET_DEFS,
  getLocalHomepagePrefs,
  saveLocalHomepagePrefs,
  fetchRemoteHomepagePrefs,
  visibleWidgetOrder,
  type HomepagePrefs,
} from "@/lib/homepage-layout";
import "@/styles/m2030/home.css";
import "@/styles/pages/home-legacy.css";

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

function SafeHomeSection({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <SectionErrorBoundary name={name}>
      <Suspense fallback={<div className="skeleton-base hp-skel" aria-label={`تحميل ${name}`} />}>
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

const FEATURED_CATS = [
  { href: "/quran-knowledge", title: "القرآن وعلومه", desc: "فهرس وعلوم وأسباب نزول", cta: "استكشف", Icon: BookMarked },
  { href: "/hadith", title: "الحديث وعلومه", desc: "مداخل وأحاديث مع بيان المصدر قدر الإمكان", cta: "تصفح", Icon: Scroll },
  { href: "/fiqh", title: "الفقه والأحكام", desc: "مسائل وأحكام مرتّبة", cta: "ادخل", Icon: Scale },
  { href: "/lessons", title: "الدروس العلمية", desc: "مسارات ودروس منظمة", cta: "افتح الدروس", Icon: GraduationCap },
  { href: "/memorization", title: "الحفظ والمراجعة", desc: "خطط واختبارات", cta: "ابدأ", Icon: Target },
  { href: "/adhkar", title: "الأذكار", desc: "أذكار الصباح والمساء", cta: "افتح الأذكار", Icon: BookOpen },
] as const;

export default function HomePage() {
  const { isAdmin, user } = useAuth();
  const dailyCtx = useDailyContext();

  const [lastVisited, setLastVisited] = useState<RecentPage | null>(null);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  useEffect(() => {
    const pages = getRecentPages(2);
    setLastVisited(pages.find((p) => p.href !== "/") ?? null);
    try {
      const key = "majlis-home-welcomed-v1";
      if (!localStorage.getItem(key)) {
        setIsFirstVisit(true);
        localStorage.setItem(key, "1");
      }
    } catch {
      setIsFirstVisit(true);
    }
  }, []);
  const continueHref = lastVisited?.href ?? (isFirstVisit ? "/start-here" : "/lessons");

  const [homePrefs, setHomePrefs] = useState<HomepagePrefs>(() => getLocalHomepagePrefs());
  const [customizeOpen, setCustomizeOpen] = useState(false);
  useEffect(() => {
    if (!user?.id) return;
    fetchRemoteHomepagePrefs(user.id).then((remote) => {
      if (remote) { setHomePrefs(remote); saveLocalHomepagePrefs(remote); }
    });
  }, [user?.id]);

  const visibleWidgets = visibleWidgetOrder(homePrefs);
  // lessons + continue لهما أقسام مخصّصة أعلاه؛ الباقي (بما فيها الصلاة) في الأسفل
  const restWidgetOrder = visibleWidgets.filter((id) => id !== "lessons" && id !== "continue");

  useEffect(() => {
    applyPageSeo({
      path: "/",
      title: "المجلس العلمي، منصة العلوم الإسلامية",
      description: "منصة إسلامية شاملة للعلوم الشرعية: القرآن الكريم، الأذكار، الدروس العلمية، الأحكام الشرعية، والفقه المعاصر.",
      keywords: ["المجلس العلمي", "علوم إسلامية", "قرآن كريم", "أذكار", "أحكام شرعية", "دروس علمية"],
      jsonLd: defaultSiteJsonLd(),
    });
  }, []);

  return (
    <div className="m2030-home" dir="rtl">
      {isMaintenanceMode() && (
        <div role="status" className="home-maintenance-banner">
          {getSiteSettings().maintenanceMessage}
        </div>
      )}

      <PageHero
        className="m2030-hero home-page-hero"
        title={dailyCtx.greeting}
        actions={
          <Link
            href={isFirstVisit ? "/start-here" : continueHref}
            className="mj-btn m2030-btn m2030-btn--primary"
          >
            {isFirstVisit ? "ابدأ من هنا" : "تابع التصفح"}
          </Link>
        }
      />

      <SectionErrorBoundary name="HomeUniversalSearch">
        <HomeUniversalSearch />
      </SectionErrorBoundary>

      <HomeLiveStatsStrip />

      <section className="m2030-band m2030-band--sage" aria-label="مدخل المبتدئ">
        <HomeStartHereSection />
      </section>

      <HomeDailyWirdBand />

      {visibleWidgets.includes("lessons") && (
        <section className="m2030-band m2030-band--sage" aria-label="دروس اليوم">
          <div className="m2030-band__head">
            <h2 className="m2030-band__title">آخر الدروس</h2>
            <Link href="/lessons" className="m2030-band__link">كل الدروس</Link>
          </div>
          <SafeHomeSection name="lessons">
            <HomeUpcomingLessons />
            <HomeUpcomingCourses />
          </SafeHomeSection>
        </section>
      )}

      <section className="m2030-band" aria-label="متابعة القراءة والاستماع">
        <div className="m2030-band__head">
          <h2 className="m2030-band__title">أكمل من حيث توقفت</h2>
        </div>
        <div className="m2030-panel mj-card mj-card--raised">
          <SafeHomeSection name="local-resume">
            <HomeLocalResumeCard />
          </SafeHomeSection>
          <SafeHomeSection name="continue">
            <HomeContinueWidget />
          </SafeHomeSection>
        </div>
      </section>

      <HomeMostReadBand />

      <section className="m2030-band m2030-band--sage" aria-label="إجراءات سريعة">
        <div className="m2030-band__head">
          <h2 className="m2030-band__title">وصول سريع</h2>
        </div>
        <div className="m2030-quick">
          {QUICK_LINKS.map(({ href, Icon: Ico, label, desc }) => (
            <Link key={label + href} href={href} className="m2030-tile" aria-label={label}>
              <span className="m2030-tile__icon" aria-hidden="true">
                <Ico size={14} strokeWidth={2} />
              </span>
              <span className="m2030-tile__label">{label}</span>
              <span className="m2030-tile__desc">{desc}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="m2030-band" aria-label="محتوى أساسي">
        <HomeContentHub />
      </section>

      <section className="m2030-band" aria-label="أقسام علمية">
        <div className="m2030-band__head">
          <h2 className="m2030-band__title">بوابات العلم</h2>
        </div>
        <div className="m2030-featured">
          {FEATURED_CATS.map(({ href, title, desc, cta, Icon }) => (
            <Link key={href} href={href} className="m2030-feature">
              <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
              <h3 className="m2030-feature__title">{title}</h3>
              <p className="m2030-feature__desc">{desc}</p>
              <span className="m2030-feature__cta">{cta}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="m2030-band">
        <SafeHomeSection name="FridayBanner">
          <FridayBanner />
        </SafeHomeSection>
      </div>

      <HomeRecentPagesBar />

      <div className="m2030-band" style={{ textAlign: "center" }}>
        <button type="button" className="m2030-customize" onClick={() => setCustomizeOpen(true)}>
          <Wrench size={13} strokeWidth={2} aria-hidden="true" /> تخصيص الصفحة
        </button>
      </div>

      <main className="home-container home-main">
        {restWidgetOrder.map((id) => (
          <SafeHomeSection key={id} name={WIDGET_LABEL[id] ?? id}>
            {WIDGET_RENDERERS[id]?.()}
          </SafeHomeSection>
        ))}

        {isAdmin && (
          <p className="m2030-band__sub" style={{ textAlign: "center" }}>
            محتوى مرجعي: {toArabicDigits(contentCounts.scholars)} عالم · {toArabicDigits(contentCounts.quizQuestions)} سؤال
          </p>
        )}
      </main>

      <HomeCustomizeSheet
        open={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
        onChange={setHomePrefs}
      />
    </div>
  );
}
