import { Suspense, useEffect, useState } from "react";
import { Link } from "wouter";
import { BookMarked, Scale, Scroll, Target, Wrench } from "lucide-react";
import contentCounts from "@/data/content-counts.json";
import { applyPageSeo } from "@/lib/seo";
import { useDailyContext } from "@/lib/daily-context";
import { useAuth } from "@/components/AuthProvider";
import { getRecentPages, type RecentPage } from "@/lib/recent-pages";
import { SectionErrorBoundary } from "@/components/ErrorBoundary";
import { HomeDailyProgress } from "@/components/home/HomeDailyProgress";
import { HomeContinueWidget } from "@/components/home/HomeContinueWidget";
import { HomeLearningSeasonsWidget } from "@/components/home/HomeLearningSeasonsWidget";
import { HomeNowCard } from "@/components/home/HomeNowCard";
import { HomeDiscoveryFeed } from "@/components/home/HomeDiscoveryFeed";
import { HomeStartHereSection } from "@/components/home/HomeStartHereSection";
import { FridayBanner } from "@/components/FridayBanner";
import { fetchPrayerTimes, computePrayerCountdown, type PrayerTimesPayload } from "@/lib/prayer-times";
import { getSiteSettings, isMaintenanceMode } from "@/lib/site-settings";
import { toArabicDigits } from "@/lib/utils";
import { PageHero } from "@/components/ui/PageHero";
import { HomeCustomizeSheet } from "@/components/home/HomeCustomizeSheet";
import { HomeRecentPagesBar } from "@/components/home/HomeRecentPagesBar";
import { HomeExplorePlatform } from "@/components/home/HomeExplorePlatform";
import { HomeUpcomingLessons } from "@/components/home/HomeUpcomingLessons";
import { HomeUpcomingCourses } from "@/components/home/HomeUpcomingCourses";
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

/** بوابات ثانوية — مختصرة؛ المصحف القادم ليس في الواجهة الأولى */
const SCIENCE_HUBS = [
  { href: "/quran-knowledge", title: "القرآن وعلومه", desc: "فهرس وعلوم وأسباب نزول", Icon: BookMarked },
  { href: "/hadith", title: "الحديث وعلومه", desc: "أحاديث موثقة مع الشرح", Icon: Scroll },
  { href: "/fiqh", title: "الفقه والأحكام", desc: "مسائل وأحكام مرتّبة", Icon: Scale },
  { href: "/memorization", title: "الحفظ والمراجعة", desc: "خطط واختبارات", Icon: Target },
] as const;

function openGlobalSearch() {
  window.dispatchEvent(new CustomEvent("global-search-open"));
}

