import { Suspense, useEffect, useLayoutEffect, useRef, useState, type ComponentType } from "react";
import { Link, Route, Switch, Router as WouterRouter, useLocation } from "wouter";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { FontPreferenceProvider } from "@/components/FontPreferenceProvider";
import { ThemePreferenceProvider } from "@/components/ThemePreferenceProvider";
import { UserPreferencesProvider } from "@/components/UserPreferencesProvider";
import { LanguageProvider, useLanguage } from "@/components/LanguageProvider";
import { PrayerCountdownProvider } from "@/components/prayer/PrayerCountdownProvider";
import { NavigationBinder } from "@/components/NavigationBinder";
import { NativeBackButtonListener } from "@/components/NativeBackButtonListener";
import { VisualViewportKeyboardBridge } from "@/hooks/useVisualViewportOffset";
import { ensureChromeMeta } from "@/lib/ensure-chrome-meta";
import { PageChromeSync } from "@/components/PageChromeSync";
import { useAutoHideBottomNav } from "@/hooks/useAutoHideBottomNav";
import { ErrorBoundary, SectionErrorBoundary } from "@/components/ErrorBoundary";
import { usePageSeo } from "@/lib/seo";
import { lazyWithRetry } from "@/lib/lazy-with-retry";
import { LazyRouteFallback } from "@/components/LazyRouteFallback";
import { useSharedPrayerCountdown } from "@/components/prayer/PrayerCountdownProvider";
import { PRAYER_ALERT_PREFS_CHANGED_EVENT } from "@/lib/prayer-alert-preferences";
import { recordRecentPage } from "@/lib/recent-pages";
import {
  captureScrollSnapshot,
  restoreScrollSnapshot,
  scrollDocumentToTop,
  type ScrollSnapshot,
} from "@/lib/scroll-document-top";
import { trackContinueReading } from "@/lib/continue-reading";
import { setPrayerTimesCache } from "@/lib/lesson-time";
import { recordNavigationVisit } from "@/lib/navigation-back";
import { isAuthStandalonePath, isImmersiveChromePath, isPrayerTimesPath } from "@/lib/immersive-chrome";
import { isNative, isNativeApp } from "@/lib/capacitor-utils";
import { isMiniPlayerVisible, subscribeMiniPlayer } from "@/lib/quran-mini-player";
import { HOME_START_HERE_COPY, HOME_START_HERE_STEPS } from "@/components/home/home-start-here-data";
/** شريط/كروم ثقيل (lucide + nav-map) — كسول حتى لا يدخل مسار أول زيارة / LCP */
const SafeAreaDebugOverlay = lazyWithRetry(
  () =>
    import("@/components/SafeAreaDebugOverlay").then((m) => ({
      default: m.SafeAreaDebugOverlay,
    })),
  "SafeAreaDebugOverlay",
);
const NavBar = lazyWithRetry(() => import("@/components/NavBar"), "NavBar");
const BottomNavBar = lazyWithRetry(
  () => import("@/components/BottomNavBar").then((m) => ({ default: m.BottomNavBar })),
  "BottomNavBar",
);
const TopSectionBar = lazyWithRetry(
  () => import("@/components/TopSectionBar").then((m) => ({ default: m.TopSectionBar })),
  "TopSectionBar",
);
const ScrollToTop = lazyWithRetry(
  () => import("@/components/ScrollToTop").then((m) => ({ default: m.ScrollToTop })),
  "ScrollToTop",
);
const GlobalBackButton = lazyWithRetry(
  () =>
    import("@/components/FloatingBackButton").then((m) => ({
      default: m.FloatingBackButton,
    })),
  "FloatingBackButton",
);
const ComingSoonDialog = lazyWithRetry(
  () => import("@/components/ComingSoonDialog").then((m) => ({ default: m.ComingSoonDialog })),
  "ComingSoonDialog",
);
const OfflineBanner = lazyWithRetry(
  () => import("@/components/OfflineBanner").then((m) => ({ default: m.OfflineBanner })),
  "OfflineBanner",
);

const lazy = lazyWithRetry;

/**
 * تحميل كسول للمساعد الذكي العائم — مكوّن ثانوي (تفاعلي عند الطلب فقط)
 * كان يُستورَد بشكل عاجل في كل صفحة رغم أن أغلب الزوّار لا يفتحونه أبداً،
 * فيُضخِّم الحزمة الرئيسية بلا داعٍ. لا يظهر شيء مختلف بصريًا — الأيقونة
 * العائمة نفسها تظهر بعد جزء من الثانية فقط، لا تحجب أي محتوى صفحة.
 */
