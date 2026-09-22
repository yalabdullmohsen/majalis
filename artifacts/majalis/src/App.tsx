import { Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState, type ComponentType } from "react";
import { Route, Switch, Router as WouterRouter, useLocation } from "wouter";
import { AuthProvider } from "@/components/AuthProvider";
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
import { useSharedPrayerData } from "@/components/prayer/PrayerCountdownProvider";
import { recordRouteTransitionEnd, recordRouteTransitionStart } from "@/lib/route-transition-timing";
import { LazyRouteFallback } from "@/components/LazyRouteFallback";
import { PRAYER_ALERT_PREFS_CHANGED_EVENT } from "@/lib/prayer-alert-preferences";
import { getActivePrayerLocation } from "@/lib/prayer-location-prefs";
import { migratePrayerSettingsIfNeeded } from "@/lib/prayer-settings-upgrade";
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
import { isAuthStandalonePath, isImmersiveChromePath, isPinnedChromePath, isPrayerTimesPath } from "@/lib/immersive-chrome";
import { isHomeChromePath } from "@/lib/ticker-quiet-paths";
import { isNative, isNativeApp } from "@/lib/capacitor-utils";
import { isMiniPlayerVisible, subscribeMiniPlayer } from "@/lib/quran-mini-player";
import { HomeHeroLcp, HomeRestShell } from "@/components/home/HomeHeroLcp";
import { HomeStartHereSection } from "@/components/home/HomeStartHereSection";
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
/** على Capacitor ابدأ تحميل الكروم فورًا لتقليل فترة ChromeNavFallback */
if (isNativeApp) {
  void import("@/components/NavBar");
  void import("@/components/BottomNavBar");
}
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

/** مسارات غير الرئيسية — كسول لميزانية entry، مع تسخين فوري بعد الإقلاع */
const loadAppRoutes = () => import("./AppRoutes");
const AppRoutesLazy = lazy(loadAppRoutes);
if (typeof window !== "undefined") {
  const warm = () => {
    void loadAppRoutes();
  };
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(warm, { timeout: 900 });
  } else {
    window.setTimeout(warm, 0);
  }
}

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
    try {
      const path = (location.split("?")[0] || "/").trim() || "/";
      if (path && !path.includes("native-load-error")) {
        sessionStorage.setItem("mj.last-path", path);
      }
    } catch {
      /* ignore */
    }
    if (import.meta.env.DEV) {
      try {
        performance.mark(`route-nav:${location}`);
      } catch {
        /* ignore */
      }
    }
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
    recordRouteTransitionStart(location);
    if (leavingLocation === location) {
      isPopRef.current = false;
      return;
    }
    scrollPosByPath.set(leavingLocation, captureScrollSnapshot());
    lastLocationRef.current = location;
    isPopRef.current = false;

    if (isPop) {
      restoreScrollSnapshot(scrollPosByPath.get(location));
      const ms = recordRouteTransitionEnd(location);
      if (ms != null && ms > 0 && typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("majalis:route-transition", { detail: { path: location, ms } }));
      }
      return;
    }
    scrollDocumentToTop();
    requestAnimationFrame(() => {
      const ms = recordRouteTransitionEnd(location);
      if (ms != null && ms > 0) {
        window.dispatchEvent(new CustomEvent("majalis:route-transition", { detail: { path: location, ms } }));
      }
    });
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

/**
 * جدولة الصوت داخل التطبيق + إشعارات الويب فقط.
 * الإشعارات الأصلية/LocalNotifications ملك PrayerAlertSchedulerBootstrap
 * (NATIVE_ALERTS_OWN_AUDIO_V1 يمنع تكرار صوت الدخول على native).
 */
