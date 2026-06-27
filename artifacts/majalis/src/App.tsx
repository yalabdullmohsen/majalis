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
import { RouteErrorBoundary, WidgetErrorBoundary } from "@/components/ErrorBoundary";
import { usePageSeo } from "@/lib/seo";
import { Loading } from "@/components/ui-common";
import { lazyWithRetry } from "@/lib/lazy-with-retry";

const CalendarPage = lazyWithRetry(() => import("@/views/CalendarPage"));
const SearchPage = lazyWithRetry(() => import("@/views/SearchPage"));
const TopicPage = lazyWithRetry(() => import("@/views/TopicPage"));
const TopicsIndexPage = lazyWithRetry(() => import("@/views/TopicsIndexPage"));
const LessonsPage = lazyWithRetry(() => import("@/views/LessonsPage"));
const LessonDetailPage = lazyWithRetry(() => import("@/views/LessonDetailPage"));
const ScientificAnnouncementDetailPage = lazyWithRetry(() => import("@/views/ScientificAnnouncementDetailPage"));
const LibraryPage = lazyWithRetry(() => import("@/views/LibraryPage"));
const MiraclesPage = lazyWithRetry(() => import("@/views/MiraclesPage"));
const FawaidPage = lazyWithRetry(() => import("@/views/FawaidPage"));
const AdhkarPage = lazyWithRetry(() => import("@/views/AdhkarPage"));
const QaPage = lazyWithRetry(() => import("@/views/QaPage"));
const QuizPage = lazyWithRetry(() => import("@/views/QuizPage"));
const LoginPage = lazyWithRetry(() => import("@/views/LoginPage"));
const RegisterPage = lazyWithRetry(() => import("@/views/RegisterPage"));
const TranscribePage = lazyWithRetry(() => import("@/views/TranscribePage"));
const AssistantPage = lazyWithRetry(() => import("@/views/AssistantPage"));
const CondolencesPage = lazyWithRetry(() => import("@/views/CondolencesPage"));
const CardsPage = lazyWithRetry(() => import("@/views/CardsPage"));
const QuranPage = lazyWithRetry(() => import("@/views/QuranPage"));
const QuranTajweedPage = lazyWithRetry(() => import("@/views/QuranTajweedPage"));
const QuranLivePage = lazyWithRetry(() => import("@/views/QuranLivePage"));
const SurahStoriesPage = lazyWithRetry(() => import("@/views/SurahStoriesPage"));
const SurahStoryDetailPage = lazyWithRetry(() =>
  import("@/views/SurahStoriesPage").then((m) => ({ default: m.SurahStoryDetailPage })),
);
const QuranRadioPage = lazyWithRetry(() => import("@/views/QuranRadioPage"));
const PrayerTimesPage = lazyWithRetry(() => import("@/views/PrayerTimesPage"));
const PrayerRanksPage = lazyWithRetry(() => import("@/views/PrayerRanksPage"));
const QiblaPage = lazyWithRetry(() => import("@/views/QiblaPage"));
const TasbihPage = lazyWithRetry(() => import("@/views/TasbihPage"));
const DailyWirdPage = lazyWithRetry(() => import("@/views/DailyWirdPage"));
const OccasionsPage = lazyWithRetry(() => import("@/views/OccasionsPage"));
const ArbaeenNawawiPage = lazyWithRetry(() => import("@/views/ArbaeenNawawiPage"));
const SettingsPage = lazyWithRetry(() => import("@/views/SettingsPage"));
const AnnualCoursesPage = lazyWithRetry(() => import("@/views/AnnualCoursesPage"));
const AnnualCourseDetailPage = lazyWithRetry(() => import("@/views/AnnualCourseDetailPage"));
const FiqhCouncilResolutionsPage = lazyWithRetry(() => import("@/views/FiqhCouncilResolutionsPage"));
const FiqhCouncilFatwasPage = lazyWithRetry(() => import("@/views/FiqhCouncilFatwasPage"));
const FiqhCouncilRecommendationsPage = lazyWithRetry(() => import("@/views/FiqhCouncilRecommendationsPage"));
const FiqhCouncilResearchPage = lazyWithRetry(() => import("@/views/FiqhCouncilResearchPage"));
const FiqhCouncilCategoriesPage = lazyWithRetry(() => import("@/views/FiqhCouncilCategoriesPage"));
const FiqhCouncilArchivePage = lazyWithRetry(() => import("@/views/FiqhCouncilArchivePage"));
const FiqhCouncilNawazilPage = lazyWithRetry(() => import("@/views/FiqhCouncilNawazilPage"));
const FiqhCouncilComparePage = lazyWithRetry(() => import("@/views/FiqhCouncilComparePage"));
const FiqhCouncilAdvancedSearchPage = lazyWithRetry(() => import("@/views/FiqhCouncilAdvancedSearchPage"));
const FiqhCouncilResearchAssistantPage = lazyWithRetry(() => import("@/views/FiqhCouncilResearchAssistantPage"));
const FiqhCouncilLivePage = lazyWithRetry(() => import("@/views/FiqhCouncilLivePage"));
const FiqhCouncilSessionDetailPage = lazyWithRetry(() => import("@/views/FiqhCouncilSessionDetailPage"));
const FiqhCouncilIssuesPage = lazyWithRetry(() => import("@/views/FiqhCouncilIssuesPage"));
const FiqhCouncilIssueDetailPage = lazyWithRetry(() => import("@/views/FiqhCouncilIssueDetailPage"));
const FiqhCouncilTopicIndexPage = lazyWithRetry(() => import("@/views/FiqhCouncilTopicIndexPage"));
const FiqhCouncilStatsPage = lazyWithRetry(() => import("@/views/FiqhCouncilStatsPage"));
const FiqhCouncilPage = lazyWithRetry(() => import("@/views/FiqhCouncilPage"));
const FiqhCouncilItemDetailPage = lazyWithRetry(() => import("@/views/FiqhCouncilItemDetailPage"));
const FatwaPage = lazyWithRetry(() => import("@/views/FatwaPage"));
const FatwaDetailPage = lazyWithRetry(() => import("@/views/FatwaDetailPage"));
const RulingsPage = lazyWithRetry(() => import("@/views/RulingsPage"));
const RulingDetailPage = lazyWithRetry(() => import("@/views/RulingDetailPage"));
const UpdatesPage = lazyWithRetry(() => import("@/views/UpdatesPage"));
const AutoContentDetailPage = lazyWithRetry(() => import("@/views/AutoContentDetailPage"));
const DeveloperPage = lazyWithRetry(() => import("@/views/DeveloperPage"));
const AdminPage = lazyWithRetry(() => import("@/views/AdminPage"));
const AdminDashboardPage = lazyWithRetry(() => import("@/views/admin/AdminDashboardPage"));
const AutoContentPage = lazyWithRetry(() => import("@/views/admin/AutoContentPage"));
const FiqhReviewPage = lazyWithRetry(() => import("@/views/admin/FiqhReviewPage"));
const FiqhQualityPage = lazyWithRetry(() => import("@/views/admin/FiqhQualityPage"));
const LearningPathsPage = lazyWithRetry(() => import("@/views/learning/LearningPathsPage"));
const LearningPathDetailPage = lazyWithRetry(() => import("@/views/learning/LearningPathDetailPage"));
const MyLearningPage = lazyWithRetry(() => import("@/views/MyLearningPage"));
const LearningQuizPage = lazyWithRetry(() => import("@/views/learning/LearningQuizPage"));
const LearningCalendarPage = lazyWithRetry(() => import("@/views/learning/LearningCalendarPage"));
const CertificateVerifyPage = lazyWithRetry(() => import("@/views/learning/CertificateVerifyPage"));