const AssistantFloatingWidget = lazyWithRetry(
  () => import("@/components/assistant/AssistantFloatingWidget").then((m) => ({ default: m.AssistantFloatingWidget })),
  "AssistantFloatingWidget",
);
const AdminSiteEditBar = lazyWithRetry(
  () => import("@/components/AdminSiteEditBar").then((m) => ({ default: m.AdminSiteEditBar })),
  "AdminSiteEditBar",
);
const AdhanActiveOverlay = lazyWithRetry(
  () => import("@/components/adhan/AdhanActiveOverlay").then((m) => ({ default: m.AdhanActiveOverlay })),
  "AdhanActiveOverlay",
);
const PrayerCountdownBanner = lazyWithRetry(
  () => import("@/components/prayer/PrayerCountdownBanner").then((m) => ({ default: m.PrayerCountdownBanner })),
  "PrayerCountdownBanner",
);
const AdhanNotificationBar = lazyWithRetry(
  () => import("@/components/adhan/AdhanNotificationBar").then((m) => ({ default: m.AdhanNotificationBar })),
  "AdhanNotificationBar",
);
const PrayerRespectBanner = lazyWithRetry(
  () => import("@/components/adhan/PrayerRespectBanner").then((m) => ({ default: m.PrayerRespectBanner })),
  "PrayerRespectBanner",
);

const GlobalSearchModal = lazyWithRetry(
  () => import("@/components/GlobalSearchModal").then((m) => ({ default: m.GlobalSearchModal })),
  "GlobalSearchModal",
);
const QuranMiniPlayerBar = lazyWithRetry(
  () => import("@/components/quran/QuranMiniPlayerBar").then((m) => ({ default: m.QuranMiniPlayerBar })),
  "QuranMiniPlayerBar",
);
/** Toasts / resume prompts — not needed for first paint; keep entry lean. */
const CrossDeviceResumeToast = lazyWithRetry(
  () => import("@/components/CrossDeviceResumeToast").then((m) => ({ default: m.CrossDeviceResumeToast })),
  "CrossDeviceResumeToast",
);
/** كروم ثانوي — خارج حزمة الإقلاع (شيتات / حركة / بنرات) */
const UpdateAvailableBanner = lazyWithRetry(
  () =>
    import("@/components/UpdateAvailableBanner").then((m) => ({ default: m.UpdateAvailableBanner })),
  "UpdateAvailableBanner",
);
const PwaInstallBanner = lazyWithRetry(
  () => import("@/components/PwaInstallBanner").then((m) => ({ default: m.PwaInstallBanner })),
  "PwaInstallBanner",
);
const FocusArrival = lazyWithRetry(
  () => import("@/components/FocusArrival").then((m) => ({ default: m.FocusArrival })),
  "FocusArrival",
);
const NavProgressBar = lazyWithRetry(
  () => import("@/components/NavProgressBar").then((m) => ({ default: m.NavProgressBar })),
  "NavProgressBar",
);
const EdgeSwipeBack = lazyWithRetry(
  () =>
    import("@/components/motion/EdgeSwipeBack").then((m) => ({ default: m.EdgeSwipeBack })),
  "EdgeSwipeBack",
);
const RouteEnterMotion = lazyWithRetry(
  () =>
    import("@/components/motion/RouteEnterMotion").then((m) => ({ default: m.RouteEnterMotion })),
  "RouteEnterMotion",
);
const DeferredAchievementBoot = lazyWithRetry(
  () =>
    import("@/components/DeferredAchievementBoot").then((m) => ({
      default: m.DeferredAchievementBoot,
    })),
  "DeferredAchievementBoot",
);


const SiteFooter = lazy(() => import("@/components/SiteFooter"));
const HomePage = lazy(() => import("@/pages/account/HomePage"));
const CookieConsentBanner = lazy(() =>
  import("@/components/CookieConsentBanner").then((m) => ({ default: m.CookieConsentBanner })),
);