function AdhanSchedulerBootstrap() {
  const { data } = useSharedPrayerData();
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
  const { data } = useSharedPrayerData();

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
      if (!data) return;
      void loadScheduler().then((mod) => {
        mod.invalidatePrayerNativeSchedule();
        // Force full native reschedule (same path as AdhanSettingsView) so toggles
        // on real devices actually re-apply LocalNotifications.
        void mod.startPrayerAlertScheduler(data, { forceNativeReschedule: true });
      });
    };
    let lastTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const prayerDayTz = () => getActivePrayerLocation().timeZone || "Asia/Kuwait";
    let lastDateKey = new Intl.DateTimeFormat("en-CA", {
      timeZone: prayerDayTz(),
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const onClockTick = () => {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const dateKey = new Intl.DateTimeFormat("en-CA", {
        timeZone: prayerDayTz(),
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
    // String literal — avoid importing prayer-notifications/preferences into the entry chunk.
    window.addEventListener("majalis:prayer-notification-prefs-changed", onPrefsChanged);
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
      window.removeEventListener("majalis:prayer-notification-prefs-changed", onPrefsChanged);
      window.removeEventListener("majalis:adhan-prefs-changed", onPrefsChanged);
      removeAppState?.();
    };
  }, [data]);

  return null;
}

/** قنوات + مستمعو النقر + Remote Push صامت (بدون طلب إذن) بعد أول خمول. */
function NativeNotificationsBootstrap() {
  useEffect(() => {
    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      void import("@/lib/notifications/native-bootstrap").then(({ bootstrapNativeNotifications }) => {
        if (!cancelled) void bootstrapNativeNotifications();
      });
    };
    let idleId: number | undefined;
    let timeoutId: number | undefined;
    if (typeof requestIdleCallback === "function") {
      idleId = requestIdleCallback(run, { timeout: 4500 });
    } else {
      timeoutId = window.setTimeout(run, 2800);
    }
    return () => {
      cancelled = true;
      if (idleId != null && typeof cancelIdleCallback === "function") cancelIdleCallback(idleId);
      if (timeoutId != null) window.clearTimeout(timeoutId);
    };
  }, []);
  return null;
}

