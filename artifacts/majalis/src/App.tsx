import { Suspense, useEffect, useRef, useState, type ComponentType } from "react";
import { Redirect, Route, Switch, Router as WouterRouter, useLocation, useParams } from "wouter";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { FontPreferenceProvider } from "@/components/FontPreferenceProvider";
import { ThemePreferenceProvider } from "@/components/ThemePreferenceProvider";
import { UserPreferencesProvider } from "@/components/UserPreferencesProvider";
import { AdminRouteGuard } from "@/components/AdminRouteGuard";
import { LanguageProvider, useLanguage } from "@/components/LanguageProvider";
import NavBar from "@/components/NavBar";
import SiteFooter from "@/components/SiteFooter";
import { BottomNavBar } from "@/components/BottomNavBar";
import { TopSectionBar } from "@/components/TopSectionBar";
import { ScrollToTop } from "@/components/ScrollToTop";
import { GlobalBackButton } from "@/components/GlobalBackButton";
import { SafeAreaDebugOverlay } from "@/components/SafeAreaDebugOverlay";
import { ComingSoonDialog } from "@/components/ComingSoonDialog";
import { VisualViewportKeyboardBridge } from "@/hooks/useVisualViewportOffset";
import { ensureChromeMeta } from "@/lib/ensure-chrome-meta";
import { AchievementToast } from "@/components/AchievementToast";
import { useAchievementCheck } from "@/hooks/useAchievementCheck";
import { ErrorBoundary, SectionErrorBoundary } from "@/components/ErrorBoundary";
import { usePageSeo } from "@/lib/seo";
import { lazyWithRetry } from "@/lib/lazy-with-retry";
import { LazyRouteFallback } from "@/components/LazyRouteFallback";
import { usePrayerCountdown } from "@/hooks/usePrayerCountdown";
import { startAdhanScheduler } from "@/lib/adhan-scheduler";
import { AdhanNotificationBar } from "@/components/adhan/AdhanNotificationBar";
import { PrayerRespectBanner } from "@/components/adhan/PrayerRespectBanner";
import {
  startPrayerAlertScheduler,
  recheckPrayerAlertWindow,
  invalidatePrayerNativeSchedule,
} from "@/lib/prayer-alert-scheduler";
import { PRAYER_ALERT_PREFS_CHANGED_EVENT } from "@/lib/prayer-alert-preferences";
import { PrayerCountdownBanner } from "@/components/prayer/PrayerCountdownBanner";
import { loadNotifPrefs, scheduleIslamicReminder } from "@/lib/local-notifications";
import { NavProgressBar } from "@/components/NavProgressBar";
import { recordRecentPage } from "@/lib/recent-pages";
import { OfflineBanner } from "@/components/OfflineBanner";
import { UpdateAvailableBanner } from "@/components/UpdateAvailableBanner";
import { PwaInstallBanner } from "@/components/PwaInstallBanner";
import { setPrayerTimesCache } from "@/lib/lesson-time";
import { recordNavigationVisit } from "@/lib/navigation-back";
import { isImmersiveChromePath, isPrayerTimesPath } from "@/lib/immersive-chrome";

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
const GlobalSearchModal = lazyWithRetry(
  () => import("@/components/GlobalSearchModal").then((m) => ({ default: m.GlobalSearchModal })),
  "GlobalSearchModal",
);

const NotFound = lazy(() => import("@/views/not-found"));
const HomePage = lazy(() => import("@/views/HomePage"));
const QuranEnginePage = lazy(() => import("@/pages/quran/QuranEnginePage"));
const AboutPage = lazy(() => import("@/views/AboutPage"));
const AboutUsPage = lazy(() => import("@/views/AboutUsPage"));
const SourcesLicensesPage = lazy(() => import("@/views/SourcesLicensesPage"));
const SiteMapPage = lazy(() => import("@/views/SiteMapPage"));
const PrivacyPage = lazy(() => import("@/views/PrivacyPage"));
const PrivacyCenterPage = lazy(() => import("@/views/PrivacyCenterPage"));
const CookieConsentBanner = lazy(() =>
  import("@/components/CookieConsentBanner").then((m) => ({ default: m.CookieConsentBanner })),
);
const TermsPage = lazy(() => import("@/views/TermsPage"));
const ContactPage = lazy(() => import("@/views/ContactPage"));
const FatwaPolicyPage = lazy(() => import("@/pages/fiqh/FatwaPolicyPage"));

