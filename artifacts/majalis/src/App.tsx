import { Suspense, useEffect, useRef, useState, type ComponentType } from "react";
import { Redirect, Route, Switch, Router as WouterRouter, useLocation, useParams } from "wouter";
import { AuthProvider } from "@/components/AuthProvider";
import { FontPreferenceProvider } from "@/components/FontPreferenceProvider";
import { ThemePreferenceProvider } from "@/components/ThemePreferenceProvider";
import { UserPreferencesProvider } from "@/components/UserPreferencesProvider";
import { AdminRouteGuard } from "@/components/AdminRouteGuard";
import { LanguageProvider, useLanguage } from "@/components/LanguageProvider";
import NavBar from "@/components/NavBar";
import SiteFooter from "@/components/SiteFooter";
import { BottomNavBar } from "@/components/BottomNavBar";
import { ScrollToTop } from "@/components/ScrollToTop";
import { AssistantFloatingWidget } from "@/components/assistant/AssistantFloatingWidget";
import { AdhanNotificationBar } from "@/components/adhan/AdhanNotificationBar";
import { AchievementToast } from "@/components/AchievementToast";
import { useAchievementCheck } from "@/hooks/useAchievementCheck";
import { GlobalSearchModal } from "@/components/GlobalSearchModal";
import HomePage from "@/views/HomePage";
import NotFound from "@/views/not-found";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { usePageSeo } from "@/lib/seo";
import { lazyWithRetry } from "@/lib/lazy-with-retry";
import { LazyRouteFallback } from "@/components/LazyRouteFallback";
import { usePrayerCountdown } from "@/hooks/usePrayerCountdown";
import { startAdhanScheduler } from "@/lib/adhan-scheduler";
import { loadNotifPrefs, scheduleIslamicReminder } from "@/lib/local-notifications";
import { NavProgressBar } from "@/components/NavProgressBar";
import { recordRecentPage } from "@/lib/recent-pages";

const lazy = lazyWithRetry;

const AboutPage = lazy(() => import("@/views/AboutPage"));
const PrivacyPage = lazy(() => import("@/views/PrivacyPage"));
const TermsPage = lazy(() => import("@/views/TermsPage"));
const ContactPage = lazy(() => import("@/views/ContactPage"));