function HomeLazyRoute() {
  return (
    <ErrorBoundary>
      <div className="m2030-home m2030-home--v2" dir="rtl">
        {/* h1 + «ابدأ من هنا» خارج Suspense — يمنع تأخير 2.2s من سرقة LCP تحت throttling */}
        <HomeHeroLcp />
        <section className="m2030-band m2030-band--sage home-start-here-band" aria-label="مدخل المبتدئ">
          <HomeStartHereSection />
        </section>
        <Suspense fallback={<HomeRestShell />}>
          <HomePage />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <HomeLazyRoute />
      </Route>
      <Route>
        <Suspense fallback={<LazyRouteFallback />}>
          <AppRoutesLazy />
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

function ChromeNavFallback({ homeChrome }: { homeChrome: boolean }) {
  return (
    <header className="navbar-v3 chrome-boot-ph" aria-hidden="true">
      <div className="navbar-v3__inner">
        <div className="navbar-v3__start" />
        <div className="navbar-v3__mid-spacer" />
        <div className="navbar-v3__end">
          <span className="navbar-mobile-login navbar-mobile-login--pending" />
        </div>
      </div>
      {homeChrome ? <div className="navbar-ticker-row" /> : null}
    </header>
  );
}

function ChromeBottomFallback() {
  return <div className="bottom-nav chrome-boot-ph" data-bottom-nav aria-hidden="true" />;
}

function AppShellInner() {
  const { dir, t } = useLanguage();
  const [searchOpen, setSearchOpen] = useState(false);
  const [comingSoonTitle, setComingSoonTitle] = useState("");
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const [location] = useLocation();
  const immersive = isImmersiveChromePath(location);
  const onPrayer = isPrayerTimesPath(location);
  const onAuthStandalone = isAuthStandalonePath(location);
  /** غمري/مواقيت: بلا هيدر. الدخول يُبقي الهيدر والتيكر المتحرك. */
  const hideTopChrome = immersive || onPrayer;
  /** تذييل/مساعد/تحرير — مخفي أيضًا في صفحات الدخول المستقلة */
  const hideSiteChrome = hideTopChrome || onAuthStandalone;
  const deferHomePrayerChrome = location === "/" || location === "";
  const isHomePath = deferHomePrayerChrome;
  const homeChrome = isHomeChromePath(location);

  useLayoutEffect(() => {
    document.documentElement.dataset.homeChrome = homeChrome ? "1" : "0";
  }, [homeChrome]);

  const searchScrollYRef = useRef(0);

  const openGlobalSearch = useCallback(() => {
    searchScrollYRef.current = window.scrollY || document.documentElement.scrollTop || 0;
    setSearchOpen(true);
  }, []);

  const closeGlobalSearch = useCallback(() => {
    const y = searchScrollYRef.current;
    setSearchOpen(false);
    requestAnimationFrame(() => {
      window.scrollTo({ top: y, left: 0, behavior: "instant" as ScrollBehavior });
    });
  }, []);

  const { isHidden: shouldHideChrome } = useAutoHideBottomNav({
    forceShow: searchOpen || comingSoonOpen || hideSiteChrome || isPinnedChromePath(location),
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

  const isAdminPath =
    location === "/admin" ||
    location.startsWith("/admin/") ||
    location.startsWith("/admin?");
  const enableV2App = !immersive && !isAdminPath;

  useEffect(() => {
    const root = document.documentElement;
    if (enableV2App) {
      root.setAttribute("data-v2-app", "1");
      // Identity Reset PR-1: كثافة STANDARD على الهاتف (قراءة → comfortable لاحقًا)
      if (!root.getAttribute("data-density")) {
        root.setAttribute("data-density", "standard");
      }
      void import("@/styles/pages/app-shell-v2.css");
    } else {
      root.removeAttribute("data-v2-app");
      root.removeAttribute("data-density");
    }
    return () => {
      root.removeAttribute("data-v2-app");
      root.removeAttribute("data-density");
    };
  }, [enableV2App]);

  useEffect(() => {
    const root = document.documentElement;
    if (isHomePath) {
      root.setAttribute("data-v2-dashboard", "1");
    } else {
      root.removeAttribute("data-v2-dashboard");
    }
    return () => {
      root.removeAttribute("data-v2-dashboard");
    };
  }, [isHomePath]);

  const isQuranHubPath =
    location === "/quran-hub" || location.startsWith("/quran-hub?");

  useEffect(() => {
    const root = document.documentElement;
    if (isQuranHubPath) {
      root.setAttribute("data-v2-quran-hub", "1");
    } else {
      root.removeAttribute("data-v2-quran-hub");
    }
    return () => {
      root.removeAttribute("data-v2-quran-hub");
    };
  }, [isQuranHubPath]);

  const isStoriesPath =
    location === "/prophets" ||
    location.startsWith("/prophets/") ||
    location === "/seerah" ||
    location.startsWith("/seerah?") ||
    location === "/stories" ||
    location.startsWith("/stories?") ||
    location === "/nations" ||
    location.startsWith("/nations/") ||
    location.startsWith("/nations?") ||
    location === "/sahabah" ||
    location.startsWith("/sahabah?") ||
    location === "/shamael" ||
    location.startsWith("/shamael?");

  useEffect(() => {
    const root = document.documentElement;
    if (isStoriesPath) {
      root.setAttribute("data-v2-stories", "1");
    } else {
      root.removeAttribute("data-v2-stories");
    }
    return () => {
      root.removeAttribute("data-v2-stories");
    };
  }, [isStoriesPath]);

  const isSearchPath =
    location === "/search" ||
    location.startsWith("/search/") ||
    location.startsWith("/search?");

  useEffect(() => {
    const root = document.documentElement;
    if (isSearchPath) {
      root.setAttribute("data-v2-search", "1");
    } else {
      root.removeAttribute("data-v2-search");
    }
    return () => {
      root.removeAttribute("data-v2-search");
    };
  }, [isSearchPath]);

  const isProfileHubPath =
    location === "/settings" ||
    location.startsWith("/settings?") ||
    location === "/progress" ||
    location.startsWith("/progress?") ||
    location === "/vault" ||
    location.startsWith("/vault?") ||
    location === "/my-learning" ||
    location.startsWith("/my-learning?") ||
    location === "/stats" ||
    location.startsWith("/stats?") ||
    location === "/profile" ||
    location.startsWith("/profile?") ||
    location === "/notification-settings" ||
    location.startsWith("/notification-settings?") ||
    location === "/notifications-and-sound" ||
    location.startsWith("/notifications-and-sound?") ||
    location === "/feature-tour" ||
    location.startsWith("/feature-tour?");

  useEffect(() => {
    const root = document.documentElement;
    if (isProfileHubPath) {
      root.setAttribute("data-v2-profile", "1");
    } else {
      root.removeAttribute("data-v2-profile");
    }
    return () => {
      root.removeAttribute("data-v2-profile");
    };
  }, [isProfileHubPath]);

  const isLessonsPath =
    location === "/lessons" ||
    location.startsWith("/lessons/") ||
    location.startsWith("/lessons?");

  useEffect(() => {
    const root = document.documentElement;
    if (isLessonsPath) {
      root.setAttribute("data-v2-lessons", "1");
    } else {
      root.removeAttribute("data-v2-lessons");
    }
    return () => {
      root.removeAttribute("data-v2-lessons");
    };
  }, [isLessonsPath]);

  const isSectionsPath =
    location === "/sections" ||
    location.startsWith("/sections?") ||
    location.startsWith("/sections/");

  useEffect(() => {
    const root = document.documentElement;
    if (isSectionsPath) {
      root.setAttribute("data-v2-sections", "1");
    } else {
      root.removeAttribute("data-v2-sections");
    }
    return () => {
      root.removeAttribute("data-v2-sections");
    };
  }, [isSectionsPath]);

  const isKnowledgeHubPath =
    location === "/fiqh" ||
    location.startsWith("/fiqh/") ||
    location.startsWith("/fiqh?") ||
    location === "/fiqh-qawaid" ||
    location.startsWith("/fiqh-qawaid?") ||
    location === "/hadith" ||
    location.startsWith("/hadith/") ||
    location.startsWith("/hadith?") ||
    location === "/hadith-science" ||
    location.startsWith("/hadith-science?") ||
    location === "/tawhid" ||
    location.startsWith("/tawhid/") ||
    location.startsWith("/tawhid?") ||
    location === "/aqidah" ||
    location.startsWith("/aqidah?") ||
    location === "/tafsir" ||
    location.startsWith("/tafsir?") ||
    location === "/ulum-quran" ||
    location.startsWith("/ulum-quran?") ||
    location === "/quran-knowledge" ||
    location.startsWith("/quran-knowledge?") ||
    location === "/mutashabihat" ||
    location.startsWith("/mutashabihat?") ||
    location === "/madhahib" ||
    location.startsWith("/madhahib/") ||
    location.startsWith("/madhahib?") ||
    location === "/islamic-sects" ||
    location.startsWith("/islamic-sects/") ||
    location.startsWith("/islamic-sects?") ||
    location === "/methodology" ||
    location.startsWith("/methodology?") ||
    location === "/sources" ||
    location.startsWith("/sources/") ||
    location.startsWith("/sources?");

  useEffect(() => {
    const root = document.documentElement;
    if (isKnowledgeHubPath) {
      root.setAttribute("data-v2-knowledge", "1");
      void import("@/styles/pages/knowledge-dashboards-v2.css");
    } else {
      root.removeAttribute("data-v2-knowledge");
    }
    return () => {
      root.removeAttribute("data-v2-knowledge");
    };
  }, [isKnowledgeHubPath]);

  const isWorshipPath =
    location === "/adhkar" ||
    location.startsWith("/adhkar/") ||
    location.startsWith("/adhkar?") ||
    location === "/duas" ||
    location.startsWith("/duas?") ||
    location === "/duas-quran" ||
    location.startsWith("/duas-quran?") ||
    location === "/prayer-times" ||
    location.startsWith("/prayer-times?") ||
    location === "/prayer-ranks" ||
    location.startsWith("/prayer-ranks?") ||
    location === "/salah-guide" ||
    location.startsWith("/salah-guide?") ||
    location === "/zakat" ||
    location.startsWith("/zakat?") ||
    location === "/sawm" ||
    location.startsWith("/sawm?") ||
    location === "/hajj" ||
    location.startsWith("/hajj?") ||
    location === "/tahara" ||
    location.startsWith("/tahara?") ||
    location === "/jumuah" ||
    location.startsWith("/jumuah?") ||
    location === "/janaza" ||
    location.startsWith("/janaza?") ||
    location === "/ruqya" ||
    location.startsWith("/ruqya?") ||
    location === "/udhiya" ||
    location.startsWith("/udhiya?") ||
    location === "/sadaqa" ||
    location.startsWith("/sadaqa?") ||
    location === "/waqf" ||
    location.startsWith("/waqf?");

  useEffect(() => {
    const root = document.documentElement;
    if (isWorshipPath) {
      root.setAttribute("data-v2-worship", "1");
      void import("@/styles/pages/worship-history-v2.css");
    } else {
      root.removeAttribute("data-v2-worship");
    }
    return () => {
      root.removeAttribute("data-v2-worship");
    };
  }, [isWorshipPath]);

  const isGlossaryPath =
    location === "/islamic-glossary" ||
    location.startsWith("/islamic-glossary?") ||
    location === "/glossary" ||
    location.startsWith("/glossary?");

  useEffect(() => {
    const root = document.documentElement;
    if (isGlossaryPath) {
      root.setAttribute("data-v2-glossary", "1");
      void import("@/styles/pages/worship-history-v2.css");
    } else {
      root.removeAttribute("data-v2-glossary");
    }
    return () => {
      root.removeAttribute("data-v2-glossary");
    };
  }, [isGlossaryPath]);

  const isHistoryPath =
    location === "/tarikh-islami" ||
    location.startsWith("/tarikh-islami/") ||
    location.startsWith("/tarikh-islami?");

  useEffect(() => {
    const root = document.documentElement;
    if (isHistoryPath) {
      root.setAttribute("data-v2-history", "1");
      void import("@/styles/pages/worship-history-v2.css");
    } else {
      root.removeAttribute("data-v2-history");
    }
    return () => {
      root.removeAttribute("data-v2-history");
    };
  }, [isHistoryPath]);

  const isLearnPath =
    location === "/quiz" ||
    location.startsWith("/quiz/") ||
    location.startsWith("/quiz?") ||
    location === "/competitions" ||
    location.startsWith("/competitions/") ||
    location.startsWith("/competitions?") ||
    location === "/flashcards" ||
    location.startsWith("/flashcards?");

  useEffect(() => {
    const root = document.documentElement;
    if (isLearnPath) {
      root.setAttribute("data-v2-learn", "1");
      void import("@/styles/pages/learn-legal-v2.css");
    } else {
      root.removeAttribute("data-v2-learn");
    }
    return () => {
      root.removeAttribute("data-v2-learn");
    };
  }, [isLearnPath]);

  const isLegalPath =
    location === "/about" ||
    location.startsWith("/about?") ||
    location === "/privacy" ||
    location.startsWith("/privacy/") ||
    location.startsWith("/privacy?") ||
    location === "/privacy-center" ||
    location.startsWith("/privacy-center?") ||
    location === "/terms" ||
    location.startsWith("/terms?") ||
    location === "/support" ||
    location.startsWith("/support?") ||
    location === "/contact" ||
    location.startsWith("/contact?") ||
    location === "/data-licenses" ||
    location.startsWith("/data-licenses?") ||
    location === "/fatwa-policy" ||
    location.startsWith("/fatwa-policy?") ||
    location === "/account-deletion" ||
    location.startsWith("/account-deletion?") ||
    location === "/sitemap" ||
    location.startsWith("/sitemap?");

  useEffect(() => {
    const root = document.documentElement;
    if (isLegalPath) {
      root.setAttribute("data-v2-legal", "1");
      void import("@/styles/pages/learn-legal-v2.css");
    } else {
      root.removeAttribute("data-v2-legal");
    }
    return () => {
      root.removeAttribute("data-v2-legal");
    };
  }, [isLegalPath]);

  const isOfflinePath =
    location === "/offline" || location.startsWith("/offline?");

  useEffect(() => {
    const root = document.documentElement;
    if (isOfflinePath) {
      root.setAttribute("data-v2-offline", "1");
      void import("@/styles/pages/learn-legal-v2.css");
    } else {
      root.removeAttribute("data-v2-offline");
    }
    return () => {
      root.removeAttribute("data-v2-offline");
    };
  }, [isOfflinePath]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-v2-nav", "1");
    return () => {
      root.removeAttribute("data-v2-nav");
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    let nightCssLoaded = false;
    const loadNightCss = () => {
      if (nightCssLoaded) return;
      nightCssLoaded = true;
      void import("@/styles/pages/luxury-night-v2.css");
      void import("@/styles/sunnah-identity-luxury-night.css");
    };
    const syncNight = () => {
      const dark =
        root.getAttribute("data-theme") === "dark" || root.classList.contains("dark");
      if (dark) {
        root.setAttribute("data-v2-night", "1");
        loadNightCss();
      } else {
        root.removeAttribute("data-v2-night");
      }
    };
    syncNight();
    const obs = new MutationObserver(syncNight);
    obs.observe(root, { attributes: true, attributeFilter: ["data-theme", "class"] });
    return () => {
      obs.disconnect();
      root.removeAttribute("data-v2-night");
    };
  }, []);

  useEffect(() => {
    const evtHandler = () => openGlobalSearch();
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
  }, [openGlobalSearch]);

  return (
    <PrayerCountdownScope deferMs={isHomePath ? 20_000 : 0}>
    <div
      className={`app-shell${shouldHideChrome ? " app-chrome-hidden" : ""}${isNativeApp ? " app-shell--native" : ""}`}
      style={{ "--app-dir": dir } as React.CSSProperties}
      data-chrome-hidden={shouldHideChrome ? "true" : "false"}
      data-native-app={isNativeApp ? "true" : "false"}
    >
      <PageChromeSync />
      <GlobalAppShortcuts onToggleSearch={() => (searchOpen ? closeGlobalSearch() : openGlobalSearch())} />
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
      {!hideTopChrome ? (
        <div className="app-top-chrome">
          <Suspense fallback={<ChromeNavFallback homeChrome={homeChrome} />}>
            <NavBar />
          </Suspense>
        </div>
      ) : null}
      <Suspense fallback={null}>
        <TopSectionBar />
      </Suspense>
      {/* شريط العدّ التنازلي العام يُخفى في مسارات المواقيت والمصحف والدخول */}
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
      {/* أدوات المشرف تُحمَّل من AdminShell فقط — لا استيراد في الهيكل العام */}
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
            <GlobalSearchModal onClose={closeGlobalSearch} />
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

/**
 * مزوّد المواقيت يبقى مركّبًا دائمًا (بلا إعادة mount للشجرة — كانت تسبب تعليقًا
 * بعد ~١٠ث على الرئيسية). تُؤجَّل فقط جدولة الأذان/التنبيهات الثقيلة.
 */
function PrayerCountdownScope({
  deferMs,
  children,
}: {
  deferMs: number;
  children: React.ReactNode;
}) {
  const [bootRuntime, setBootRuntime] = useState(deferMs === 0);

  useEffect(() => {
    if (deferMs === 0) {
      setBootRuntime(true);
      return;
    }
    let cancelled = false;
    const reveal = () => {
      if (!cancelled) setBootRuntime(true);
    };
    /* setTimeout ثابت — لا rIC حتى لا يسحب Lighthouse العمل مبكرًا أثناء قياس TBT */
    const afterLoad = () => window.setTimeout(reveal, deferMs);
    if (document.readyState === "complete") afterLoad();
    else window.addEventListener("load", afterLoad, { once: true });
    return () => {
      cancelled = true;
    };
  }, [deferMs]);

  return (
    <PrayerCountdownProvider enabled={bootRuntime || deferMs === 0}>
      {bootRuntime ? <PrayerRuntimeBoot /> : null}
      {children}
    </PrayerCountdownProvider>
  );
}


function PrayerSettingsMigrationBoot() {
  useEffect(() => {
    try {
      migratePrayerSettingsIfNeeded();
    } catch {
      /* ignore */
    }
  }, []);
  return null;
}

function PrayerRuntimeBoot() {
  return (
    <>
      <PrayerSettingsMigrationBoot />
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

/** يؤجّل المساعد بعد أول تفاعل أو مهلة طويلة — بلا rIC حتى لا يُسحَب أثناء قياس TBT/CLS. */
function DeferredAssistantWidget() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let done = false;
    let timeoutHandle = 0;
    const arm = () => {
      if (done) return;
      done = true;
      setReady(true);
    };
    void import("@/lib/assistant-feature-flag").then(({ isAssistantFeatureEnabled }) => {
      if (!isAssistantFeatureEnabled()) return;
      // setTimeout فقط (لا requestIdleCallback) — Lighthouse يطلق الخمول مبكرًا فيُحمَّل المساعد ويحرّك التخطيط
      timeoutHandle = window.setTimeout(arm, 20_000);
      const onInteract = () => arm();
      window.addEventListener("pointerdown", onInteract, { once: true, passive: true });
      window.addEventListener("keydown", onInteract, { once: true });
      // cleanup via outer return — store removers on window listeners only when armed
      (DeferredAssistantWidget as unknown as { _cleanup?: () => void })._cleanup = () => {
        window.clearTimeout(timeoutHandle);
        window.removeEventListener("pointerdown", onInteract);
        window.removeEventListener("keydown", onInteract);
      };
    });
    return () => {
      done = true;
      window.clearTimeout(timeoutHandle);
      (DeferredAssistantWidget as unknown as { _cleanup?: () => void })._cleanup?.();
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