function SeoManager() {
  const [location] = useLocation();
  usePageSeo(location);
  useEffect(() => {
    // Part 16: abort previous route-scoped work on fast navigation
    void import("@/lib/route-abort").then(({ beginAbortScope, abortScope }) => {
      abortScope("route:prev");
      beginAbortScope(`route:${location}`);
    });
    void import("@/lib/diagnostics").then(({ logDiagnostic }) => {
      logDiagnostic("custom", "route-change", { location });
    });
    const timer = window.setTimeout(() => {
      const rawTitle = document.title.split(" | ")[0]?.trim();
      recordRecentPage(location, rawTitle);
      trackContinueReading({ route: location, title: rawTitle || location });
    }, 400);
    return () => {
      window.clearTimeout(timer);
      void import("@/lib/route-abort").then(({ abortScope }) => {
        abortScope(`route:${location}`);
      });
    };
  }, [location]);
  return null;
}

/** مواضع تمرير في الذاكرة — مفتاحها المسار؛ تُستعاد عند الرجوع فقط. */
const scrollPosByPath = new Map<string, ScrollSnapshot>();

/**
 * مسار جديد (push/link) → أعلى الصفحة فورًا قبل الرسم (useLayoutEffect)
 * على النافذة وحاويات التمرير الداخلية (.app-shell / main).
 * رجوع (popstate) فقط → استعادة الموضع المحفوظ لذلك المسار.
 */
function ScrollResetOnNav() {
  const [location] = useLocation();
  const isPopRef = useRef(false);
  const lastLocationRef = useRef(location);

  useEffect(() => {
    if (typeof history !== "undefined" && "scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    const onPopState = () => { isPopRef.current = true; };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useLayoutEffect(() => {
    const leavingLocation = lastLocationRef.current;
    const isPop = isPopRef.current;
    recordNavigationVisit(location, isPop ? "pop" : "push");
    if (leavingLocation === location) {
      isPopRef.current = false;
      return;
    }
    scrollPosByPath.set(leavingLocation, captureScrollSnapshot());
    lastLocationRef.current = location;
    isPopRef.current = false;

    if (isPop) {
      restoreScrollSnapshot(scrollPosByPath.get(location));
      return;
    }
    scrollDocumentToTop();
  }, [location]);

  return null;
}

function IslamicReminderBootstrap() {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    void import("@/lib/local-notifications").then(({ loadNotifPrefs, scheduleIslamicReminder }) => {
      if (cancelled) return;
      const prefs = loadNotifPrefs();
      if (prefs.enabled) scheduleIslamicReminder();
      // تأجير تلقائي: نُرسل مرة بعد 30 دقيقة من فتح التطبيق
      timer = setTimeout(() => {
        const p = loadNotifPrefs();
        if (p.enabled) scheduleIslamicReminder();
      }, 30 * 60 * 1000);
    });
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);
  return null;
}

function AdhanSchedulerBootstrap() {
  const { data } = useSharedPrayerCountdown();
  useEffect(() => {
    if (!data) return;
    // مزامنة كاش أوقات الصلاة في lesson-time بالبيانات الحية الفعلية من كل
    // جلب — بدل الاعتماد على المتوسطات السنوية الثابتة. المفاتيح بالعربية
    // (name) لا الإنجليزية (key) لتطابق PRAYER_TIME_MINUTES في lesson-time.ts.
    const liveMinutes: Record<string, number> = {};
    for (const slot of data.prayers) {
      if (slot.minutes != null) liveMinutes[slot.name] = slot.minutes;
    }
    setPrayerTimesCache(liveMinutes);

    const run = () => {
      void import("@/lib/adhan-scheduler").then((m) =>
        m.startAdhanScheduler(data).catch(() => {}),
      );
    };
    // بعد أول إطار — لا فحص أذان ثقيل على مسار الإقلاع
    const startTimer = window.setTimeout(run, 3500);

    const onPrefs = () => run();
    window.addEventListener("majalis:adhan-prefs-changed", onPrefs);
    const onBootReschedule = () => run();
    window.addEventListener("majalis:boot-adhan-reschedule", onBootReschedule);
    return () => {
      window.clearTimeout(startTimer);
      window.removeEventListener("majalis:adhan-prefs-changed", onPrefs);
      window.removeEventListener("majalis:boot-adhan-reschedule", onBootReschedule);
    };
  }, [data]);

  useEffect(() => {
    return () => {
      void import("@/lib/adhan-scheduler").then((m) => m.stopAdhanScheduler());
    };
  }, []);

  return null;
}