export default function HomePage() {
  const { isAdmin, user } = useAuth();
  const dailyCtx = useDailyContext();

  const [lastVisited, setLastVisited] = useState<RecentPage | null>(null);
  useEffect(() => {
    const pages = getRecentPages(2);
    setLastVisited(pages.find((p) => p.href !== "/") ?? null);
  }, []);
  const continueHref = lastVisited?.href ?? "/lessons";

  const [homePrefs, setHomePrefs] = useState<HomepagePrefs>(() => getLocalHomepagePrefs());
  const [customizeOpen, setCustomizeOpen] = useState(false);
  useEffect(() => {
    if (!user?.id) return;
    fetchRemoteHomepagePrefs(user.id).then((remote) => {
      if (remote) { setHomePrefs(remote); saveLocalHomepagePrefs(remote); }
    });
  }, [user?.id]);

  const visibleWidgets = visibleWidgetOrder(homePrefs);
  // الأقسام المثبتة في الـDashboard لا تُكرَّر من التخصيص
  const pinnedIds = new Set(["lessons", "prayer", "continue", "daily-benefits", "quiz", "daily-progress", "learning-seasons"]);
  // daily-benefits/quiz مثبتان لأن اكتشاف اليوم يعرض محتوى مكافئ في الأعلى
  const restWidgetOrder = visibleWidgets.filter((id) => !pinnedIds.has(id));

  const [heroPrayers, setHeroPrayers] = useState<PrayerTimesPayload | null>(null);
  useEffect(() => {
    fetchPrayerTimes().then(setHeroPrayers).catch(() => {});
  }, []);
  const [heroCountdown, setHeroCountdown] = useState<{ name: string; hms: string; progress: number } | null>(null);
  useEffect(() => {
    if (!heroPrayers?.prayers?.length) return;
    const tick = () => {
      const cd = computePrayerCountdown(heroPrayers.prayers);
      const inGrace = cd.sinceSeconds != null;
      const name = inGrace && cd.graceNextSlot ? cd.graceNextSlot.name : cd.next?.name;
      const hms = inGrace && cd.graceNextHms ? cd.graceNextHms : cd.remainingHms;
      const remaining = Math.max(0, Math.round((cd.remainingMs ?? 0) / 1000));
      const progress = Math.max(8, Math.min(92, 100 - Math.round((remaining / (6 * 3600)) * 100)));
      if (name && hms) setHeroCountdown({ name, hms, progress });
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [heroPrayers]);

  useEffect(() => {
    applyPageSeo({
      path: "/",
      title: "المجلس العلمي، منصة العلوم الإسلامية",
      description: "منصة إسلامية شاملة للعلوم الشرعية: القرآن الكريم، الأذكار، الدروس العلمية، الأحكام الشرعية، والفقه المعاصر.",
      keywords: ["المجلس العلمي", "علوم إسلامية", "قرآن كريم", "أذكار", "أحكام شرعية", "دروس علمية"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "المجلس العلمي",
          url: "https://www.majlisilm.com",
          logo: "https://www.majlisilm.com/logo.png",
          description: "منصة إسلامية شاملة للعلوم الشرعية",
          inLanguage: "ar",
        },
      ],
    });
  }, []);

  return (
    <div className="m2030-home hp-dash" dir="rtl">
      {isMaintenanceMode() && (
        <div role="status" className="home-maintenance-banner">
          {getSiteSettings().maintenanceMessage}
        </div>
      )}

      <PageHero
        className="m2030-hero home-page-hero home-page-hero--compact"
        title="المجلس العلمي"
        headline="علم شرعي يومي، موثوق ومنظَّم"
        description={
          <>
            {dailyCtx.greeting}
            {dailyCtx.subGreeting ? ` — ${dailyCtx.subGreeting}` : ""}
          </>
        }
        actions={
          <>
            <button
              type="button"
              className="mj-btn m2030-btn m2030-btn--primary"
              onClick={openGlobalSearch}
              aria-label="ابحث في المحتوى"
            >
              ابحث في المحتوى
            </button>
            <Link href={continueHref} className="mj-btn mj-btn--ghost m2030-btn m2030-btn--ghost">
              {lastVisited ? "أكمل من حيث توقفت" : "ابدأ التعلّم"}
            </Link>
          </>
        }
      />

      <div className="m2030-band">
        <HomeNowCard
          prayerName={heroCountdown?.name}
          prayerHms={heroCountdown?.hms}
          prayerProgress={heroCountdown?.progress}
          continueHref={continueHref}
          continueLabel={lastVisited?.label ?? null}
        />
      </div>

      <section className="m2030-band m2030-band--sage" aria-label="إجراءات سريعة">
        <div className="m2030-band__head">
          <div>
            <h2 className="m2030-band__title">وصول سريع</h2>
            <p className="m2030-band__sub">ما تحتاجه يوميًا في لمسة واحدة</p>
          </div>
        </div>
        <div className="m2030-quick m2030-quick--7">
          {QUICK_LINKS.map(({ href, Icon: Ico, label, desc, action }) =>
            action === "search" ? (
              <button
                key={label}
                type="button"
                className="m2030-tile m2030-tile--btn"
                onClick={openGlobalSearch}
                aria-label={label}
              >
                <span className="m2030-tile__icon" aria-hidden="true">
                  <Ico size={14} strokeWidth={2} />
                </span>
                <span className="m2030-tile__label">{label}</span>
                <span className="m2030-tile__desc">{desc}</span>
              </button>
            ) : (
              <Link key={label + href} href={href} className="m2030-tile" aria-label={label}>
                <span className="m2030-tile__icon" aria-hidden="true">
                  <Ico size={14} strokeWidth={2} />
                </span>
                <span className="m2030-tile__label">{label}</span>
                <span className="m2030-tile__desc">{desc}</span>
              </Link>
            ),
          )}
        </div>
      </section>

      <section className="m2030-band" aria-label="أكمل من حيث توقفت">
        <div className="m2030-band__head">
          <h2 className="m2030-band__title">أكمل من حيث توقفت</h2>
          <Link href="/my-learning" className="m2030-band__link">نشاطي</Link>
        </div>
        <SafeHomeSection name="continue">
          <HomeContinueWidget />
        </SafeHomeSection>
      </section>

      <section className="m2030-band m2030-band--sage" aria-label="مقترح لك اليوم">
        <div className="m2030-band__head">
          <div>
            <h2 className="m2030-band__title">مقترح لك اليوم</h2>
            <p className="m2030-band__sub">اكتشاف يومي موثّق — بلا تعليقات عامة</p>
          </div>
        </div>
        <SafeHomeSection name="discovery-feed">
          <HomeDiscoveryFeed />
        </SafeHomeSection>
      </section>

      {visibleWidgets.includes("lessons") && (
        <section className="m2030-band" aria-label="دروس قريبة">
          <div className="m2030-band__head">
            <div>
              <h2 className="m2030-band__title">دروس قريبة</h2>
              <p className="m2030-band__sub">ما يُقدَّم قريبًا في المنصة</p>
            </div>
            <Link href="/lessons" className="m2030-band__link">كل الدروس</Link>
          </div>
          <SafeHomeSection name="lessons">
            <HomeUpcomingLessons />
            <HomeUpcomingCourses />
          </SafeHomeSection>
        </section>
      )}

      <section className="m2030-band m2030-band--sage" aria-label="رحلة طالب العلم">
        <div className="m2030-band__head">
          <div>
            <h2 className="m2030-band__title">رحلة طالب العلم</h2>
            <p className="m2030-band__sub">مبتدئ · متوسط · متقدم</p>
          </div>
          <Link href="/learning/paths" className="m2030-band__link">المسارات</Link>
        </div>
        <SafeHomeSection name="start-here">
          <HomeStartHereSection embedded />
        </SafeHomeSection>
        {visibleWidgets.includes("learning-seasons") && (
          <SafeHomeSection name="learning-seasons">
            <HomeLearningSeasonsWidget />
          </SafeHomeSection>
        )}
      </section>

      <section className="m2030-band" aria-label="أقسام علمية">
        <div className="m2030-band__head">
          <div>
            <h2 className="m2030-band__title">محاور العلم</h2>
            <p className="m2030-band__sub">أبواب منظمة بلا ازدحام</p>
          </div>
          <Link href="/sitemap" className="m2030-band__link">كل الأقسام</Link>
        </div>
        <div className="m2030-featured m2030-featured--4">
          {SCIENCE_HUBS.map(({ href, title, desc, Icon }) => (
            <Link key={href} href={href} className="m2030-feature">
              <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
              <h3 className="m2030-feature__title">{title}</h3>
              <p className="m2030-feature__desc">{desc}</p>
              <span className="m2030-feature__cta">افتح</span>
            </Link>
          ))}
        </div>
      </section>

      {visibleWidgets.includes("daily-progress") && (
        <section className="m2030-band m2030-band--sage" aria-label="تقدمك اليوم">
          <SafeHomeSection name="daily-progress">
            <HomeDailyProgress />
          </SafeHomeSection>
        </section>
      )}

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

      {restWidgetOrder.length > 0 && (
        <main className="home-container home-main">
          {restWidgetOrder.map((id) => (
            <SafeHomeSection key={id} name={WIDGET_LABEL[id] ?? id}>
              {WIDGET_RENDERERS[id]?.()}
            </SafeHomeSection>
          ))}
        </main>
      )}

      {isAdmin && (
        <p className="m2030-band__sub" style={{ textAlign: "center", paddingBottom: "1rem" }}>
          محتوى مرجعي: {toArabicDigits(contentCounts.scholars)} عالم · {toArabicDigits(contentCounts.quizQuestions)} سؤال
        </p>
      )}

      <HomeCustomizeSheet
        open={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
        onChange={setHomePrefs}
      />
    </div>
  );
}