const CalendarPage = lazy(() => import("@/views/CalendarPage"));
const SearchPage = lazy(() => import("@/views/SearchPage"));
const TopicPage = lazy(() => import("@/views/TopicPage"));
const TopicsIndexPage = lazy(() => import("@/views/TopicsIndexPage"));
const LessonsPage = lazy(() => import("@/pages/lessons/LessonsPage"));
const TeachersIndexPage = lazy(() => import("@/pages/lessons/TeachersIndexPage"));
const TeacherDetailPage = lazy(() => import("@/pages/lessons/TeacherDetailPage"));
const LessonsArchivePage = lazy(() => import("@/pages/lessons/LessonsArchivePage"));
const LessonDetailPage = lazy(() => import("@/pages/lessons/LessonDetailPage"));
const ScientificAnnouncementDetailPage = lazy(() => import("@/views/ScientificAnnouncementDetailPage"));
const _LibraryPage = lazy(() => import("@/pages/library/LibraryPage"));
const LibraryDetailPage = lazy(() => import("@/pages/library/LibraryDetailPage"));
const MiraclesPage = lazy(() => import("@/views/MiraclesPage"));
const PropheticMedicinePage = lazy(() => import("@/views/PropheticMedicinePage"));
const FawaidPage = lazy(() => import("@/views/FawaidPage"));
const HadithPage = lazy(() => import("@/pages/hadith/HadithPage"));
const HadithSahihPage = lazy(() => import("@/pages/hadith/HadithSahihPage"));
const HadithDaifPage = lazy(() => import("@/pages/hadith/HadithDaifPage"));
const HadithMawduPage = lazy(() => import("@/pages/hadith/HadithMawduPage"));
const HadithBooksPage = lazy(() => import("@/pages/hadith/HadithBooksPage"));
const HadithBooksAndRulingsPage = lazy(() => import("@/pages/hadith/HadithBooksAndRulingsPage"));
const ArbaeenLovePage = lazy(() => import("@/views/ArbaeenLovePage"));
const QuranCirclesPage = lazy(() => import("@/pages/quran/QuranCirclesPage"));
const KidsPage = lazy(() => import("@/views/KidsPage"));
const SurahIndexPage = lazy(() => import("@/pages/quran/SurahIndexPage"));
const QuranSearchPage = lazy(() => import("@/pages/quran/QuranSearchPage"));
const RevelationOrderPage = lazy(() => import("@/pages/quran/RevelationOrderPage"));
const MakkiMadaniPage = lazy(() => import("@/pages/quran/MakkiMadaniPage"));
const MushafComingSoonPage = lazy(() => import("@/pages/quran/MushafComingSoonPage"));
const RecitationTestPage = lazy(() => import("@/pages/quran/RecitationTestPage"));
const SurahStoriesPage = lazy(() => import("@/pages/quran/SurahStoriesPage"));
const QuranTajweedPage = lazy(() => import("@/pages/quran/QuranTajweedPage"));
const SurahStoryDetailRoute = lazy(() =>
  import("@/pages/quran/SurahStoriesPage").then(m => ({
    default: ({ params }: { params?: Record<string, string> }) => {
      const n = parseInt(params?.number ?? "1", 10);
      return <m.SurahStoryDetailPage surahNumber={Number.isNaN(n) ? 1 : n} />;
    },
  }))
);
const TawhidPage = lazy(() => import("@/views/TawhidPage"));
const DiscoverIslamPage = lazy(() => import("@/views/DiscoverIslamPage"));
const DiscoverIslamQuestionsPage = lazy(() => import("@/views/DiscoverIslamQuestionsPage"));
const DiscoverIslamQuestionDetailPage = lazy(() => import("@/views/DiscoverIslamQuestionDetailPage"));
const DiscoverIslamDoubtsPage = lazy(() => import("@/views/DiscoverIslamDoubtsPage"));
const DiscoverIslamDoubtDetailPage = lazy(() => import("@/views/DiscoverIslamDoubtDetailPage"));
const DiscoverIslamArticleDetailPage = lazy(() => import("@/views/DiscoverIslamArticleDetailPage"));
const HowToBecomeMuslimPage = lazy(() => import("@/views/HowToBecomeMuslimPage"));
const NewMuslimPathPage = lazy(() => import("@/views/NewMuslimPathPage"));
const NewMuslimDayDetailPage = lazy(() => import("@/views/NewMuslimDayDetailPage"));
const DiscoverIslamContactPage = lazy(() => import("@/views/DiscoverIslamContactPage"));
const AdhkarPage = lazy(() => import("@/pages/worship/AdhkarPage"));
const QaPage = lazy(() => import("@/views/QaPage"));
const QuizPage = lazy(() => import("@/views/QuizPage"));
const SubmitContentPage = lazy(() => import("@/views/SubmitContentPage"));
const LoginPage = lazyWithRetry(() => import("@/views/LoginPage"), "LoginPage");
const RegisterPage = lazyWithRetry(() => import("@/views/RegisterPage"), "RegisterPage");
const TranscribePage = lazy(() => import("@/views/TranscribePage"));
const AssistantPage = lazy(() => import("@/views/AssistantPage"));
const KuwaitLessonsPage = lazy(() => import("@/pages/lessons/KuwaitLessonsPage"));
const CardsPage = lazy(() => import("@/views/CardsPage"));
const PrayerTimesPage = lazy(() => import("@/pages/worship/PrayerTimesPage"));
const PrayerRanksPage = lazy(() => import("@/pages/worship/PrayerRanksPage"));
const QiblaPage = lazy(() => import("@/pages/worship/QiblaPage"));
const TasbihPage = lazy(() => import("@/pages/worship/TasbihPage"));
const DailyWirdPage = lazy(() => import("@/pages/worship/DailyWirdPage"));
const OccasionsPage = lazy(() => import("@/views/OccasionsPage"));
const ArbaeenNawawiPage = lazy(() => import("@/pages/hadith/ArbaeenNawawiPage"));
const ArbaeenHadithDetailPage = lazy(() => import("@/pages/hadith/ArbaeenHadithDetailPage"));
const SujoodSahwPage = lazy(() => import("@/views/SujoodSahwPage"));
const AmradQalbiyyaPage = lazy(() => import("@/views/AmradQalbiyyaPage"));
const DurusImaniyyaPage = lazy(() => import("@/views/DurusImaniyyaPage"));
const DurusMutanawwiaPage = lazy(() => import("@/views/DurusMutanawwiaPage"));
const ImanTopicsPage = lazy(() => import("@/views/ImanTopicsPage"));
const SunnahStudiesPage = lazy(() => import("@/pages/hadith/SunnahStudiesPage"));
const TazkiyaTopicsPage = lazy(() => import("@/views/TazkiyaTopicsPage"));
const TarikhIslamiPage = lazy(() => import("@/views/TarikhIslamiPage"));
const UsraMujtamaPage = lazy(() => import("@/views/UsraMujtamaPage"));
const FikrWaqiaPage = lazy(() => import("@/views/FikrWaqiaPage"));
const MawsuaatPage = lazy(() => import("@/views/MawsuaatPage"));
const ArabicLanguagePage = lazy(() => import("@/views/ArabicLanguagePage"));
const MaqasidShariaPage = lazy(() => import("@/views/MaqasidShariaPage"));
const DalailNubuwwahPage = lazy(() => import("@/views/DalailNubuwwahPage"));
const SettingsPage = lazy(() => import("@/views/SettingsPage"));
const AccountDeletionPage = lazy(() => import("@/views/AccountDeletionPage"));
const AnnualCourseDetailPage = lazy(() => import("@/pages/lessons/AnnualCourseDetailPage"));
const FiqhCouncilResolutionsPage = lazy(() => import("@/views/FiqhCouncilResolutionsPage"));
const FiqhCouncilFatwasPage = lazy(() => import("@/views/FiqhCouncilFatwasPage"));
const FiqhCouncilRecommendationsPage = lazy(() => import("@/views/FiqhCouncilRecommendationsPage"));
const FiqhCouncilResearchPage = lazy(() => import("@/views/FiqhCouncilResearchPage"));
const FiqhCouncilCategoriesPage = lazy(() => import("@/views/FiqhCouncilCategoriesPage"));
const FiqhCouncilArchivePage = lazy(() => import("@/views/FiqhCouncilArchivePage"));
const FiqhCouncilNawazilPage = lazy(() => import("@/views/FiqhCouncilNawazilPage"));
const FiqhCouncilComparePage = lazy(() => import("@/views/FiqhCouncilComparePage"));
const FiqhCouncilAdvancedSearchPage = lazy(() => import("@/views/FiqhCouncilAdvancedSearchPage"));
const FiqhCouncilResearchAssistantPage = lazy(() => import("@/views/FiqhCouncilResearchAssistantPage"));
const FiqhCouncilLivePage = lazy(() => import("@/views/FiqhCouncilLivePage"));
const FiqhCouncilSessionDetailPage = lazy(() => import("@/views/FiqhCouncilSessionDetailPage"));
const FiqhCouncilIssuesPage = lazy(() => import("@/views/FiqhCouncilIssuesPage"));
const FiqhCouncilIssueDetailPage = lazy(() => import("@/views/FiqhCouncilIssueDetailPage"));
const FiqhCouncilTopicIndexPage = lazy(() => import("@/views/FiqhCouncilTopicIndexPage"));
const FiqhCouncilStatsPage = lazy(() => import("@/views/FiqhCouncilStatsPage"));
const FiqhCouncilPage = lazy(() => import("@/views/FiqhCouncilPage"));
const FiqhCouncilItemDetailPage = lazy(() => import("@/views/FiqhCouncilItemDetailPage"));
const FiqhPage = lazy(() => import("@/pages/fiqh/FiqhPage"));
const FiqhTopicPage = lazy(() => import("@/pages/fiqh/FiqhTopicPage"));
const SeerahPage = lazy(() => import("@/views/SeerahPage"));
const RulingsPage = lazy(() => import("@/pages/fiqh/RulingsPage"));
const RulingDetailPage = lazy(() => import("@/pages/fiqh/RulingDetailPage"));
const _UpdatesPage = lazy(() => import("@/views/UpdatesPage"));
const AutoContentDetailPage = lazy(() => import("@/views/AutoContentDetailPage"));
const _KnowledgeGraphPage = lazy(() => import("@/views/KnowledgeGraphPage"));
const MindMapPage = lazy(() => import("@/views/MindMapPage"));
const IslamicLandmarksPage = lazy(() => import("@/views/IslamicLandmarksPage"));
const MutashabihatPage = lazy(() => import("@/views/MutashabihatPage"));
const QuranMemorizationPage = lazy(() => import("@/pages/quran/QuranMemorizationPage"));
const QuranMemorizationPlansPage = lazy(() => import("@/pages/quran/QuranMemorizationPlansPage"));
const IslamicScholarsPage = lazy(() => import("@/pages/library/IslamicScholarsPage"));
const ScholarProfilePage = lazy(() => import("@/pages/library/ScholarProfilePage"));
const AsmaaHusnaPage = lazy(() => import("@/views/AsmaaHusnaPage"));
const AkhlaqPage = lazy(() => import("@/views/AkhlaqPage"));
const DuasPage = lazy(() => import("@/pages/worship/DuasPage"));
const ArkanIslamPage = lazy(() => import("@/views/ArkanIslamPage"));
const ArkanImanPage = lazy(() => import("@/views/ArkanImanPage"));
const HadithSciencePage = lazy(() => import("@/pages/hadith/HadithSciencePage"));
const MadhahibPage = lazy(() => import("@/views/MadhahibPage"));
const IslamicSectsPage = lazy(() => import("@/views/IslamicSectsPage"));
const FiqhQawaidPage = lazy(() => import("@/pages/fiqh/FiqhQawaidPage"));
const ShimaelPage = lazy(() => import("@/views/ShimaelPage"));
const IslamStatsPage = lazy(() => import("@/views/IslamStatsPage"));
const IslamicGlossaryPage = lazy(() => import("@/views/IslamicGlossaryPage"));
const AdabTalabIlmPage = lazy(() => import("@/views/AdabTalabIlmPage"));
const JannaNaarPage = lazy(() => import("@/views/JannaNaarPage"));
const AlamatSaahPage = lazy(() => import("@/views/AlamatSaahPage"));
const MalaikaPage = lazy(() => import("@/views/MalaikaPage"));
const WasayaNabawiyyaPage = lazy(() => import("@/views/WasayaNabawiyyaPage"));
const RaqaiqPage = lazy(() => import("@/views/RaqaiqPage"));
const SunanYawmiyyaPage = lazy(() => import("@/views/SunanYawmiyyaPage"));
const HikamSalafPage = lazy(() => import("@/views/HikamSalafPage"));
const ZakatPage = lazy(() => import("@/pages/fiqh/ZakatPage"));
const SawmPage = lazy(() => import("@/views/SawmPage"));
const HajjPage = lazy(() => import("@/pages/fiqh/HajjPage"));
const TaharaPage = lazy(() => import("@/views/TaharaPage"));
const FadailAamalPage = lazy(() => import("@/views/FadailAamalPage"));
const JanazaPage = lazy(() => import("@/pages/fiqh/JanazaPage"));
const SahabahPage = lazy(() => import("@/views/SahabahPage"));
const TawbaPage = lazy(() => import("@/views/TawbaPage"));
const SinsAndRightsPage = lazy(() => import("@/views/SinsAndRightsPage"));
const SinsAndRightsDetailPage = lazy(() => import("@/views/SinsAndRightsDetailPage"));
const AmrBilMarufPage = lazy(() => import("@/views/AmrBilMarufPage"));
const UlumQuranPage = lazy(() => import("@/pages/quran/UlumQuranPage"));
const QuranKnowledgeHubPage = lazy(() => import("@/pages/quran/QuranKnowledgeHubPage"));
const MemorizationHubPage = lazy(() => import("@/views/MemorizationHubPage"));
const OccasionsLessonsHubPage = lazy(() => import("@/pages/lessons/OccasionsLessonsHubPage"));
const IslamicDirectoryHubPage = lazy(() => import("@/views/IslamicDirectoryHubPage"));
const TafsirPage = lazy(() => import("@/pages/quran/TafsirPage"));
const MawarithPage = lazy(() => import("@/pages/fiqh/MawarithPage"));
const MawarithCalculatorPage = lazy(() => import("@/pages/fiqh/MawarithCalculatorPage"));
const SalahGuidePage = lazy(() => import("@/pages/fiqh/SalahGuidePage"));
const DuasQuranPage = lazy(() => import("@/pages/quran/DuasQuranPage"));
const RibaPage = lazy(() => import("@/views/RibaPage"));
const NikahPage = lazy(() => import("@/pages/fiqh/NikahPage"));
const TalaqPage = lazy(() => import("@/pages/fiqh/TalaqPage"));
const UdhiyaPage = lazy(() => import("@/views/UdhiyaPage"));
const RuqyaPage = lazy(() => import("@/views/RuqyaPage"));
const JumuahPage = lazy(() => import("@/views/JumuahPage"));
const WaqfPage = lazy(() => import("@/views/WaqfPage"));
const SadaqaPage = lazy(() => import("@/views/SadaqaPage"));
const AdminPage = lazyWithRetry(() => import("@/views/AdminPage"), "AdminPage");
const LessonImportImagePage = lazyWithRetry(() => import("@/views/admin/LessonImportImagePage"), "LessonImportImagePage");
const LessonImportUrlPage = lazyWithRetry(() => import("@/views/admin/LessonImportUrlPage"), "LessonImportUrlPage");
const AutomationSourcesPage = lazyWithRetry(() => import("@/views/admin/AutomationSourcesPage"), "AutomationSourcesPage");
const AutomationReviewPage = lazyWithRetry(() => import("@/views/admin/AutomationReviewPage"), "AutomationReviewPage");
const ReviewHubPage = lazyWithRetry(() => import("@/views/admin/ReviewHubPage"), "ReviewHubPage");
const AutomationDashboardPage = lazyWithRetry(() => import("@/views/admin/AutomationDashboardPage"), "AutomationDashboardPage");
const AutomationCenterPage = lazyWithRetry(() => import("@/views/admin/AutomationCenterPage"), "AutomationCenterPage");
const AutonomousPlatformPage = lazyWithRetry(() => import("@/views/admin/AutonomousPlatformPage"), "AutonomousPlatformPage");
const InstagramIntegrationPage = lazyWithRetry(() => import("@/views/admin/InstagramIntegrationPage"), "InstagramIntegrationPage");
const MajlisKnowledgeEnginePage = lazyWithRetry(() => import("@/views/admin/MajlisKnowledgeEnginePage"), "MajlisKnowledgeEnginePage");
const AdminDashboardPage = lazyWithRetry(() => import("@/views/admin/AdminDashboardPage"), "AdminDashboardPage");
const AutoContentPage = lazyWithRetry(() => import("@/views/admin/AutoContentPage"), "AutoContentPage");
const FiqhReviewPage = lazyWithRetry(() => import("@/views/admin/FiqhReviewPage"), "FiqhReviewPage");
const FiqhQualityPage = lazyWithRetry(() => import("@/views/admin/FiqhQualityPage"), "FiqhQualityPage");
const ContentProductionDashboardPage = lazyWithRetry(
  () => import("@/views/admin/ContentProductionDashboardPage"),
  "ContentProductionDashboardPage",
);
const FeatureStatusPage = lazyWithRetry(() => import("@/views/admin/FeatureStatusPage"), "FeatureStatusPage");
const LearningPathsPage = lazy(() => import("@/views/learning/LearningPathsPage"));
const LearningPathDetailPage = lazy(() => import("@/views/learning/LearningPathDetailPage"));
const StartHerePage = lazy(() => import("@/views/StartHerePage"));
const MyLearningPage = lazy(() => import("@/pages/lessons/MyLearningPage"));
const LearningQuizPage = lazy(() => import("@/views/learning/LearningQuizPage"));
const CertificateVerifyPage = lazy(() => import("@/views/learning/CertificateVerifyPage"));
const LearnHubPage = lazy(() => import("@/views/learn/LearnHubPage"));
const LearnCategoryPage = lazy(() => import("@/views/learn/LearnCategoryPage"));
const LearnSeriesPage = lazy(() => import("@/views/learn/LearnSeriesPage"));
const LearnLessonPage = lazy(() => import("@/views/learn/LearnLessonPage"));
const AdhanSettingsPage = lazy(() => import("@/pages/worship/AdhanSettingsPage"));
const UploadPage = lazy(() => import("@/views/UploadPage"));
const MySubmissionsPage = lazy(() => import("@/views/MySubmissionsPage"));
const UserStatsPage = lazy(() => import("@/views/UserStatsPage"));
const ReadingPlansPage = lazy(() => import("@/pages/library/ReadingPlansPage"));
const FlashCardsPage = lazy(() => import("@/views/FlashCardsPage"));
const MemorizePage = lazy(() => import("@/views/MemorizePage"));
const CarModePage = lazy(() => import("@/views/CarModePage"));
const MosqueModePage = lazy(() => import("@/views/MosqueModePage"));
const NotificationSettingsPage = lazy(() => import("@/views/NotificationSettingsPage"));
const StudyRoomPage = lazy(() => import("@/views/StudyRoomPage"));
const FamilyModePage = lazy(() => import("@/views/FamilyModePage"));
const VaultPage = lazy(() => import("@/views/VaultPage"));
const ResearcherProfilePage = lazy(() => import("@/views/ResearcherProfilePage"));
const InstitutionsPage = lazy(() => import("@/views/InstitutionsPage"));
const AuthCallbackPage = lazy(() => import("@/views/AuthCallbackPage"));
const UpdatePasswordPage = lazy(() => import("@/views/UpdatePasswordPage"));
const ProphetStoriesPage = lazy(() => import("@/views/ProphetStoriesPage"));
const NationsPage = lazy(() => import("@/views/NationsPage"));
const NationDetailPage = lazy(() => import("@/views/NationDetailPage"));
const ProphetsFamilyTreePage = lazy(() => import("@/views/ProphetsFamilyTreePage"));
const IslamicStoriesPage = lazy(() => import("@/views/IslamicStoriesPage"));
const CitationPublicPage = lazy(() => import("@/views/CitationPublicPage"));
const MethodologyPage = lazy(() => import("@/views/MethodologyPage"));
const MyCitationsPage = lazy(() => import("@/views/MyCitationsPage"));
// ScholarlyResearchPage عُطِّلت 2026-07-23 — الاستيراد الكسول أُزيل (لم يعد
// يُستهلَك)؛ ملف المكوّن نفسه باقٍ بلا حذف (راجع feature-registry.ts).
const _AcademicResearchPage  = lazy(() => import("@/views/AcademicResearchPage"));
const ResearchDetailPage    = lazy(() => import("@/views/ResearchDetailPage"));
const ResearchSubmitPage    = lazy(() => import("@/views/ResearchSubmitPage"));
const ResearchAssistantPage = lazy(() => import("@/views/ResearchAssistantPage"));
const UniversitiesPage = lazy(() => import("@/views/UniversitiesPage"));
const UniversityDetailPage = lazy(() => import("@/views/UniversityDetailPage"));
const UniversitiesComparePage = lazy(() => import("@/views/UniversitiesComparePage"));
const UniversitiesAdminPage = lazyWithRetry(() => import("@/views/admin/UniversitiesAdminPage"), "UniversitiesAdminPage");

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

