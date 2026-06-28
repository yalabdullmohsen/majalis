import { Suspense, type ComponentType } from "react";
import { Redirect, Route, Switch, Router as WouterRouter, useLocation, useRoute } from "wouter";
import { AuthProvider } from "@/components/AuthProvider";
import { FontPreferenceProvider } from "@/components/FontPreferenceProvider";
import { ThemePreferenceProvider } from "@/components/ThemePreferenceProvider";
import { UserPreferencesProvider } from "@/components/UserPreferencesProvider";
import { AdminRouteGuard } from "@/components/AdminRouteGuard";
import NavBar from "@/components/NavBar";
import SiteFooter from "@/components/SiteFooter";
import { AssistantFloatingWidget } from "@/components/assistant/AssistantFloatingWidget";
import HomePage from "@/views/HomePage";
import AboutPage from "@/views/AboutPage";
import PrivacyPage from "@/views/PrivacyPage";
import TermsPage from "@/views/TermsPage";
import ContactPage from "@/views/ContactPage";
import NotFound from "@/views/not-found";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { usePageSeo } from "@/lib/seo";
import { lazyWithRetry } from "@/lib/lazy-with-retry";
import { LazyRouteFallback } from "@/components/LazyRouteFallback";

const lazy = lazyWithRetry;

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
const FawaidPage = lazy(() => import("@/views/FawaidPage"));
const AdhkarPage = lazy(() => import("@/views/AdhkarPage"));
const QaPage = lazy(() => import("@/views/QaPage"));
const QuizPage = lazy(() => import("@/views/QuizPage"));
const LoginPage = lazyWithRetry(() => import("@/views/LoginPage"), "LoginPage");
const RegisterPage = lazyWithRetry(() => import("@/views/RegisterPage"), "RegisterPage");
const TranscribePage = lazy(() => import("@/views/TranscribePage"));
const AssistantPage = lazy(() => import("@/views/AssistantPage"));
const CondolencesPage = lazy(() => import("@/views/CondolencesPage"));
const CardsPage = lazy(() => import("@/views/CardsPage"));
const QuranPage = lazy(() => import("@/views/QuranPage"));
const KuwaitMushafPage = lazy(() => import("@/views/KuwaitMushafPage"));
const QuranSearchPage = lazy(() => import("@/views/QuranSearchPage"));
const QuranTafsirPage = lazy(() => import("@/views/QuranTafsirPage"));
const QuranTajweedPage = lazy(() => import("@/views/QuranTajweedPage"));
const QuranLivePage = lazy(() => import("@/views/QuranLivePage"));
const SurahStoriesPage = lazy(() => import("@/views/SurahStoriesPage"));
const SurahStoryDetailPage = lazy(() =>
  import("@/views/SurahStoriesPage").then((m) => ({ default: m.SurahStoryDetailPage })),
);
const QuranRadioPage = lazy(() => import("@/views/QuranRadioPage"));
const PrayerTimesPage = lazy(() => import("@/views/PrayerTimesPage"));
const PrayerRanksPage = lazy(() => import("@/views/PrayerRanksPage"));
const QiblaPage = lazy(() => import("@/views/QiblaPage"));
const TasbihPage = lazy(() => import("@/views/TasbihPage"));
const DailyWirdPage = lazy(() => import("@/views/DailyWirdPage"));
const OccasionsPage = lazy(() => import("@/views/OccasionsPage"));
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
const FatwaPage = lazy(() => import("@/views/FatwaPage"));
const FatwaDetailPage = lazy(() => import("@/views/FatwaDetailPage"));
const RulingsPage = lazy(() => import("@/views/RulingsPage"));
const RulingDetailPage = lazy(() => import("@/views/RulingDetailPage"));
const UpdatesPage = lazy(() => import("@/views/UpdatesPage"));
const AutoContentDetailPage = lazy(() => import("@/views/AutoContentDetailPage"));
const DeveloperPage = lazy(() => import("@/views/DeveloperPage"));
const AdminPage = lazyWithRetry(() => import("@/views/AdminPage"), "AdminPage");
const LessonImportImagePage = lazyWithRetry(() => import("@/views/admin/LessonImportImagePage"), "LessonImportImagePage");
const LessonImportUrlPage = lazyWithRetry(() => import("@/views/admin/LessonImportUrlPage"), "LessonImportUrlPage");
const AutomationSourcesPage = lazyWithRetry(() => import("@/views/admin/AutomationSourcesPage"), "AutomationSourcesPage");
const AutomationReviewPage = lazyWithRetry(() => import("@/views/admin/AutomationReviewPage"), "AutomationReviewPage");
const AutomationDashboardPage = lazyWithRetry(() => import("@/views/admin/AutomationDashboardPage"), "AutomationDashboardPage");
const AutomationCenterPage = lazyWithRetry(() => import("@/views/admin/AutomationCenterPage"), "AutomationCenterPage");
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
const PlatformSourcesPage = lazyWithRetry(() => import("@/views/admin/PlatformSourcesPage"), "PlatformSourcesPage");
const PlatformAnalyticsPage = lazyWithRetry(() => import("@/views/admin/PlatformAnalyticsPage"), "PlatformAnalyticsPage");
const PlatformHealthPage = lazyWithRetry(() => import("@/views/admin/PlatformHealthPage"), "PlatformHealthPage");
const DeploymentDashboardPage = lazyWithRetry(() => import("@/views/admin/DeploymentDashboardPage"), "DeploymentDashboardPage");
const PlatformChecklistPage = lazyWithRetry(() => import("@/views/admin/PlatformChecklistPage"), "PlatformChecklistPage");
const FeatureStatusPage = lazyWithRetry(() => import("@/views/admin/FeatureStatusPage"), "FeatureStatusPage");
const LearningPathsPage = lazy(() => import("@/views/learning/LearningPathsPage"));
const LearningPathDetailPage = lazy(() => import("@/views/learning/LearningPathDetailPage"));
const MyLearningPage = lazy(() => import("@/views/MyLearningPage"));
const LearningQuizPage = lazy(() => import("@/views/learning/LearningQuizPage"));
const LearningCalendarPage = lazy(() => import("@/views/learning/LearningCalendarPage"));
const CertificateVerifyPage = lazy(() => import("@/views/learning/CertificateVerifyPage"));