/**
 * يُشغِّل منسّق تنبيه الصلاة (شريط + إشعار محلي + Live Activity) عند تحميل
 * أوقات الصلاة، ويُعيد فحص النافذة الحالية فوراً عند عودة التطبيق للواجهة
 * (مثلاً بعد إغلاقه في الخلفية لدقائق ثم فتحه من جديد داخل نافذة الـ١٥ دقيقة).
 */
function PrayerAlertSchedulerBootstrap() {
  const { data } = useSharedPrayerCountdown();

  useEffect(() => {
    if (!data) return;
    let cancelled = false;
    // بعد استقرار أول إطار — لا جدولة ثقيلة على مسار الإقلاع
    const t = window.setTimeout(() => {
      void import("@/lib/prayer-alert-scheduler").then((mod) => {
        if (cancelled) return;
        mod.startPrayerAlertScheduler(data).catch(() => {});
      });
    }, 3500);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [data]);

  useEffect(() => {
    return () => {
      void import("@/lib/prayer-alert-scheduler").then((mod) => {
        mod.stopPrayerAlertScheduler();
      });
    };
  }, []);

  useEffect(() => {
    const bootAt = Date.now();
    const loadScheduler = () => import("@/lib/prayer-alert-scheduler");
    const rescheduleOnForeground = () => {
      // خلال نافذة الإقلاع: لا force-reschedule يعلّق الواجهة
      if (Date.now() - bootAt < 8_000) return;
      void loadScheduler().then((mod) => {
        void mod.recheckPrayerAlertWindow(data, { force: true });
      });
      void import("@/lib/quran-daily-reminder").then(({ ensureQuranDailyReminderScheduled }) => {
        void ensureQuranDailyReminderScheduled();
      });
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") rescheduleOnForeground();
    };
    const onPrefsChanged = () => {
      void loadScheduler().then((mod) => {
        mod.invalidatePrayerNativeSchedule();
        void mod.recheckPrayerAlertWindow(data, { force: true });
      });
    };
    let lastTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    let lastDateKey = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kuwait",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const onClockTick = () => {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const dateKey = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kuwait",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());
      if (tz !== lastTz || dateKey !== lastDateKey) {
        lastTz = tz;
        lastDateKey = dateKey;
        void loadScheduler().then((mod) => {
          mod.invalidatePrayerNativeSchedule();
          void mod.recheckPrayerAlertWindow(data, { force: true });
        });
      }
    };
    const clockId = window.setInterval(onClockTick, 60_000);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener(PRAYER_ALERT_PREFS_CHANGED_EVENT, onPrefsChanged);
    window.addEventListener("majalis:adhan-prefs-changed", onPrefsChanged);

    // iOS WKWebView: appStateChange أوثق من visibilitychange في بعض مسارات الخلفية→المقدمة.
    let removeAppState: (() => void) | undefined;
    void import("@/lib/capacitor-utils").then(({ isNative }) => {
      if (!isNative) return;
      void import("@capacitor/app").then(({ App: CapApp }) => {
        const sub = CapApp.addListener("appStateChange", ({ isActive }) => {
          if (isActive) {
            // إلغاء ذكي: فتح التطبيق يلغي بقية مقاطع الأذان ويستأنف المُشغّل الداخلي
            void import("@/lib/adhan-smart-cancel").then(({ cancelAdhanNotificationChain, getAdhanResumeContext }) =>
              cancelAdhanNotificationChain({ resumeInternal: Boolean(getAdhanResumeContext()) }),
            );
            rescheduleOnForeground();
          }
        });
        void Promise.resolve(sub).then((handle) => {
          removeAppState = () => {
            void handle.remove();
          };
        });
      }).catch(() => {});
    });

    return () => {
      window.clearInterval(clockId);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener(PRAYER_ALERT_PREFS_CHANGED_EVENT, onPrefsChanged);
      window.removeEventListener("majalis:adhan-prefs-changed", onPrefsChanged);
      removeAppState?.();
    };
  }, [data]);

  return null;
}

/** قنوات + مستمعو النقر + Remote Push (Capacitor) عند الغلاف الأصلي. */
function NativeNotificationsBootstrap() {
  useEffect(() => {
    void import("@/lib/notifications/native-bootstrap").then(({ bootstrapNativeNotifications }) => {
      void bootstrapNativeNotifications();
    });
  }, []);
  return null;
}