/* وجهات شريط الأقسام العلوي (TopSectionBar) — التبديل بينها يُعامَل معاملة
   "الرجوع" (استعادة آخر موضع تمرير)، لا "تنقّل للأمام" (تمرير للأعلى)،
   لأن المستخدم يُنهي غالبًا جولة في قسم ثم يعود إليه لاحقًا عبر تبويبه. */
const SECTION_BAR_PATHS = new Set(["/", "/mushaf", "/memorize", "/quran-knowledge", "/hadith", "/fiqh", "/memorization", "/occasions-lessons", "/islamic-directory", "/prayer-times", "/my-learning"]);

/**
 * كان يفرض scrollTo(0,0) على كل تغيير مسار بلا استثناء، فيُفقِد موضع
 * التمرير حتى عند الرجوع (زر الرجوع العام أو زر رجوع المتصفح) — طلب صريح
 * من المالك بحفظ حالة الصفحة (تمرير) عند الرجوع. الآن: يميّز بين تنقّل
 * "للأمام" (رابط/بطاقة جديدة → تمرير للأعلى كالمعتاد) و"للخلف" (popstate،
 * أو التبديل بين أقسام TopSectionBar → استعادة آخر موضع تمرير محفوظ لذلك
 * المسار من sessionStorage).
 */