function SeoManager() {
  const [location] = useLocation();
  usePageSeo(location);
  return null;
}

function SafeLazyRoute({ component: Component, name }: { component: ComponentType; name?: string }) {
  const routeName = name || Component.displayName || Component.name || "الصفحة";
  return (
    <RouteErrorBoundary name={routeName}>
      <Suspense fallback={<Loading />}>
        <Component />
      </Suspense>
    </RouteErrorBoundary>
  );
}

function SurahStoryDetailRoute() {
  const [, params] = useRoute("/quran/surah-stories/:number");
  return (
    <RouteErrorBoundary name="قصة السورة">
      <Suspense fallback={<Loading />}>
        <SurahStoryDetailPage surahNumber={Number(params?.number) || 1} />
      </Suspense>
    </RouteErrorBoundary>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <RouteErrorBoundary name="الرئيسية">
          <HomePage />
        </RouteErrorBoundary>
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
        <RouteErrorBoundary name="المساعد العلمي">
          <Suspense fallback={<Loading />}>
            <AssistantPage />
          </Suspense>
        </RouteErrorBoundary>
      </Route>
      <Route path="/condolences"><SafeLazyRoute component={CondolencesPage} /></Route>
      <Route path="/transcribe">
        <RouteErrorBoundary name="النسخ">
          <Suspense fallback={<Loading />}>
            <TranscribePage />
          </Suspense>
        </RouteErrorBoundary>
      </Route>
      <Route path="/quran-radio"><SafeLazyRoute component={QuranRadioPage} /></Route>
      <Route path="/quran-live"><SafeLazyRoute component={QuranLivePage} /></Route>
      <Route path="/tajweed"><Redirect to="/quran/tajweed" /></Route>
      <Route path="/surah-stories"><Redirect to="/quran/surah-stories" /></Route>
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
      <Route path="/admin/auto-content">
        <AdminRouteGuard>
          <RouteErrorBoundary name="إدارة المحتوى">
            <Suspense fallback={<Loading />}>
              <AutoContentPage />
            </Suspense>
          </RouteErrorBoundary>
        </AdminRouteGuard>
      </Route>
      <Route path="/admin/fiqh-review">
        <AdminRouteGuard>
          <RouteErrorBoundary name="مراجعة الفقه">
            <Suspense fallback={<Loading />}>
              <FiqhReviewPage />
            </Suspense>
          </RouteErrorBoundary>
        </AdminRouteGuard>
      </Route>
      <Route path="/admin/fiqh-quality">
        <AdminRouteGuard>
          <RouteErrorBoundary name="جودة الفقه">
            <Suspense fallback={<Loading />}>
              <FiqhQualityPage />
            </Suspense>
          </RouteErrorBoundary>
        </AdminRouteGuard>
      </Route>
      <Route path="/admin/dashboard">
        <AdminRouteGuard>
          <RouteErrorBoundary name="لوحة التحكم">
            <Suspense fallback={<Loading />}>
              <AdminDashboardPage />
            </Suspense>
          </RouteErrorBoundary>
        </AdminRouteGuard>
      </Route>
      <Route path="/admin">
        <AdminRouteGuard>
          <RouteErrorBoundary name="الإدارة">
            <Suspense fallback={<Loading />}>
              <AdminPage />
            </Suspense>
          </RouteErrorBoundary>
        </AdminRouteGuard>
      </Route>
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
              <WidgetErrorBoundary name="NavBar">
                <NavBar />
              </WidgetErrorBoundary>
              <main id="main-content" className="app-main" tabIndex={-1}>
                <Router />
              </main>
              <SiteFooter />
              <WidgetErrorBoundary name="AssistantWidget">
                <AssistantFloatingWidget />
              </WidgetErrorBoundary>
            </div>
          </WouterRouter>
          </AuthProvider>
        </UserPreferencesProvider>
      </FontPreferenceProvider>
    </ThemePreferenceProvider>
  );
}

export default App;