function HomeInitialShell() {
  return (
    <div className="m2030-home mj-home-lcp-ph" dir="rtl">
      <header className="page-hero-mj m2030-hero home-page-hero" dir="rtl">
        <div className="page-hero-mj__content">
          <p className="page-hero-mj__eyebrow mj-home-lcp-ph__hero-eyebrow">&nbsp;</p>
          <h1 className="page-hero-mj__title">سُنّة</h1>
          <div className="page-hero-mj__actions">
            <span className="mj-btn m2030-btn m2030-btn--primary mj-home-lcp-ph__hero-cta">تابع التصفح</span>
          </div>
        </div>
      </header>

      <div className="hus mj-home-lcp-ph__search" role="search" aria-label="بحث موحّد">
        <div className="hus-field">
          <span className="hus-input mj-home-lcp-ph__search-ph" aria-hidden="true">
            &nbsp;
          </span>
        </div>
      </div>

      <section className="m2030-band m2030-band--sage" aria-label="مدخل المبتدئ">
        <section aria-label="ابدأ من هنا" className="home-start-here mj-home-lcp-ph__start-here">
          <div className="hsh-header">
            <span className="hsh-eyebrow">{HOME_START_HERE_COPY.eyebrow}</span>
            <h2 className="hsh-title">{HOME_START_HERE_COPY.title}</h2>
            <p className="hsh-lead">{HOME_START_HERE_COPY.lead}</p>
            <div className="hsh-actions">
              <Link href="/lessons" className="hsh-actions__primary" tabIndex={-1}>
                {HOME_START_HERE_COPY.primaryCta}
              </Link>
              <Link href="/adab-talab-ilm" className="hsh-actions__secondary" tabIndex={-1}>
                {HOME_START_HERE_COPY.secondaryCta}
              </Link>
            </div>
          </div>
          <ol className="hsh-steps">
            {HOME_START_HERE_STEPS.map((step) => (
              <li key={step.num} className="hsh-step">
                <span className="hsh-step__num" aria-hidden="true">
                  {step.num}
                </span>
                <div className="hsh-step__body">
                  <strong className="hsh-step__title">{step.title}</strong>
                  <p className="hsh-step__desc">{step.desc}</p>
                  <Link href={step.href} className="hsh-step__cta" tabIndex={-1}>
                    {step.cta} ←
                  </Link>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </section>

      <section
        className="m2030-band m2030-band--sage home-daily-wird daily-wird-card mj-home-lcp-ph__daily-band"
        aria-label="ورد اليوم"
        aria-busy="true"
        data-testid="daily-wird-card"
      >
        <div className="m2030-band__head">
          <h2 className="m2030-band__title">ورد اليوم</h2>
        </div>
      </section>
    </div>
  );
}

function HomeLazyRoute() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<HomeInitialShell />}>
        <HomePage />
      </Suspense>
    </ErrorBoundary>
  );
}

const AppRoutes = lazy(() => import("./AppRoutes"));

function Router() {
  return (
    <Switch>
      <Route path="/">
        <HomeLazyRoute />
      </Route>
      <Route>
        <Suspense fallback={<LazyRouteFallback />}>
          <AppRoutes />
        </Suspense>
      </Route>
    </Switch>
  );
}

function GlobalAppShortcuts({ onToggleSearch }: { onToggleSearch: () => void }) {
  const [, navigate] = useLocation();

  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const typing =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target?.isContentEditable;

      // Ctrl/Cmd+K — البحث الشامل
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onToggleSearch();
        return;
      }

      // Ctrl/Cmd+Shift+R — بطاقات المراجعة (لا يتعارض مع تحديث الصفحة Ctrl+R)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "r") {
        if (typing) return;
        e.preventDefault();
        navigate("/my-learning#flashcards");
      }
    };
    window.addEventListener("keydown", keyHandler);
    return () => window.removeEventListener("keydown", keyHandler);
  }, [navigate, onToggleSearch]);

  return null;
}

function AppShell() {
  return (
    <WouterRouter base={(import.meta.env.BASE_URL || "/").replace(/\/$/, "")}>
      <AppShellInner />
    </WouterRouter>
  );
}