function ScrollResetOnNav() {
  const [location] = useLocation();
  const isPopRef = useRef(false);
  const lastLocationRef = useRef(location);

  useEffect(() => {
    const onPopState = () => { isPopRef.current = true; };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    const leavingLocation = lastLocationRef.current;
    recordNavigationVisit(location, isPopRef.current ? "pop" : "push");
    if (leavingLocation !== location) {
      try {
        sessionStorage.setItem(`scroll-pos:${leavingLocation}`, String(window.scrollY));
      } catch { /* sessionStorage غير متاح (وضع خاص مثلًا) — تجاهل بأمان */ }
    }
    lastLocationRef.current = location;

    const shouldRestore = isPopRef.current || SECTION_BAR_PATHS.has(location);
    isPopRef.current = false;
    if (shouldRestore) {
      const saved = sessionStorage.getItem(`scroll-pos:${location}`);
      if (saved != null) {
        const top = Number(saved);
        requestAnimationFrame(() => window.scrollTo({ top, left: 0, behavior: "instant" }));
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location]);

  return null;
}

function IslamicReminderBootstrap() {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    const prefs = loadNotifPrefs();
    if (prefs.enabled) scheduleIslamicReminder();
    // تأجير تلقائي: نُرسل مرة بعد 30 دقيقة من فتح التطبيق
    const t = setTimeout(() => {
      const p = loadNotifPrefs();
      if (p.enabled) scheduleIslamicReminder();
    }, 30 * 60 * 1000);
    return () => clearTimeout(t);
  }, []);
  return null;
}

function AdhanSchedulerBootstrap() {
  const { data } = usePrayerCountdown();
  const started = useRef(false);
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
    if (started.current) return;
    started.current = true;
    startAdhanScheduler(data).catch(() => {});
  }, [data]);
  return null;
}

/**
 * يُشغِّل منسّق تنبيه الصلاة (شريط + إشعار محلي + Live Activity) عند تحميل
 * أوقات الصلاة، ويُعيد فحص النافذة الحالية فوراً عند عودة التطبيق للواجهة
 * (مثلاً بعد إغلاقه في الخلفية لدقائق ثم فتحه من جديد داخل نافذة الـ١٥ دقيقة).
 */
