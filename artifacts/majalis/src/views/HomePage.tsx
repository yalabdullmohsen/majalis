import { Suspense, useEffect, useState } from "react";
import { Link } from "wouter";
import { BookMarked, BookOpen, GraduationCap, Scale, Scroll, Target, Wrench } from "lucide-react";
import contentCounts from "@/data/content-counts.json";
import { applyPageSeo } from "@/lib/seo";
import { useDailyContext } from "@/lib/daily-context";
import { useAuth } from "@/components/AuthProvider";
import { getRecentPages, type RecentPage } from "@/lib/recent-pages";
import { SectionErrorBoundary } from "@/components/ErrorBoundary";
import { HomeDailyProgress } from "@/components/home/HomeDailyProgress";
import { HomeContinueWidget } from "@/components/home/HomeContinueWidget";
import { HomeLearningSeasonsWidget } from "@/components/home/HomeLearningSeasonsWidget";
import { FridayBanner } from "@/components/FridayBanner";
import { fetchPrayerTimes, computePrayerCountdown, type PrayerTimesPayload } from "@/lib/prayer-times";
import { getSiteSettings, isMaintenanceMode } from "@/lib/site-settings";
import { toArabicDigits } from "@/lib/utils";
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

const FEATURED_CATS = [
  { href: "/quran-knowledge", title: "القرآن وعلومه", desc: "فهرس وعلوم وأسباب نزول", cta: "استكشف", Icon: BookMarked },
  { href: "/hadith", title: "الحديث والسنة", desc: "أحاديث موثقة مع الشرح", cta: "تصفح", Icon: Scroll },
  { href: "/fiqh", title: "الفقه والأحكام", desc: "مسائل وأحكام مرتّبة", cta: "ادخل", Icon: Scale },
  { href: "/lessons", title: "الدروس العلمية", desc: "مسارات ودروس منظمة", cta: "تعلّم", Icon: GraduationCap },
  { href: "/memorization", title: "الحفظ والمراجعة", desc: "خطط واختبارات", cta: "ابدأ", Icon: Target },
  { href: "/mushaf", title: "المصحف الشريف", desc: "قريبًا — قيد التجهيز", cta: "قريبًا", Icon: BookOpen },
] as const;

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
  const restWidgetOrder = visibleWidgets.filter((id) => id !== "lessons" && id !== "prayer" && id !== "continue");

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
    <div className="m2030-home" dir="rtl">
      {isMaintenanceMode() && (
        <div role="status" className="home-maintenance-banner">
          {getSiteSettings().maintenanceMessage}
        </div>
      )}

      <section className="m2030-hero" aria-label="الصفحة الرئيسية">
        <div className="m2030-hero__pattern" aria-hidden="true" />
        <div className="m2030-hero__glow" aria-hidden="true" />
        <div className="m2030-hero__inner">
          <h1 className="m2030-hero__brand">المجلس العلمي</h1>
          <p className="m2030-hero__headline">منصة علم شرعي بمعايير حديثة</p>
          <p className="m2030-hero__lead">
            {dailyCtx.greeting}
            {dailyCtx.subGreeting ? ` — ${dailyCtx.subGreeting}` : ""}
          </p>
          <div className="m2030-hero__cta">
            <Link href={continueHref} className="m2030-btn m2030-btn--primary">
              ابدأ التصفح
            </Link>
            <button
              type="button"
              className="m2030-btn m2030-btn--ghost"
              onClick={() => window.dispatchEvent(new CustomEvent("global-search-open"))}
              aria-label="ابحث في المحتوى"
            >
              ابحث في المحتوى
            </button>
          </div>
        </div>
      </section>

      {heroCountdown && (
        <section className="m2030-band" aria-label="ملخص الصلاة">
          <Link
            href="/prayer-times"
            className="m2030-prayer"
            style={{ ["--p" as string]: String(heroCountdown.progress) }}
          >
            <div className="m2030-prayer__ring" aria-hidden="true">
              <div className="m2030-prayer__ring-inner">صلاة</div>
            </div>
            <div>
              <p className="m2030-prayer__name">{heroCountdown.name}</p>
              <p className="m2030-prayer__time" dir="ltr">بعد {heroCountdown.hms}</p>
              <p className="m2030-prayer__cta">عرض مواقيت اليوم ←</p>
            </div>
          </Link>
        </section>
      )}

      <section className="m2030-band m2030-band--sage" aria-label="إجراءات سريعة">
        <div className="m2030-band__head">
          <div>
            <h2 className="m2030-band__title">وصول سريع</h2>
            <p className="m2030-band__sub">مسارات يومية بلا ازدحام</p>
          </div>
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

      <section className="m2030-band" aria-label="أكمل من حيث توقفت">
        <div className="m2030-band__head">
          <h2 className="m2030-band__title">تابع التعلّم</h2>
        </div>
        <div className="m2030-panel">
          <SafeHomeSection name="continue">
            <HomeContinueWidget />
          </SafeHomeSection>
        </div>
      </section>

      {visibleWidgets.includes("lessons") && (
        <section className="m2030-band m2030-band--sage" aria-label="دروس اليوم">
          <div className="m2030-band__head">
            <div>
              <h2 className="m2030-band__title">اليوم في المنصة</h2>
              <p className="m2030-band__sub">دروس ودورات قادمة</p>
            </div>
            <Link href="/lessons" className="m2030-band__link">كل الدروس</Link>
          </div>
          <SafeHomeSection name="lessons">
            <HomeUpcomingLessons />
            <HomeUpcomingCourses />
          </SafeHomeSection>
        </section>
      )}

      <section className="m2030-band" aria-label="أقسام علمية">
        <div className="m2030-band__head">
          <div>
            <h2 className="m2030-band__title">بوابات العلم</h2>
            <p className="m2030-band__sub">محاور شرعية منظمة</p>
          </div>
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