function DeferredPrayerCountdownBanner({ defer }: { defer: boolean }) {
  const [ready, setReady] = useState(!defer);
  useEffect(() => {
    if (!defer) return;
    let cancelled = false;
    const reveal = () => {
      if (!cancelled) setReady(true);
    };
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(reveal, { timeout: 3200 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(id);
      };
    }
    const t = window.setTimeout(reveal, 1400);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [defer]);
  if (!ready) return null;
  return <PrayerCountdownBanner />;
}

function ChromeNavFallback() {
  return (
    <header className="navbar-v3 chrome-boot-ph" aria-hidden="true">
      <div className="navbar-v3__inner" />
      <div className="navbar-v3__search-row" />
      <div className="navbar-ticker-row" />
    </header>
  );
}

function ChromeBottomFallback() {
  return <div className="bottom-nav chrome-boot-ph" data-bottom-nav aria-hidden="true" />;
}

function AppShellInner() {
  const { dir, t } = useLanguage();
  const { isAdmin } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [comingSoonTitle, setComingSoonTitle] = useState("");
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const [location] = useLocation();
  const immersive = isImmersiveChromePath(location);
  const onPrayer = isPrayerTimesPath(location);
  const onAuthStandalone = isAuthStandalonePath(location);
  const hideSiteChrome = immersive || onPrayer || onAuthStandalone;
  const deferHomePrayerChrome = location === "/" || location === "";
  const isHomePath = deferHomePrayerChrome;

  const { isHidden: shouldHideChrome } = useAutoHideBottomNav({
    forceShow: searchOpen || comingSoonOpen || hideSiteChrome,
    routeKey: location,
  });

  useEffect(() => {
    // viewport / color-scheme فقط — ألوان الشريط عبر PageChromeSync
    ensureChromeMeta(undefined, { skipThemeColor: true });
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("pts-immersive", onPrayer);
    document.documentElement.classList.toggle("chrome-immersive", immersive);
    return () => {
      document.documentElement.classList.remove("pts-immersive");
      document.documentElement.classList.remove("chrome-immersive");
    };
  }, [onPrayer, immersive]);

  useEffect(() => {
    const evtHandler = () => setSearchOpen(true);
    const soonHandler = (e: Event) => {
      const detail = (e as CustomEvent<{ title?: string }>).detail;
      setComingSoonTitle(detail?.title || "هذا القسم");
      setComingSoonOpen(true);
    };
    window.addEventListener("global-search-open", evtHandler);
    window.addEventListener("global-coming-soon-open", soonHandler as EventListener);
    return () => {
      window.removeEventListener("global-search-open", evtHandler);
      window.removeEventListener("global-coming-soon-open", soonHandler as EventListener);
    };
  }, []);

  return (
    <PrayerCountdownScope deferMs={isHomePath ? 10_000 : 0}>
    <div
      className={`app-shell${shouldHideChrome ? " app-chrome-hidden" : ""}${isNativeApp ? " app-shell--native" : ""}`}
      style={{ "--app-dir": dir } as React.CSSProperties}
      data-chrome-hidden={shouldHideChrome ? "true" : "false"}
      data-native-app={isNativeApp ? "true" : "false"}
    >
      <PageChromeSync />
      <GlobalAppShortcuts onToggleSearch={() => setSearchOpen((v) => !v)} />
      <a href="#main-content" className="skip-link mj-skip-link">{t("skip_to_content")}</a>
      <Suspense fallback={null}>
        <OfflineBanner />
      </Suspense>
      <Suspense fallback={null}>
        <CookieConsentBanner />
      </Suspense>
      <Suspense fallback={null}>
        <UpdateAvailableBanner />
      </Suspense>
      <Suspense fallback={null}>
        <NavProgressBar />
      </Suspense>
      <SeoManager />
      <ScrollResetOnNav />
      <Suspense fallback={null}>
        <FocusArrival />
      </Suspense>
      <NavigationBinder />
      <NativeBackButtonListener />
      <Suspense fallback={null}>
        <RouteEnterMotion />
      </Suspense>
      <Suspense fallback={null}>
        <EdgeSwipeBack />
      </Suspense>
      <NativeNotificationsBootstrap />
      <IdleRuntimeBoot />
      {!hideSiteChrome ? (
        <div className="app-top-chrome">
          <Suspense fallback={<ChromeNavFallback />}>
            <NavBar />
          </Suspense>
        </div>
      ) : null}
      <Suspense fallback={null}>
        <TopSectionBar />
      </Suspense>
      {/* شريط العدّ التنازلي العام يُخفى في مسارات المواقيت والمصحف */}
      {!hideSiteChrome && !onPrayer && (
        <Suspense fallback={null}>
          <DeferredPrayerCountdownBanner defer={deferHomePrayerChrome} />
        </Suspense>
      )}
      {!hideSiteChrome && (
        <DeferredHomeAdhanChrome defer={deferHomePrayerChrome} />
      )}
      <main id="main-content" className="app-main" tabIndex={-1} data-scroll-root="1" aria-label="المحتوى الرئيسي">
        <Router />
      </main>
      {/* تذييل الموقع للويب فقط — داخل التطبيق الأصلي يُخفى (App Store: الروابط القانونية في الإعدادات) */}
      {!hideSiteChrome && !isNative && <DeferredSiteFooter />}
      {!hideSiteChrome && <DeferredAssistantWidget />}
      {/* أزرار تحرير المشرف العائمة لا تغطي المواقيت/المصحف */}
      {isAdmin && !hideSiteChrome && (
        <Suspense fallback={null}>
          <AdminSiteEditBar />
        </Suspense>
      )}
      {!hideSiteChrome && (
        <Suspense fallback={null}>
          <ScrollToTop />
        </Suspense>
      )}
      {!onAuthStandalone && (
        <Suspense fallback={null}>
          <GlobalBackButton />
        </Suspense>
      )}
      {!hideSiteChrome && (
        <Suspense fallback={null}>
          <PwaInstallBanner />
        </Suspense>
      )}
      {!onAuthStandalone && (
        <Suspense fallback={hideSiteChrome ? null : <ChromeBottomFallback />}>
          <BottomNavBar isHidden={shouldHideChrome} />
        </Suspense>
      )}
      {!onAuthStandalone ? <DeferredQuranMiniPlayer /> : null}
      <VisualViewportKeyboardBridge />
      <Suspense fallback={null}>
        <SafeAreaDebugOverlay />
      </Suspense>
      <Suspense fallback={null}>
        <DeferredAchievementBoot />
      </Suspense>
      <Suspense fallback={null}>
        <CrossDeviceResumeToast />
      </Suspense>
      {searchOpen && (
        <SectionErrorBoundary name="GlobalSearchModal">
          <Suspense fallback={null}>
            <GlobalSearchModal onClose={() => setSearchOpen(false)} />
          </Suspense>
        </SectionErrorBoundary>
      )}
      <Suspense fallback={null}>
        <ComingSoonDialog
          open={comingSoonOpen}
          title={comingSoonTitle}
          onClose={() => setComingSoonOpen(false)}
        />
      </Suspense>
    </div>
    </PrayerCountdownScope>
  );
}

/** يؤجّل مزوّد أوقات الصلاة والجدولة — ١٠ث على الرئيسية لتخفيف TBT. */
function PrayerCountdownScope({
  deferMs,
  children,
}: {
  deferMs: number;
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(deferMs === 0);

  useEffect(() => {
    if (deferMs === 0) return;
    let cancelled = false;
    const reveal = () => {
      if (!cancelled) setReady(true);
    };
    const arm = () => {
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(reveal, { timeout: deferMs });
      } else {
        window.setTimeout(reveal, deferMs);
      }
    };
    const afterLoad = () => window.setTimeout(arm, 0);
    if (document.readyState === "complete") afterLoad();
    else window.addEventListener("load", afterLoad, { once: true });
    return () => {
      cancelled = true;
    };
  }, [deferMs]);

  if (!ready) return <>{children}</>;
  return (
    <PrayerCountdownProvider>
      <PrayerRuntimeBoot />
      {children}
    </PrayerCountdownProvider>
  );
}

function PrayerRuntimeBoot() {
  return (
    <>
      <IslamicReminderBootstrap />
      <AdhanSchedulerBootstrap />
      <PrayerAlertSchedulerBootstrap />
    </>
  );
}

function DeferredSiteFooter() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const reveal = () => {
      if (!cancelled) setReady(true);
    };
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(reveal, { timeout: 4_000 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(id);
      };
    }
    const t = window.setTimeout(reveal, 2_000);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, []);
  if (!ready) return null;
  return (
    <Suspense fallback={null}>
      <SiteFooter />
    </Suspense>
  );
}