const CalendarPage = lazy(() => import("@/views/CalendarPage"));
const SearchPage = lazy(() => import("@/views/SearchPage"));
const TopicPage = lazy(() => import("@/views/TopicPage"));
const TopicsIndexPage = lazy(() => import("@/views/TopicsIndexPage"));
const LessonsPage = lazy(() => import("@/views/LessonsPage"));
const LessonDetailPage = lazy(() => import("@/views/LessonDetailPage"));
const ScientificAnnouncementDetailPage = lazy(() => import("@/views/ScientificAnnouncementDetailPage"));
const LibraryPage = lazy(() => import("@/views/LibraryPage"));
const LibraryDetailPage = lazy(() => import("@/views/LibraryDetailPage"));
const MiraclesPage = lazy(() => import("@/views/MiraclesPage"));
const PropheticMedicinePage = lazy(() => import("@/views/PropheticMedicinePage"));
const FawaidPage = lazy(() => import("@/views/FawaidPage"));
const HadithPage = lazy(() => import("@/views/HadithPage"));
const HadithIndexPage = lazy(() => import("@/views/HadithIndexPage"));
const HadithDaifPage = lazy(() => import("@/views/HadithDaifPage"));
const HadithMawduPage = lazy(() => import("@/views/HadithMawduPage"));
const QuranRadioPage = lazy(() => import("@/views/QuranRadioPage"));
const QuranCirclesPage = lazy(() => import("@/views/QuranCirclesPage"));
const QuranHubPage = lazy(() => import("@/views/QuranHubPage"));
const SurahStoriesPage = lazy(() => import("@/views/SurahStoriesPage"));
const QuranTajweedPage = lazy(() => import("@/views/QuranTajweedPage"));
const SurahStoryDetailRoute = lazy(() =>
  import("@/views/SurahStoriesPage").then(m => ({
    default: ({ params }: { params?: Record<string, string> }) => {
      const n = parseInt(params?.number ?? "1", 10);
      return <m.SurahStoryDetailPage surahNumber={Number.isNaN(n) ? 1 : n} />;
    },
  }))
);
const TawhidPage = lazy(() => import("@/views/TawhidPage"));
const StoriesPage = lazy(() => import("@/views/StoriesPage"));
const AdhkarPage = lazy(() => import("@/views/AdhkarPage"));
const QaPage = lazy(() => import("@/views/QaPage"));
const QuizPage = lazy(() => import("@/views/QuizPage"));
const SubmitContentPage = lazy(() => import("@/views/SubmitContentPage"));
const LoginPage = lazyWithRetry(() => import("@/views/LoginPage"), "LoginPage");
const RegisterPage = lazyWithRetry(() => import("@/views/RegisterPage"), "RegisterPage");
const TranscribePage = lazy(() => import("@/views/TranscribePage"));
const AssistantPage = lazy(() => import("@/views/AssistantPage"));
const KuwaitLessonsPage = lazy(() => import("@/views/KuwaitLessonsPage"));
const CardsPage = lazy(() => import("@/views/CardsPage"));
const PrayerTimesPage = lazy(() => import("@/views/PrayerTimesPage"));
const PrayerCountdownPage = lazy(() => import("@/views/PrayerCountdownPage"));
const PrayerRanksPage = lazy(() => import("@/views/PrayerRanksPage"));
const QiblaPage = lazy(() => import("@/views/QiblaPage"));
const TasbihPage = lazy(() => import("@/views/TasbihPage"));
const DailyWirdPage = lazy(() => import("@/views/DailyWirdPage"));
const OccasionsPage = lazy(() => import("@/views/OccasionsPage"));
const FeaturesInProgressPage = lazy(() => import("@/views/FeaturesInProgressPage"));
const ArbaeenNawawiPage = lazy(() => import("@/views/ArbaeenNawawiPage"));
const SettingsPage = lazy(() => import("@/views/SettingsPage"));
const AnnualCoursesPage = lazy(() => import("@/views/AnnualCoursesPage"));
const AnnualCourseDetailPage = lazy(() => import("@/views/AnnualCourseDetailPage"));
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
const FiqhPage = lazy(() => import("@/views/FiqhPage"));
const SeerahPage = lazy(() => import("@/views/SeerahPage"));
const FatwaPage = lazy(() => import("@/views/FatwaPage"));
const FatwaDetailPage = lazy(() => import("@/views/FatwaDetailPage"));
const RulingsPage = lazy(() => import("@/views/RulingsPage"));
const RulingDetailPage = lazy(() => import("@/views/RulingDetailPage"));
const UpdatesPage = lazy(() => import("@/views/UpdatesPage"));
const AutoContentDetailPage = lazy(() => import("@/views/AutoContentDetailPage"));
const DeveloperPage = lazy(() => import("@/views/DeveloperPage"));
const KnowledgeGraphPage = lazy(() => import("@/views/KnowledgeGraphPage"));
const IslamicKnowledgeMapPage = lazy(() => import("@/views/IslamicKnowledgeMapPage"));
const QuranLivePage = lazy(() => import("@/views/QuranLivePage"));
const IslamicScholarsPage = lazy(() => import("@/views/IslamicScholarsPage"));
const AdminPage = lazyWithRetry(() => import("@/views/AdminPage"), "AdminPage");
const LessonImportImagePage = lazyWithRetry(() => import("@/views/admin/LessonImportImagePage"), "LessonImportImagePage");
const LessonImportUrlPage = lazyWithRetry(() => import("@/views/admin/LessonImportUrlPage"), "LessonImportUrlPage");
const AutomationSourcesPage = lazyWithRetry(() => import("@/views/admin/AutomationSourcesPage"), "AutomationSourcesPage");
const AutomationReviewPage = lazyWithRetry(() => import("@/views/admin/AutomationReviewPage"), "AutomationReviewPage");
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
const LearningPathPage = lazy(() => import("@/views/LearningPathPage"));
const LearningPathSciencePage = lazy(() => import("@/views/LearningPathSciencePage"));
const LearningPathBookPage = lazy(() => import("@/views/LearningPathBookPage"));
const LearningPathDashboardPage = lazy(() => import("@/views/LearningPathDashboardPage"));
const MyLearningPage = lazy(() => import("@/views/MyLearningPage"));
const LearningQuizPage = lazy(() => import("@/views/learning/LearningQuizPage"));
const LearningCalendarPage = lazy(() => import("@/views/learning/LearningCalendarPage"));
const CertificateVerifyPage = lazy(() => import("@/views/learning/CertificateVerifyPage"));
const AdhanSettingsPage = lazy(() => import("@/views/AdhanSettingsPage"));
const MuezzinsPage = lazy(() => import("@/views/MuezzinsPage"));
const MuezzinDetailPage = lazy(() => import("@/views/MuezzinDetailPage"));
const MuezzinFavoritesPage = lazy(() => import("@/views/MuezzinFavoritesPage"));
const UploadPage = lazy(() => import("@/views/UploadPage"));
const MySubmissionsPage = lazy(() => import("@/views/MySubmissionsPage"));
const UserStatsPage = lazy(() => import("@/views/UserStatsPage"));
const LearningPlanPage = lazy(() => import("@/views/LearningPlanPage"));
const FlashCardsPage = lazy(() => import("@/views/FlashCardsPage"));
const CarModePage = lazy(() => import("@/views/CarModePage"));
const MosqueModePage = lazy(() => import("@/views/MosqueModePage"));
const NotificationSettingsPage = lazy(() => import("@/views/NotificationSettingsPage"));
const StudyRoomPage = lazy(() => import("@/views/StudyRoomPage"));
const FamilyModePage = lazy(() => import("@/views/FamilyModePage"));
const VaultPage = lazy(() => import("@/views/VaultPage"));
const ResearcherProfilePage = lazy(() => import("@/views/ResearcherProfilePage"));
const InstitutionsPage = lazy(() => import("@/views/InstitutionsPage"));
const AuthCallbackPage = lazy(() => import("@/views/AuthCallbackPage"));
const ProphetStoriesPage = lazy(() => import("@/views/ProphetStoriesPage"));
const IslamicStoriesPage = lazy(() => import("@/views/IslamicStoriesPage"));
const CitationPublicPage = lazy(() => import("@/views/CitationPublicPage"));
const MyCitationsPage = lazy(() => import("@/views/MyCitationsPage"));
const ScholarlyResearchPage = lazy(() => import("@/views/ScholarlyResearchPage"));
const AcademicResearchPage  = lazy(() => import("@/views/AcademicResearchPage"));
const UniversitiesPage = lazy(() => import("@/views/UniversitiesPage"));
const UniversityDetailPage = lazy(() => import("@/views/UniversityDetailPage"));
const UniversitiesComparePage = lazy(() => import("@/views/UniversitiesComparePage"));
const UniversitiesAdminPage = lazyWithRetry(() => import("@/views/admin/UniversitiesAdminPage"), "UniversitiesAdminPage");
const QuranPage = lazy(() => import("@/views/QuranPage"));