function SeoManager() {
  const [location] = useLocation();
  usePageSeo(location);
  return null;
}

function SafeLazyRoute({ component: Component }: { component: ComponentType }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LazyRouteFallback />}>
        <Component />
      </Suspense>
    </ErrorBoundary>
  );
}

function SurahStoryDetailRoute() {
  const [, params] = useRoute("/quran/surah-stories/:number");
  return (
    <Suspense fallback={<LazyRouteFallback />}>
      <SurahStoryDetailPage surahNumber={Number(params?.number) || 1} />
    </Suspense>
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
      <Route path="/about" component={AboutPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/contact" component={ContactPage} />
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
      <Route path="/kuwait-lessons"><Redirect to="/lessons" /></Route>
      <Route path="/announcements"><Redirect to="/lessons" /></Route>
      <Route path="/courses"><Redirect to="/lessons?tab=courses" /></Route>
      <Route path="/sheikhs/:id"><Redirect to="/lessons" /></Route>
      <Route path="/sheikhs"><Redirect to="/lessons" /></Route>
      <Route path="/library/:id"><SafeLazyRoute component={LibraryDetailPage} /></Route>
      <Route path="/library"><SafeLazyRoute component={LibraryPage} /></Route>
      <Route path="/miracles"><SafeLazyRoute component={MiraclesPage} /></Route>
      <Route path="/fawaid"><SafeLazyRoute component={FawaidPage} /></Route>
      <Route path="/adhkar"><SafeLazyRoute component={AdhkarPage} /></Route>
      <Route path="/qa"><SafeLazyRoute component={QaPage} /></Route>
      <Route path="/quiz"><SafeLazyRoute component={QuizPage} /></Route>
      <Route path="/learning/paths/:slug"><SafeLazyRoute component={LearningPathDetailPage} /></Route>
      <Route path="/learning/paths"><SafeLazyRoute component={LearningPathsPage} /></Route>
      <Route path="/learning/quiz/:slug"><SafeLazyRoute component={LearningQuizPage} /></Route>
      <Route path="/learning/quiz"><SafeLazyRoute component={LearningQuizPage} /></Route>
      <Route path="/learning/calendar"><SafeLazyRoute component={LearningCalendarPage} /></Route>
      <Route path="/learning/certificates/:code"><SafeLazyRoute component={CertificateVerifyPage} /></Route>
      <Route path="/my-learning"><SafeLazyRoute component={MyLearningPage} /></Route>
      <Route path="/learning"><Redirect to="/learning/paths" /></Route>
      <Route path="/assistant">
        <ErrorBoundary>
          <Suspense fallback={<LazyRouteFallback />}>
            <AssistantPage />
          </Suspense>
        </ErrorBoundary>
      </Route>
      <Route path="/condolences"><SafeLazyRoute component={CondolencesPage} /></Route>
      <Route path="/transcribe">
        <ErrorBoundary>
          <Suspense fallback={<LazyRouteFallback />}>
            <TranscribePage />
          </Suspense>
        </ErrorBoundary>
      </Route>
      <Route path="/quran-radio"><SafeLazyRoute component={QuranRadioPage} /></Route>
      <Route path="/quran-live"><SafeLazyRoute component={QuranLivePage} /></Route>
      <Route path="/tajweed"><Redirect to="/quran/tajweed" /></Route>
      <Route path="/surah-stories"><Redirect to="/quran/surah-stories" /></Route>
      <Route path="/quran/mushaf"><SafeLazyRoute component={KuwaitMushafPage} /></Route>
      <Route path="/quran/search"><SafeLazyRoute component={QuranSearchPage} /></Route>
      <Route path="/quran/tafsir"><SafeLazyRoute component={QuranTafsirPage} /></Route>
      <Route path="/quran/tajweed"><SafeLazyRoute component={QuranTajweedPage} /></Route>
      <Route path="/quran/surah-stories/:number"><SurahStoryDetailRoute /></Route>
      <Route path="/quran/surah-stories"><SafeLazyRoute component={SurahStoriesPage} /></Route>
      <Route path="/quran"><SafeLazyRoute component={QuranPage} /></Route>
      <Route path="/prayer-times"><SafeLazyRoute component={PrayerTimesPage} /></Route>
      <Route path="/prayer-ranks"><SafeLazyRoute component={PrayerRanksPage} /></Route>
      <Route path="/qibla"><SafeLazyRoute component={QiblaPage} /></Route>
      <Route path="/tasbih"><SafeLazyRoute component={TasbihPage} /></Route>
      <Route path="/daily-wird"><SafeLazyRoute component={DailyWirdPage} /></Route>
      <Route path="/occasions"><SafeLazyRoute component={OccasionsPage} /></Route>
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
      <Route path="/admin/sources"><AdminLazyRoute component={PlatformSourcesPage} /></Route>
      <Route path="/admin/automation/lesson-sources"><AdminLazyRoute component={AutomationSourcesPage} /></Route>
      <Route path="/admin/platform/analytics"><AdminLazyRoute component={PlatformAnalyticsPage} /></Route>
      <Route path="/admin/platform/health"><AdminLazyRoute component={PlatformHealthPage} /></Route>
      <Route path="/admin/platform/deployments"><AdminLazyRoute component={DeploymentDashboardPage} /></Route>
      <Route path="/admin/platform/checklist"><AdminLazyRoute component={PlatformChecklistPage} /></Route>
      <Route path="/admin/automation/sources"><AdminLazyRoute component={AutomationSourcesPage} /></Route>
      <Route path="/admin/automation/dashboard"><AdminLazyRoute component={AutomationDashboardPage} /></Route>
      <Route path="/admin/automation/platform"><AdminLazyRoute component={MajlisKnowledgeEnginePage} /></Route>
      <Route path="/admin/automation/center"><AdminLazyRoute component={AutomationCenterPage} /></Route>
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
      <Route path="/admin"><AdminLazyRoute component={AdminPage} /></Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemePreferenceProvider>
      <FontPreferenceProvider>
        <UserPreferencesProvider>
          <AuthProvider>
          <WouterRouter base={(import.meta.env.BASE_URL || "/").replace(/\/$/, "")}>
            <div className="app-shell" style={{ minHeight: "100vh", direction: "rtl" }}>
              <a href="#main-content" className="skip-link">تخطّي إلى المحتوى</a>
              <SeoManager />
              <NavBar />
              <main id="main-content" className="app-main" tabIndex={-1}>
                <Router />
              </main>
              <SiteFooter />
              <AssistantFloatingWidget />
            </div>
          </WouterRouter>
          </AuthProvider>
        </UserPreferencesProvider>
      </FontPreferenceProvider>
    </ThemePreferenceProvider>
  );
}

export default App;