function DeferredHomeAdhanChrome({ defer }: { defer: boolean }) {
  const [ready, setReady] = useState(!defer);
  useEffect(() => {
    if (!defer) return;
    let cancelled = false;
    const reveal = () => {
      if (!cancelled) setReady(true);
    };
    const arm = () => {
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(reveal, { timeout: 10_000 });
      } else {
        window.setTimeout(reveal, 10_000);
      }
    };
    const afterLoad = () => window.setTimeout(arm, 0);
    if (document.readyState === "complete") afterLoad();
    else window.addEventListener("load", afterLoad, { once: true });
    return () => {
      cancelled = true;
    };
  }, [defer]);
  if (!ready) return null;
  return (
    <>
      <Suspense fallback={null}>
        <AdhanNotificationBar />
      </Suspense>
      <SectionErrorBoundary name="AdhanActiveOverlay">
        <Suspense fallback={null}>
          <AdhanActiveOverlay />
        </Suspense>
      </SectionErrorBoundary>
      <Suspense fallback={null}>
        <PrayerRespectBanner />
      </Suspense>
    </>
  );
}

function IdleRuntimeBoot() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const arm = () => window.setTimeout(() => setReady(true), 10_000);
    if (document.readyState === "complete") arm();
    else window.addEventListener("load", arm, { once: true });
  }, []);
  if (!ready) return null;
  return (
    <>
      <OfflineSyncBootstrap />
      <PlatformLogicBootstrap />
      <SovereignNavigationBridge />
    </>
  );
}