function SeoManager() {
  const [location] = useLocation();
  usePageSeo(location);
  useEffect(() => { recordRecentPage(location); }, [location]);
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
    if (!data || started.current) return;
    started.current = true;
    startAdhanScheduler(data).catch(() => {});
  }, [data]);
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
        <HomePage />
      </Route>
      <Route path="/about"><SafeLazyRoute component={AboutPage} /></Route>
      <Route path="/privacy"><SafeLazyRoute component={PrivacyPage} /></Route>
      <Route path="/terms"><SafeLazyRoute component={TermsPage} /></Route>
      <Route path="/contact"><SafeLazyRoute component={ContactPage} /></Route>
      <Route path="/settings"><SafeLazyRoute component={SettingsPage} /></Route>
      <Route path="/search/:q"><SafeLazyRoute component={SearchPage} /></Route>
      <Route path="/search"><SafeLazyRoute component={SearchPage} /></Route>
      <Route path="/topics/:slug"><SafeLazyRoute component={TopicPage} /></Route>
      <Route path="/topics"><SafeLazyRoute component={TopicsIndexPage} /></Route>
      <Route path="/scientific-announcements/:id"><SafeLazyRoute component={ScientificAnnouncementDetailPage} /></Route>
      <Route path="/lessons/current"><Redirect to="/lessons" /></Route>
      <Route path="/lessons/:id"><SafeLazyRoute component={LessonDetailPage} /></Route>
      <Route path="/lessons"><SafeLazyRoute component={LessonsPage} /></Route>
      <Route path="/calendar"><SafeLazyRoute component={CalendarPage} /></Route>
      <Route path="/kuwait-lessons"><SafeLazyRoute component={KuwaitLessonsPage} /></Route>
      <Route path="/announcements"><Redirect to="/lessons" /></Route>
      <Route path="/courses"><Redirect to="/lessons?tab=courses" /></Route>
      <Route path="/sheikhs/:id"><Redirect to="/lessons" /></Route>
      <Route path="/sheikhs"><Redirect to="/lessons" /></Route>
      <Route path="/library/:id"><SafeLazyRoute component={LibraryDetailPage} /></Route>
      <Route path="/library"><SafeLazyRoute component={LibraryPage} /></Route>
      <Route path="/miracles"><SafeLazyRoute component={MiraclesPage} /></Route>
      <Route path="/prophetic-medicine"><SafeLazyRoute component={PropheticMedicinePage} /></Route>
      <Route path="/quran-circles"><SafeLazyRoute component={QuranCirclesPage} /></Route>
      <Route path="/fawaid"><SafeLazyRoute component={FawaidPage} /></Route>
      <Route path="/hadith/sahih"><SafeLazyRoute component={HadithPage} /></Route>
      <Route path="/hadith/daif"><SafeLazyRoute component={HadithDaifPage} /></Route>
      <Route path="/hadith/mawdu"><SafeLazyRoute component={HadithMawduPage} /></Route>
      <Route path="/hadith"><SafeLazyRoute component={HadithIndexPage} /></Route>
      <Route path="/stories"><SafeLazyRoute component={StoriesPage} /></Route>
      <Route path="/prophets/:slug"><SafeLazyRoute component={ProphetStoriesPage} /></Route>
      <Route path="/prophets"><SafeLazyRoute component={ProphetStoriesPage} /></Route>
      <Route path="/islamic-stories"><SafeLazyRoute component={IslamicStoriesPage} /></Route>
      <Route path="/adhkar"><SafeLazyRoute component={AdhkarPage} /></Route>
      <Route path="/qa"><SafeLazyRoute component={QaPage} /></Route>
      <Route path="/quiz"><SafeLazyRoute component={QuizPage} /></Route>
      <Route path="/knowledge-graph"><SafeLazyRoute component={KnowledgeGraphPage} /></Route>
      <Route path="/knowledge-map"><SafeLazyRoute component={IslamicKnowledgeMapPage} /></Route>
      <Route path="/scholars"><SafeLazyRoute component={IslamicScholarsPage} /></Route>
      <Route path="/submit"><SafeLazyRoute component={SubmitContentPage} /></Route>
      <Route path="/upload"><SafeLazyRoute component={UploadPage} /></Route>
      <Route path="/my-submissions"><SafeLazyRoute component={MySubmissionsPage} /></Route>
      <Route path="/stats"><SafeLazyRoute component={UserStatsPage} /></Route>
      <Route path="/profile"><SafeLazyRoute component={UserStatsPage} /></Route>
      <Route path="/learning-plan"><SafeLazyRoute component={LearningPlanPage} /></Route>
      <Route path="/flashcards"><SafeLazyRoute component={FlashCardsPage} /></Route>
      <Route path="/car-mode"><SafeLazyRoute component={CarModePage} /></Route>
      <Route path="/mosque-mode"><SafeLazyRoute component={MosqueModePage} /></Route>
      <Route path="/notification-settings"><SafeLazyRoute component={NotificationSettingsPage} /></Route>
      <Route path="/study-room"><SafeLazyRoute component={StudyRoomPage} /></Route>
      <Route path="/family"><SafeLazyRoute component={FamilyModePage} /></Route>
      <Route path="/vault"><SafeLazyRoute component={VaultPage} /></Route>
      <Route path="/researcher"><SafeLazyRoute component={ResearcherProfilePage} /></Route>
      <Route path="/institutions"><SafeLazyRoute component={InstitutionsPage} /></Route>
      <Route path="/auth/callback"><SafeLazyRoute component={AuthCallbackPage} /></Route>
      <Route path="/learning/paths/:slug"><SafeLazyRoute component={LearningPathDetailPage} /></Route>
      <Route path="/learning/paths"><SafeLazyRoute component={LearningPathsPage} /></Route>
      <Route path="/learning/quiz/:slug"><SafeLazyRoute component={LearningQuizPage} /></Route>
      <Route path="/learning/quiz"><SafeLazyRoute component={LearningQuizPage} /></Route>
      <Route path="/learning/calendar"><SafeLazyRoute component={LearningCalendarPage} /></Route>
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
      <Route path="/scholarly-research"><SafeLazyRoute component={ScholarlyResearchPage} /></Route>
      <Route path="/academic-research"><SafeLazyRoute component={AcademicResearchPage} /></Route>
      <Route path="/learning-path/dashboard"><SafeLazyRoute component={LearningPathDashboardPage} /></Route>
      <Route path="/learning-path/book/:bookId"><SafeLazyRoute component={LearningPathBookPage} /></Route>
      <Route path="/learning-path/:scienceSlug"><SafeLazyRoute component={LearningPathSciencePage} /></Route>
      <Route path="/learning-path"><SafeLazyRoute component={LearningPathPage} /></Route>
      <Route path="/universities/compare"><SafeLazyRoute component={UniversitiesComparePage} /></Route>
      <Route path="/universities/:slug"><SafeLazyRoute component={UniversityDetailPage} /></Route>
      <Route path="/universities"><SafeLazyRoute component={UniversitiesPage} /></Route>
      <Route path="/condolences"><Redirect to="/" /></Route>
      <Route path="/janaza"><Redirect to="/" /></Route>
      <Route path="/transcribe">
        <ErrorBoundary>
          <Suspense fallback={<LazyRouteFallback />}>
            <TranscribePage />
          </Suspense>
        </ErrorBoundary>
      </Route>
      <Route path="/quran-hub"><SafeLazyRoute component={QuranHubPage} /></Route>
      <Route path="/quran-radio"><SafeLazyRoute component={QuranRadioPage} /></Route>
      <Route path="/quran-live"><SafeLazyRoute component={QuranLivePage} /></Route>
      <Route path="/tajweed"><SafeLazyRoute component={QuranTajweedPage} /></Route>
      <Route path="/surah-stories"><SafeLazyRoute component={SurahStoriesPage} /></Route>
      <Route path="/quran/tajweed"><SafeLazyRoute component={QuranTajweedPage} /></Route>
      {/* مسارات الاختصار — public redirects */}
      <Route path="/research"><Redirect to="/fiqh-council/research" /></Route>
      {/* الفقه الإسلامي الموحّد + السيرة النبوية */}
      <Route path="/tawhid"><SafeLazyRoute component={TawhidPage} /></Route>
      <Route path="/fiqh"><SafeLazyRoute component={FiqhPage} /></Route>
      <Route path="/seerah"><SafeLazyRoute component={SeerahPage} /></Route>
      <Route path="/quran"><Suspense fallback={<LazyRouteFallback />}><QuranPage /></Suspense></Route>
      <Route path="/quran/surah-stories/:number"><SafeLazyRoute component={SurahStoryDetailRoute} /></Route>
      <Route path="/quran/surah-stories"><SafeLazyRoute component={SurahStoriesPage} /></Route>
      <Route path="/prayer-times"><SafeLazyRoute component={PrayerTimesPage} /></Route>
      <Route path="/prayer-countdown"><SafeLazyRoute component={PrayerCountdownPage} /></Route>
      <Route path="/prayer-ranks"><SafeLazyRoute component={PrayerRanksPage} /></Route>
      <Route path="/adhan-settings"><SafeLazyRoute component={AdhanSettingsPage} /></Route>
      <Route path="/muezzins/favorites"><SafeLazyRoute component={MuezzinFavoritesPage} /></Route>
      <Route path="/muezzins/:id"><SafeLazyRoute component={MuezzinDetailPage} /></Route>
      <Route path="/muezzins"><SafeLazyRoute component={MuezzinsPage} /></Route>
      <Route path="/qibla"><SafeLazyRoute component={QiblaPage} /></Route>
      <Route path="/tasbih"><SafeLazyRoute component={TasbihPage} /></Route>
      <Route path="/daily-wird"><SafeLazyRoute component={DailyWirdPage} /></Route>
      <Route path="/occasions"><SafeLazyRoute component={OccasionsPage} /></Route>
      <Route path="/features-in-progress"><SafeLazyRoute component={FeaturesInProgressPage} /></Route>
      <Route path="/arbaeen-nawawi"><SafeLazyRoute component={ArbaeenNawawiPage} /></Route>
      <Route path="/cards"><SafeLazyRoute component={CardsPage} /></Route>
      <Route path="/annual-courses/:id"><SafeLazyRoute component={AnnualCourseDetailPage} /></Route>
      <Route path="/annual-courses"><SafeLazyRoute component={AnnualCoursesPage} /></Route>
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
      <Route path="/fatwa/:id"><SafeLazyRoute component={FatwaDetailPage} /></Route>
      <Route path="/fatwa"><SafeLazyRoute component={FatwaPage} /></Route>
      <Route path="/rulings/:id"><SafeLazyRoute component={RulingDetailPage} /></Route>
      <Route path="/rulings"><SafeLazyRoute component={RulingsPage} /></Route>
      <Route path="/updates/auto/:slug"><SafeLazyRoute component={AutoContentDetailPage} /></Route>
      <Route path="/updates"><SafeLazyRoute component={UpdatesPage} /></Route>
      <Route path="/developers"><SafeLazyRoute component={DeveloperPage} /></Route>
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
      <Route component={NotFound} />
    </Switch>
  );
}