function PrayerAlertSchedulerBootstrap() {
  const { data } = usePrayerCountdown();
  useEffect(() => {
    if (!data) return;
    startPrayerAlertScheduler(data).catch(() => {});
  }, [data]);

  useEffect(() => {
    const rescheduleOnForeground = () => {
      // force: يعيد جدولة الإشعار الأصلي بعد الخلفية/إعادة التشغيل بلا تكرار خاطئ.
      void recheckPrayerAlertWindow(data, { force: true });
      void import("@/lib/quran-daily-reminder").then(({ ensureQuranDailyReminderScheduled }) => {
        void ensureQuranDailyReminderScheduled();
      });
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") rescheduleOnForeground();
    };
    const onPrefsChanged = () => {
      invalidatePrayerNativeSchedule();
      void recheckPrayerAlertWindow(data, { force: true });
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener(PRAYER_ALERT_PREFS_CHANGED_EVENT, onPrefsChanged);

    // iOS WKWebView: appStateChange أوثق من visibilitychange في بعض مسارات الخلفية→المقدمة.
    let removeAppState: (() => void) | undefined;
    void import("@/lib/capacitor-utils").then(({ isNative }) => {
      if (!isNative) return;
      void import("@capacitor/app").then(({ App: CapApp }) => {
        const sub = CapApp.addListener("appStateChange", ({ isActive }) => {
          if (isActive) rescheduleOnForeground();
        });
        void Promise.resolve(sub).then((handle) => {
          removeAppState = () => {
            void handle.remove();
          };
        });
      }).catch(() => {});
    });

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener(PRAYER_ALERT_PREFS_CHANGED_EVENT, onPrefsChanged);
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

function SafeLazyRoute({ component: Component }: { component: ComponentType<any> }) {
  // useParams يُعيد params المسار الحالي (مثل { id } أو { slug })
  // ويُمرَّر كـ prop "params" لجميع صفحات التفاصيل
  const params = useParams();
  return (
    <ErrorBoundary>
      <Suspense fallback={<LazyRouteFallback />}>
        <Component params={params} />
      </Suspense>
    </ErrorBoundary>
  );
}

function AdminLazyRoute({ component: Component }: { component: ComponentType }) {
  return (
    <AdminRouteGuard>
      <ErrorBoundary>
        <Suspense fallback={<LazyRouteFallback />}>
          <Component />
        </Suspense>
      </ErrorBoundary>
    </AdminRouteGuard>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <SafeLazyRoute component={HomePage} />
      </Route>
      <Route path="/quran-engine/viewer"><SafeLazyRoute component={QuranEnginePage} /></Route>
      <Route path="/quran-engine"><SafeLazyRoute component={QuranEnginePage} /></Route>
      <Route path="/about-us"><SafeLazyRoute component={AboutUsPage} /></Route>
      <Route path="/who-we-are"><Redirect to="/about-us" /></Route>
      <Route path="/man-nahnu"><Redirect to="/about-us" /></Route>
      <Route path="/about"><SafeLazyRoute component={AboutPage} /></Route>
      <Route path="/sources"><SafeLazyRoute component={SourcesLicensesPage} /></Route>
      <Route path="/sources-licenses"><Redirect to="/sources" /></Route>
      <Route path="/licenses"><Redirect to="/sources" /></Route>
      <Route path="/methodology"><SafeLazyRoute component={MethodologyPage} /></Route>
      <Route path="/fatwa-policy"><SafeLazyRoute component={FatwaPolicyPage} /></Route>
      <Route path="/sitemap"><SafeLazyRoute component={SiteMapPage} /></Route>
      <Route path="/privacy"><SafeLazyRoute component={PrivacyPage} /></Route>
      <Route path="/privacy-center"><SafeLazyRoute component={PrivacyCenterPage} /></Route>
      <Route path="/privacy-policy"><Redirect to="/privacy" /></Route>
      <Route path="/terms"><SafeLazyRoute component={TermsPage} /></Route>
      <Route path="/account-deletion"><SafeLazyRoute component={AccountDeletionPage} /></Route>
      <Route path="/delete-account"><Redirect to="/account-deletion" /></Route>
      <Route path="/contact"><SafeLazyRoute component={ContactPage} /></Route>
      <Route path="/support"><Redirect to="/contact" /></Route>
      <Route path="/settings"><SafeLazyRoute component={SettingsPage} /></Route>
      <Route path="/search/:q"><SafeLazyRoute component={SearchPage} /></Route>
      <Route path="/search"><SafeLazyRoute component={SearchPage} /></Route>
      <Route path="/topics/:slug"><SafeLazyRoute component={TopicPage} /></Route>
      <Route path="/topics"><SafeLazyRoute component={TopicsIndexPage} /></Route>
      <Route path="/scientific-announcements/:id"><SafeLazyRoute component={ScientificAnnouncementDetailPage} /></Route>
      <Route path="/lessons/current"><Redirect to="/lessons" /></Route>
      <Route path="/lessons/archive"><SafeLazyRoute component={LessonsArchivePage} /></Route>
      <Route path="/lessons"><SafeLazyRoute component={LessonsPage} /></Route>
      <Route path="/lessons/:id"><SafeLazyRoute component={LessonDetailPage} /></Route>
      <Route path="/teachers/:slug"><SafeLazyRoute component={TeacherDetailPage} /></Route>
      <Route path="/teachers"><SafeLazyRoute component={TeachersIndexPage} /></Route>
      <Route path="/calendar"><SafeLazyRoute component={CalendarPage} /></Route>
      <Route path="/kuwait-lessons"><SafeLazyRoute component={KuwaitLessonsPage} /></Route>
      <Route path="/announcements"><Redirect to="/lessons" /></Route>
      <Route path="/courses"><Redirect to="/lessons?tab=courses" /></Route>
      <Route path="/sheikhs/:id"><Redirect to="/lessons" /></Route>
      <Route path="/sheikhs"><Redirect to="/lessons" /></Route>
      <Route path="/library/:id"><SafeLazyRoute component={LibraryDetailPage} /></Route>
      <Route path="/library"><Redirect to="/" /></Route>
      <Route path="/miracles"><SafeLazyRoute component={MiraclesPage} /></Route>
      <Route path="/prophetic-medicine"><SafeLazyRoute component={PropheticMedicinePage} /></Route>
      <Route path="/quran-circles"><SafeLazyRoute component={QuranCirclesPage} /></Route>
      <Route path="/fawaid"><SafeLazyRoute component={FawaidPage} /></Route>
      <Route path="/hadith/books"><SafeLazyRoute component={HadithBooksPage} /></Route>
      <Route path="/hadith/books-and-rulings"><SafeLazyRoute component={HadithBooksAndRulingsPage} /></Route>
      <Route path="/hadith/arbaeen-love-of-allah"><SafeLazyRoute component={ArbaeenLovePage} /></Route>
      <Route path="/hadith/sahih"><SafeLazyRoute component={HadithSahihPage} /></Route>
      <Route path="/hadith/daif"><SafeLazyRoute component={HadithDaifPage} /></Route>
      <Route path="/hadith/mawdu"><SafeLazyRoute component={HadithMawduPage} /></Route>
      <Route path="/hadith"><SafeLazyRoute component={HadithPage} /></Route>
      <Route path="/stories"><SafeLazyRoute component={IslamicStoriesPage} /></Route>
      <Route path="/nations/:slug"><SafeLazyRoute component={NationDetailPage} /></Route>
      <Route path="/nations"><SafeLazyRoute component={NationsPage} /></Route>
      <Route path="/prophet-stories/:slug"><SafeLazyRoute component={ProphetStoriesPage} /></Route>
      <Route path="/prophet-stories"><Redirect to="/prophets" /></Route>
      <Route path="/prophets/tree"><SafeLazyRoute component={ProphetsFamilyTreePage} /></Route>
      <Route path="/prophets/:slug"><SafeLazyRoute component={ProphetStoriesPage} /></Route>
      <Route path="/prophets"><SafeLazyRoute component={ProphetStoriesPage} /></Route>
      <Route path="/islamic-stories"><Redirect to="/stories" /></Route>
      <Route path="/adhkar/:slug"><SafeLazyRoute component={AdhkarPage} /></Route>
      <Route path="/adhkar"><SafeLazyRoute component={AdhkarPage} /></Route>
      <Route path="/qa"><SafeLazyRoute component={QaPage} /></Route>
      <Route path="/quiz"><SafeLazyRoute component={QuizPage} /></Route>
      <Route path="/knowledge-graph"><Redirect to="/" /></Route>
      <Route path="/knowledge-map"><Redirect to="/" /></Route>
      <Route path="/mind-map"><SafeLazyRoute component={MindMapPage} /></Route>
      <Route path="/islamic-landmarks"><SafeLazyRoute component={IslamicLandmarksPage} /></Route>
      <Route path="/mutashabihat"><SafeLazyRoute component={MutashabihatPage} /></Route>
      <Route path="/scholars/:id"><SafeLazyRoute component={ScholarProfilePage} /></Route>
      <Route path="/scholars"><SafeLazyRoute component={IslamicScholarsPage} /></Route>
      <Route path="/asma-husna"><SafeLazyRoute component={AsmaaHusnaPage} /></Route>
      <Route path="/akhlaq"><SafeLazyRoute component={AkhlaqPage} /></Route>
      <Route path="/duas"><SafeLazyRoute component={DuasPage} /></Route>
      <Route path="/arkan"><SafeLazyRoute component={ArkanIslamPage} /></Route>
      <Route path="/arkan-iman"><SafeLazyRoute component={ArkanImanPage} /></Route>
      <Route path="/hadith-science"><SafeLazyRoute component={HadithSciencePage} /></Route>
      <Route path="/madhahib"><SafeLazyRoute component={MadhahibPage} /></Route>
      <Route path="/islamic-sects"><SafeLazyRoute component={IslamicSectsPage} /></Route>
      <Route path="/fiqh-qawaid"><SafeLazyRoute component={FiqhQawaidPage} /></Route>
      <Route path="/shamael"><SafeLazyRoute component={ShimaelPage} /></Route>
      <Route path="/islam-stats"><SafeLazyRoute component={IslamStatsPage} /></Route>
      <Route path="/glossary"><Redirect to="/islamic-glossary" /></Route>
      <Route path="/islamic-glossary"><SafeLazyRoute component={IslamicGlossaryPage} /></Route>
      <Route path="/adab-talab-ilm"><SafeLazyRoute component={AdabTalabIlmPage} /></Route>
      <Route path="/anbiya"><Redirect to="/prophets" /></Route>
      <Route path="/janna-naar"><SafeLazyRoute component={JannaNaarPage} /></Route>
      <Route path="/alamat-saah"><SafeLazyRoute component={AlamatSaahPage} /></Route>
      <Route path="/malaika"><SafeLazyRoute component={MalaikaPage} /></Route>
      <Route path="/wasaya-nabawiyya"><SafeLazyRoute component={WasayaNabawiyyaPage} /></Route>
      <Route path="/raqaiq"><SafeLazyRoute component={RaqaiqPage} /></Route>
      <Route path="/sunan-yawmiyya"><SafeLazyRoute component={SunanYawmiyyaPage} /></Route>
      <Route path="/hikam-salaf"><SafeLazyRoute component={HikamSalafPage} /></Route>
      <Route path="/zakat"><SafeLazyRoute component={ZakatPage} /></Route>
      <Route path="/sawm"><SafeLazyRoute component={SawmPage} /></Route>
      <Route path="/hajj"><SafeLazyRoute component={HajjPage} /></Route>
      <Route path="/tahara"><SafeLazyRoute component={TaharaPage} /></Route>
      <Route path="/fadail-aamal"><SafeLazyRoute component={FadailAamalPage} /></Route>
      <Route path="/janaza"><SafeLazyRoute component={JanazaPage} /></Route>
      <Route path="/sahabah"><SafeLazyRoute component={SahabahPage} /></Route>
      <Route path="/tawba"><SafeLazyRoute component={TawbaPage} /></Route>
      <Route path="/sins-and-rights"><SafeLazyRoute component={SinsAndRightsPage} /></Route>
      <Route path="/sins-and-rights/:slug"><SafeLazyRoute component={SinsAndRightsDetailPage} /></Route>
      <Route path="/amr-bil-maruf"><SafeLazyRoute component={AmrBilMarufPage} /></Route>
      <Route path="/ulum-quran"><SafeLazyRoute component={UlumQuranPage} /></Route>
      <Route path="/tafsir"><SafeLazyRoute component={TafsirPage} /></Route>
      <Route path="/quran/tafsir"><Redirect to="/tafsir" /></Route>
      <Route path="/mawarith"><SafeLazyRoute component={MawarithPage} /></Route>
      <Route path="/mawarith/calculator"><SafeLazyRoute component={MawarithCalculatorPage} /></Route>
      <Route path="/salah-guide"><SafeLazyRoute component={SalahGuidePage} /></Route>
      <Route path="/jumuah"><SafeLazyRoute component={JumuahPage} /></Route>
      <Route path="/riba"><SafeLazyRoute component={RibaPage} /></Route>
      <Route path="/nikah"><SafeLazyRoute component={NikahPage} /></Route>
      <Route path="/talaq"><SafeLazyRoute component={TalaqPage} /></Route>
      <Route path="/udhiya"><SafeLazyRoute component={UdhiyaPage} /></Route>
      <Route path="/ruqya"><SafeLazyRoute component={RuqyaPage} /></Route>
      <Route path="/waqf"><SafeLazyRoute component={WaqfPage} /></Route>
      <Route path="/sadaqa"><SafeLazyRoute component={SadaqaPage} /></Route>
      <Route path="/duas-quran"><SafeLazyRoute component={DuasQuranPage} /></Route>
      <Route path="/submit"><SafeLazyRoute component={SubmitContentPage} /></Route>
      <Route path="/upload"><SafeLazyRoute component={UploadPage} /></Route>
      <Route path="/my-submissions"><SafeLazyRoute component={MySubmissionsPage} /></Route>
      <Route path="/stats"><SafeLazyRoute component={UserStatsPage} /></Route>
      <Route path="/profile"><SafeLazyRoute component={UserStatsPage} /></Route>
      <Route path="/learning-plan"><Redirect to="/learning/paths" /></Route>
      <Route path="/reading-plans"><SafeLazyRoute component={ReadingPlansPage} /></Route>
      <Route path="/flashcards"><SafeLazyRoute component={FlashCardsPage} /></Route>
      <Route path="/memorize"><SafeLazyRoute component={MemorizePage} /></Route>
      <Route path="/car-mode"><SafeLazyRoute component={CarModePage} /></Route>
      <Route path="/mosque-mode"><SafeLazyRoute component={MosqueModePage} /></Route>
      <Route path="/notification-settings"><SafeLazyRoute component={NotificationSettingsPage} /></Route>
      <Route path="/study-room"><SafeLazyRoute component={StudyRoomPage} /></Route>
      <Route path="/family"><SafeLazyRoute component={FamilyModePage} /></Route>
      <Route path="/family-mode"><Redirect to="/family" /></Route>
      <Route path="/vault"><SafeLazyRoute component={VaultPage} /></Route>
      <Route path="/researcher"><SafeLazyRoute component={ResearcherProfilePage} /></Route>
      <Route path="/researcher-profile"><SafeLazyRoute component={ResearcherProfilePage} /></Route>
      <Route path="/institutions"><SafeLazyRoute component={InstitutionsPage} /></Route>
      <Route path="/auth/callback"><SafeLazyRoute component={AuthCallbackPage} /></Route>
      <Route path="/auth/update-password"><SafeLazyRoute component={UpdatePasswordPage} /></Route>
      <Route path="/learning/paths/:slug"><SafeLazyRoute component={LearningPathDetailPage} /></Route>
      <Route path="/learning/paths"><SafeLazyRoute component={LearningPathsPage} /></Route>
      <Route path="/learn/series/:slug"><SafeLazyRoute component={LearnSeriesPage} /></Route>
      <Route path="/learn/lesson/:id"><SafeLazyRoute component={LearnLessonPage} /></Route>
      <Route path="/learn/:slug"><SafeLazyRoute component={LearnCategoryPage} /></Route>
      <Route path="/learn"><SafeLazyRoute component={LearnHubPage} /></Route>
      <Route path="/learning/quiz/:slug"><SafeLazyRoute component={LearningQuizPage} /></Route>
      <Route path="/learning/quiz"><Redirect to="/quiz" /></Route>
      <Route path="/learning/calendar"><Redirect to="/calendar" /></Route>
      <Route path="/learning/certificates"><SafeLazyRoute component={CertificateVerifyPage} /></Route>
      <Route path="/learning/certificates/:code"><SafeLazyRoute component={CertificateVerifyPage} /></Route>
      <Route path="/my-learning"><SafeLazyRoute component={MyLearningPage} /></Route>
      <Route path="/my-citations"><SafeLazyRoute component={MyCitationsPage} /></Route>
      <Route path="/c/:slug"><SafeLazyRoute component={CitationPublicPage} /></Route>
      <Route path="/learning"><Redirect to="/learning/paths" /></Route>
      <Route path="/assistant">
        <ErrorBoundary>
          <Suspense fallback={<LazyRouteFallback />}>
            <AssistantPage />
          </Suspense>
        </ErrorBoundary>
      </Route>
      {/* عُطِّلت 2026-07-23: توجيه دائم إلى الأسئلة والأجوبة، وvercel.json يوجّه
          الطلبات المباشرة على مستوى الخادم بنفس الوجهة. */}
      <Route path="/scholarly-research"><Redirect to="/qa" /></Route>
      <Route path="/academic-research/submit"><SafeLazyRoute component={ResearchSubmitPage} /></Route>
      <Route path="/academic-research/assistant"><SafeLazyRoute component={ResearchAssistantPage} /></Route>
      <Route path="/academic-research/:id"><SafeLazyRoute component={ResearchDetailPage} /></Route>
      <Route path="/academic-research"><Redirect to="/" /></Route>
      <Route path="/researches"><Redirect to="/" /></Route>
      <Route path="/sharia-research"><Redirect to="/" /></Route>
      <Route path="/learning-path/dashboard"><Redirect to="/my-learning" /></Route>
      <Route path="/learning-path/book/:bookId"><Redirect to="/learning/paths" /></Route>
      <Route path="/learning-path/:scienceSlug"><Redirect to="/learning/paths" /></Route>
      <Route path="/learning-path"><Redirect to="/learning/paths" /></Route>
      <Route path="/start-here"><SafeLazyRoute component={StartHerePage} /></Route>
      <Route path="/universities/compare"><SafeLazyRoute component={UniversitiesComparePage} /></Route>
      <Route path="/universities/:slug"><SafeLazyRoute component={UniversityDetailPage} /></Route>
      <Route path="/universities"><SafeLazyRoute component={UniversitiesPage} /></Route>
      <Route path="/condolences"><Redirect to="/" /></Route>
      <Route path="/transcribe">
        <ErrorBoundary>
          <Suspense fallback={<LazyRouteFallback />}>
            <TranscribePage />
          </Suspense>
        </ErrorBoundary>
      </Route>
      <Route path="/quran"><Redirect to="/mushaf" /></Route>
      {/* المصحف متوقف مؤقتًا — كل مساراته تعرض صفحة «قريبًا» */}
      <Route path="/mushaf/page/:page"><SafeLazyRoute component={MushafComingSoonPage} /></Route>
      <Route path="/mushaf/page"><SafeLazyRoute component={MushafComingSoonPage} /></Route>
      <Route path="/mushaf/about-edition"><SafeLazyRoute component={MushafComingSoonPage} /></Route>
      <Route path="/mushaf/:surah"><SafeLazyRoute component={MushafComingSoonPage} /></Route>
      <Route path="/mushaf"><SafeLazyRoute component={MushafComingSoonPage} /></Route>
      <Route path="/mushaf-v2-preview"><Redirect to="/mushaf" /></Route>
      <Route path="/quran-hub"><Redirect to="/mushaf" /></Route>
      <Route path="/quran-knowledge"><SafeLazyRoute component={QuranKnowledgeHubPage} /></Route>
      <Route path="/memorization"><SafeLazyRoute component={MemorizationHubPage} /></Route>
      <Route path="/occasions-lessons"><SafeLazyRoute component={OccasionsLessonsHubPage} /></Route>
      <Route path="/islamic-directory"><SafeLazyRoute component={IslamicDirectoryHubPage} /></Route>
      <Route path="/quran-index"><Redirect to="/quran-knowledge" /></Route>
      <Route path="/asbab-al-nuzul"><Redirect to="/quran-knowledge" /></Route>
      <Route path="/quran-stories"><Redirect to="/quran-knowledge" /></Route>
      <Route path="/memorization-tests"><Redirect to="/memorization" /></Route>
      <Route path="/memorization-plans"><Redirect to="/memorization" /></Route>
      <Route path="/islamic-institutions"><Redirect to="/islamic-directory" /></Route>
      <Route path="/mosques"><Redirect to="/islamic-directory" /></Route>
      <Route path="/reviewed-cards"><Redirect to="/my-learning" /></Route>
      <Route path="/scientific-library"><Redirect to="/" /></Route>
      <Route path="/latest"><Redirect to="/" /></Route>
      <Route path="/fatwas"><Redirect to="/fiqh" /></Route>
      <Route path="/explore"><Redirect to="/" /></Route>
      <Route path="/news"><Redirect to="/" /></Route>
      <Route path="/events"><Redirect to="/occasions-lessons" /></Route>
      <Route path="/islamic-events"><Redirect to="/occasions-lessons" /></Route>
      <Route path="/lesson-calendar"><Redirect to="/occasions-lessons" /></Route>
      <Route path="/review-plans"><Redirect to="/memorization" /></Route>
      <Route path="/masajid"><Redirect to="/islamic-directory" /></Route>
      <Route path="/quran-sciences"><Redirect to="/quran-knowledge" /></Route>

      <Route path="/research"><Redirect to="/" /></Route>

      <Route path="/kids"><SafeLazyRoute component={KidsPage} /></Route>
      <Route path="/quran/recitation-test-ai"><SafeLazyRoute component={RecitationTestPage} /></Route>
      <Route path="/quran/surahs"><SafeLazyRoute component={SurahIndexPage} /></Route>
      <Route path="/quran/search"><SafeLazyRoute component={QuranSearchPage} /></Route>
      <Route path="/quran/revelation-order"><SafeLazyRoute component={RevelationOrderPage} /></Route>
      <Route path="/quran/makki-madani"><SafeLazyRoute component={MakkiMadaniPage} /></Route>
      <Route path="/quran-memorization"><SafeLazyRoute component={QuranMemorizationPage} /></Route>
      <Route path="/quran/memorization-plans"><SafeLazyRoute component={QuranMemorizationPlansPage} /></Route>
      <Route path="/tajweed"><SafeLazyRoute component={QuranTajweedPage} /></Route>
      <Route path="/surah-stories"><Redirect to="/quran/surah-stories" /></Route>
      <Route path="/quran/tajweed"><SafeLazyRoute component={QuranTajweedPage} /></Route>
      {/* مسارات الاختصار — public redirects */}
      <Route path="/research"><Redirect to="/fiqh-council/research" /></Route>
      {/* الفقه الإسلامي الموحّد + السيرة النبوية */}
      <Route path="/tawhid"><SafeLazyRoute component={TawhidPage} /></Route>
      <Route path="/discover-islam"><SafeLazyRoute component={DiscoverIslamPage} /></Route>
      <Route path="/discover-islam/questions"><SafeLazyRoute component={DiscoverIslamQuestionsPage} /></Route>
      <Route path="/discover-islam/questions/:slug"><SafeLazyRoute component={DiscoverIslamQuestionDetailPage} /></Route>
      <Route path="/discover-islam/doubts"><SafeLazyRoute component={DiscoverIslamDoubtsPage} /></Route>
      <Route path="/discover-islam/doubts/:slug"><SafeLazyRoute component={DiscoverIslamDoubtDetailPage} /></Route>
      <Route path="/discover-islam/articles/:slug"><SafeLazyRoute component={DiscoverIslamArticleDetailPage} /></Route>
      <Route path="/discover-islam/how-to-convert"><SafeLazyRoute component={HowToBecomeMuslimPage} /></Route>
      <Route path="/discover-islam/new-muslim"><SafeLazyRoute component={NewMuslimPathPage} /></Route>
      <Route path="/discover-islam/new-muslim/:day"><SafeLazyRoute component={NewMuslimDayDetailPage} /></Route>
      <Route path="/discover-islam/contact"><SafeLazyRoute component={DiscoverIslamContactPage} /></Route>
      <Route path="/fiqh/topics/:topicId"><SafeLazyRoute component={FiqhTopicPage} /></Route>
      <Route path="/fiqh"><SafeLazyRoute component={FiqhPage} /></Route>
      <Route path="/seerah"><SafeLazyRoute component={SeerahPage} /></Route>
      <Route path="/quran/surah-stories/:number"><SafeLazyRoute component={SurahStoryDetailRoute} /></Route>
      <Route path="/quran/surah-stories"><SafeLazyRoute component={SurahStoriesPage} /></Route>
      <Route path="/prayer-times"><SafeLazyRoute component={PrayerTimesPage} /></Route>
      <Route path="/prayer-countdown"><Redirect to="/prayer-times" /></Route>
      <Route path="/prayer-ranks"><SafeLazyRoute component={PrayerRanksPage} /></Route>
      <Route path="/muezzins/:rest"><Redirect to="/adhan-settings" /></Route>
      <Route path="/muezzins"><Redirect to="/adhan-settings" /></Route>
      <Route path="/adhan-settings"><SafeLazyRoute component={AdhanSettingsPage} /></Route>
      <Route path="/qibla"><SafeLazyRoute component={QiblaPage} /></Route>
      <Route path="/tasbih"><SafeLazyRoute component={TasbihPage} /></Route>
      <Route path="/daily-wird"><SafeLazyRoute component={DailyWirdPage} /></Route>
      <Route path="/occasions"><SafeLazyRoute component={OccasionsPage} /></Route>
      <Route path="/features-in-progress"><Redirect to="/" /></Route>
      <Route path="/arbaeen-nawawi/:id"><SafeLazyRoute component={ArbaeenHadithDetailPage} /></Route>
      <Route path="/arbaeen-nawawi"><SafeLazyRoute component={ArbaeenNawawiPage} /></Route>
      <Route path="/sujood-sahw"><SafeLazyRoute component={SujoodSahwPage} /></Route>
      <Route path="/amrad-qalbiyya"><SafeLazyRoute component={AmradQalbiyyaPage} /></Route>
      <Route path="/durus-imaniyya"><SafeLazyRoute component={DurusImaniyyaPage} /></Route>
      <Route path="/durus-mutanawwia"><SafeLazyRoute component={DurusMutanawwiaPage} /></Route>
      <Route path="/iman-topics"><SafeLazyRoute component={ImanTopicsPage} /></Route>
      <Route path="/quran-studies"><Redirect to="/ulum-quran" /></Route>
      <Route path="/sunnah-studies"><SafeLazyRoute component={SunnahStudiesPage} /></Route>
      <Route path="/tazkiya-topics"><SafeLazyRoute component={TazkiyaTopicsPage} /></Route>
      <Route path="/tarikh-islami"><SafeLazyRoute component={TarikhIslamiPage} /></Route>
      <Route path="/usra-mujtama"><SafeLazyRoute component={UsraMujtamaPage} /></Route>
      <Route path="/fikr-waqia"><SafeLazyRoute component={FikrWaqiaPage} /></Route>
      <Route path="/mawsuaat"><SafeLazyRoute component={MawsuaatPage} /></Route>
      <Route path="/arabic-language"><SafeLazyRoute component={ArabicLanguagePage} /></Route>
      <Route path="/maqasid-sharia"><SafeLazyRoute component={MaqasidShariaPage} /></Route>
      <Route path="/dalail-nubuwwah"><SafeLazyRoute component={DalailNubuwwahPage} /></Route>
      <Route path="/masarat"><Redirect to="/learning/paths" /></Route>
      <Route path="/cards"><SafeLazyRoute component={CardsPage} /></Route>
      <Route path="/annual-courses/:id"><SafeLazyRoute component={AnnualCourseDetailPage} /></Route>
      <Route path="/annual-courses"><Redirect to="/lessons?tab=courses" /></Route>
      <Route path="/fiqh-council/sessions/:slug"><SafeLazyRoute component={FiqhCouncilSessionDetailPage} /></Route>
      <Route path="/fiqh-council/live"><SafeLazyRoute component={FiqhCouncilLivePage} /></Route>
      <Route path="/fiqh-council/issues/:slug"><SafeLazyRoute component={FiqhCouncilIssueDetailPage} /></Route>
      <Route path="/fiqh-council/issues"><SafeLazyRoute component={FiqhCouncilIssuesPage} /></Route>
      <Route path="/fiqh-council/index"><SafeLazyRoute component={FiqhCouncilTopicIndexPage} /></Route>
      <Route path="/fiqh-council/stats"><SafeLazyRoute component={FiqhCouncilStatsPage} /></Route>
      <Route path="/fiqh-council/resolutions"><SafeLazyRoute component={FiqhCouncilResolutionsPage} /></Route>
      <Route path="/fiqh-council/fatwas"><SafeLazyRoute component={FiqhCouncilFatwasPage} /></Route>
      <Route path="/fiqh-council/recommendations"><SafeLazyRoute component={FiqhCouncilRecommendationsPage} /></Route>
      <Route path="/fiqh-council/nawazil"><SafeLazyRoute component={FiqhCouncilNawazilPage} /></Route>
      <Route path="/fiqh-council/research"><SafeLazyRoute component={FiqhCouncilResearchPage} /></Route>
      <Route path="/fiqh-council/categories"><SafeLazyRoute component={FiqhCouncilCategoriesPage} /></Route>
      <Route path="/fiqh-council/search"><SafeLazyRoute component={FiqhCouncilAdvancedSearchPage} /></Route>
      <Route path="/fiqh-council/research-assistant"><SafeLazyRoute component={FiqhCouncilResearchAssistantPage} /></Route>
      <Route path="/fiqh-council/compare"><SafeLazyRoute component={FiqhCouncilComparePage} /></Route>
      <Route path="/fiqh-council/archive"><SafeLazyRoute component={FiqhCouncilArchivePage} /></Route>
      <Route path="/fiqh-council/:slug"><SafeLazyRoute component={FiqhCouncilItemDetailPage} /></Route>
      <Route path="/fiqh-council"><SafeLazyRoute component={FiqhCouncilPage} /></Route>
      <Route path="/fatwa/:id">
        {(params) => <Redirect to={`/rulings/${params.id}`} />}
      </Route>
      <Route path="/fatwa"><Redirect to="/fiqh" /></Route>
      <Route path="/rulings/:id"><SafeLazyRoute component={RulingDetailPage} /></Route>
      <Route path="/rulings"><SafeLazyRoute component={RulingsPage} /></Route>
      <Route path="/updates/auto/:slug"><SafeLazyRoute component={AutoContentDetailPage} /></Route>
      <Route path="/updates"><Redirect to="/" /></Route>
      <Route path="/whats-new"><Redirect to="/" /></Route>
      <Route path="/login"><SafeLazyRoute component={LoginPage} /></Route>
      <Route path="/register"><SafeLazyRoute component={RegisterPage} /></Route>
      <Route path="/auth/register"><Redirect to="/register" /></Route>
      <Route path="/admin/sources"><AdminLazyRoute component={AutomationSourcesPage} /></Route>
      <Route path="/admin/automation/sources"><AdminLazyRoute component={AutomationSourcesPage} /></Route>
      <Route path="/admin/automation/dashboard"><AdminLazyRoute component={AutomationDashboardPage} /></Route>
      <Route path="/admin/automation/platform"><AdminLazyRoute component={MajlisKnowledgeEnginePage} /></Route>
      <Route path="/admin/automation/center"><AdminLazyRoute component={AutomationCenterPage} /></Route>
      <Route path="/admin/autonomous-platform"><AdminLazyRoute component={AutonomousPlatformPage} /></Route>
      <Route path="/admin/automation"><Redirect to="/admin/automation/center" /></Route>
      <Route path="/admin/integrations/instagram"><AdminLazyRoute component={InstagramIntegrationPage} /></Route>
      <Route path="/admin/review-hub"><AdminLazyRoute component={ReviewHubPage} /></Route>
      <Route path="/admin/review-center"><AdminLazyRoute component={AutomationReviewPage} /></Route>
      <Route path="/admin/automation/review"><AdminLazyRoute component={AutomationReviewPage} /></Route>
      <Route path="/admin/content-import/url"><AdminLazyRoute component={LessonImportUrlPage} /></Route>
      <Route path="/admin/content-import/image"><AdminLazyRoute component={LessonImportImagePage} /></Route>
      <Route path="/admin/import"><Redirect to="/admin/content-import/url" /></Route>
      <Route path="/admin/content"><Redirect to="/admin/auto-content" /></Route>
      <Route path="/admin/auto-content"><AdminLazyRoute component={AutoContentPage} /></Route>
      <Route path="/admin/fiqh-review"><AdminLazyRoute component={FiqhReviewPage} /></Route>
      <Route path="/admin/fiqh-quality"><AdminLazyRoute component={FiqhQualityPage} /></Route>
      <Route path="/admin/content-production"><AdminLazyRoute component={ContentProductionDashboardPage} /></Route>
      <Route path="/admin/automation/content-production"><AdminLazyRoute component={ContentProductionDashboardPage} /></Route>
      <Route path="/admin/feature-status"><AdminLazyRoute component={FeatureStatusPage} /></Route>
      <Route path="/admin/dashboard"><AdminLazyRoute component={AdminDashboardPage} /></Route>
      <Route path="/admin/users"><Redirect to="/admin?section=users" /></Route>
      <Route path="/admin/universities"><AdminLazyRoute component={UniversitiesAdminPage} /></Route>
      <Route path="/admin"><AdminLazyRoute component={AdminPage} /></Route>
      <Route component={() => (
        <Suspense fallback={<LazyRouteFallback />}>
          <NotFound />
        </Suspense>
      )} />
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

function AppShellInner() {
  const { dir, t } = useLanguage();
  const { isAdmin } = useAuth();
  const { newBadges, dismissBadges } = useAchievementCheck();
  const [searchOpen, setSearchOpen] = useState(false);
  const [comingSoonTitle, setComingSoonTitle] = useState("");
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const [location] = useLocation();
  const immersive = isImmersiveChromePath(location);
  const onPrayer = isPrayerTimesPath(location);
  const hideSiteChrome = immersive || onPrayer;

  useEffect(() => {
    ensureChromeMeta();
  }, [location]);

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
    <div
      className="app-shell"
      style={{ "--app-dir": dir } as React.CSSProperties}
    >
      <GlobalAppShortcuts onToggleSearch={() => setSearchOpen((v) => !v)} />
      <a href="#main-content" className="skip-link mj-skip-link">{t("skip_to_content")}</a>
      <OfflineBanner />
      <Suspense fallback={null}>
        <CookieConsentBanner />
      </Suspense>
      <UpdateAvailableBanner />
      <NavProgressBar />
      <SeoManager />
      <ScrollResetOnNav />
      <IslamicReminderBootstrap />
      <AdhanSchedulerBootstrap />
      <PrayerAlertSchedulerBootstrap />
      <NativeNotificationsBootstrap />
      <OfflineSyncBootstrap />
      <PlatformLogicBootstrap />
      <NavBar />
      <TopSectionBar />
      {/* شريط العدّ التنازلي العام يُخفى في مسارات المواقيت والمصحف */}
      {!hideSiteChrome && <PrayerCountdownBanner />}
      {!hideSiteChrome && <AdhanNotificationBar />}
      {!hideSiteChrome && <PrayerRespectBanner />}
      <main id="main-content" className="app-main" tabIndex={-1}>
        <Router />
      </main>
      {!hideSiteChrome && <SiteFooter />}
      <DeferredAssistantWidget />
      {/* أزرار تحرير المشرف العائمة لا تغطي المواقيت/المصحف */}
      {isAdmin && !hideSiteChrome && (
        <Suspense fallback={null}>
          <AdminSiteEditBar />
        </Suspense>
      )}
      {!hideSiteChrome && <ScrollToTop />}
      <GlobalBackButton />
      {!hideSiteChrome && <PwaInstallBanner />}
      <BottomNavBar />
      <VisualViewportKeyboardBridge />
      <SafeAreaDebugOverlay />
      {newBadges.length > 0 && (
        <AchievementToast badges={newBadges} onDismiss={dismissBadges} />
      )}
      {searchOpen && (
        <SectionErrorBoundary name="GlobalSearchModal">
          <Suspense fallback={null}>
            <GlobalSearchModal onClose={() => setSearchOpen(false)} />
          </Suspense>
        </SectionErrorBoundary>
      )}
      <ComingSoonDialog
        open={comingSoonOpen}
        title={comingSoonTitle}
        onClose={() => setComingSoonOpen(false)}
      />
    </div>
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