/** Background IndexedDB warm + reconnect sync — logic only, no UI. */
function OfflineSyncBootstrap() {
  useEffect(() => {
    let cancelled = false;
    void import("@/lib/offline-sync-bootstrap").then((m) => {
      if (!cancelled) m.startOfflineSync();
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}

/** Smart recommendations / search warm / weekly analytics / local notifs / khatmah — logic only. */
function PlatformLogicBootstrap() {
  useEffect(() => {
    let cancelled = false;
    void import("@/lib/platform-logic-bootstrap").then((m) => {
      if (!cancelled) void m.startPlatformLogicSuite();
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}

function SovereignNavigationBridge() {
  const [Bridge, setBridge] = useState<ComponentType | null>(null);
  useEffect(() => {
    let cancelled = false;
    void import("@/lib/sovereign/SovereignNavigationBridge").then((m) => {
      if (!cancelled) setBridge(() => m.SovereignNavigationBridge);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return Bridge ? <Bridge /> : null;
}

/** يؤجّل تحميل حزمة المساعد حتى الخمول أو أول تفاعل — لا يحجب العرض الأول. */
function DeferredAssistantWidget() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let done = false;
    const arm = () => {
      if (done) return;
      done = true;
      setReady(true);
    };
    // فصل المسارين يتجنّب تضييق TypeScript الخاطئ لـ setTimeout إلى `never`
    // عند استخدام `"requestIdleCallback" in window` كشرط ثلاثي.
    let idleHandle: number | undefined;
    let timeoutHandle: number | undefined;
    if (typeof window.requestIdleCallback === "function") {
      idleHandle = window.requestIdleCallback(arm, { timeout: 5000 });
    } else {
      timeoutHandle = window.setTimeout(arm, 3000);
    }
    const onInteract = () => arm();
    window.addEventListener("pointerdown", onInteract, { once: true, passive: true });
    window.addEventListener("keydown", onInteract, { once: true });
    return () => {
      if (idleHandle != null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle != null) {
        window.clearTimeout(timeoutHandle);
      }
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
    };
  }, []);
  if (!ready) return null;
  return (
    <Suspense fallback={null}>
      <AssistantFloatingWidget />
    </Suspense>
  );
}

/** شريط التلاوة المصغّر — يُحمّل فقط عند تشغيل فعلي (لا AudioEngine في الإقلاع). */
function DeferredQuranMiniPlayer() {
  const [active, setActive] = useState(() => isMiniPlayerVisible());
  useEffect(() => subscribeMiniPlayer((state) => setActive(state.visible)), []);
  if (!active) return null;
  return (
    <Suspense fallback={null}>
      <QuranMiniPlayerBar />
    </Suspense>
  );
}

function App() {
  return (
    <ThemePreferenceProvider>
      <FontPreferenceProvider>
        <LanguageProvider>
          <UserPreferencesProvider>
            <AuthProvider>
              <AppShell />
            </AuthProvider>
          </UserPreferencesProvider>
        </LanguageProvider>
      </FontPreferenceProvider>
    </ThemePreferenceProvider>
  );
}

export default App;