function AppShell() {
  const { dir, t } = useLanguage();
  const { newBadges, dismissBadges } = useAchievementCheck();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    const evtHandler = () => setSearchOpen(true);
    window.addEventListener("keydown", keyHandler);
    window.addEventListener("global-search-open", evtHandler);
    return () => {
      window.removeEventListener("keydown", keyHandler);
      window.removeEventListener("global-search-open", evtHandler);
    };
  }, []);

  return (
    <WouterRouter base={(import.meta.env.BASE_URL || "/").replace(/\/$/, "")}>
      <div className="app-shell" style={{ "--app-dir": dir } as React.CSSProperties}>
        <a href="#main-content" className="skip-link">{t("skip_to_content")}</a>
        <NavProgressBar />
        <SeoManager />
        <IslamicReminderBootstrap />
        <AdhanSchedulerBootstrap />
        <AdhanNotificationBar />
        <NavBar />
        <main id="main-content" className="app-main" tabIndex={-1}>
          <Router />
        </main>
        <SiteFooter />
        <AssistantFloatingWidget />
        <ScrollToTop />
        <BottomNavBar />
        {newBadges.length > 0 && (
          <AchievementToast badges={newBadges} onDismiss={dismissBadges} />
        )}
        {searchOpen && <GlobalSearchModal onClose={() => setSearchOpen(false)} />}
      </div>
    </WouterRouter>
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
