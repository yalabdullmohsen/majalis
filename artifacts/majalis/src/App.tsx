import { Suspense, lazy, type ComponentType } from "react";
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
import { Loading } from "@/components/ui-common";

const CalendarPage = lazy(() => import("@/views/CalendarPage"));
const SearchPage = lazy(() => import("@/views/SearchPage"));
const TopicPage = lazy(() => import("@/views/TopicPage"));
const TopicsIndexPage = lazy(() => import("@/views/TopicsIndexPage"));
const LessonsPage = lazy(() => import("@/views/LessonsPage"));
const LessonDetailPage = lazy(() => import("@/views/LessonDetailPage"));
const ScientificAnnouncementDetailPage = lazy(() => import("@/views/ScientificAnnouncementDetailPage"));
const LibraryPage = lazy(() => import("@/views/LibraryPage"));
const MiraclesPage = lazy(() => import("@/views/MiraclesPage"));
const FawaidPage = lazy(() => import("@/views/FawaidPage"));
const AdhkarPage = lazy(() => import("@/views/AdhkarPage"));
const QaPage = lazy(() => import("@/views/QaPage"));
const QuizPage = lazy(() => import("@/views/QuizPage"));
const LoginPage = lazy(() => import("@/views/LoginPage"));
const RegisterPage = lazy(() => import("@/views/RegisterPage"));
const TranscribePage = lazy(() => import("@/views/TranscribePage"));
const AssistantPage = lazy(() => import("@/views/AssistantPage"));
const CondolencesPage = lazy(() => import("@/views/CondolencesPage"));
const CardsPage = lazy(() => import("@/views/CardsPage"));
const QuranPage = lazy(() => import("@/views/QuranPage"));
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
const AdminPage = lazy(() => import("@/views/AdminPage"));
const LessonImportImagePage = lazy(() => import("@/views/admin/LessonImportImagePage"));
const LessonImportUrlPage = lazy(() => import("@/views/admin/LessonImportUrlPage"));
const AutomationSourcesPage = lazy(() => import("@/views/admin/AutomationSourcesPage"));
const AutomationReviewPage = lazy(() => import("@/views/admin/AutomationReviewPage"));
const AdminDashboardPage = lazy(() => import("@/views/admin/AdminDashboardPage"));
const AutoContentPage = lazy(() => import("@/views/admin/AutoContentPage"));
const FiqhReviewPage = lazy(() => import("@/views/admin/FiqhReviewPage"));
const FiqhQualityPage = lazy(() => import("@/views/admin/FiqhQualityPage"));
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
    <Suspense fallback={<Loading />}>
      <Component />
    </Suspense>
  );
}

function SurahStoryDetailRoute() {
  const [, params] = useRoute("/quran/surah-stories/:number");
  return (
    <Suspense fallback={<Loading />}>
      <SurahStoryDetailPage surahNumber={Number(params?.number) || 1} />
    </Suspense>
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
          <Suspense fallback={<Loading />}>
            <AssistantPage />
          </Suspense>
        </ErrorBoundary>
      </Route>
      <Route path="/condolences"><SafeLazyRoute component={CondolencesPage} /></Route>
      <Route path="/transcribe">
        <ErrorBoundary>
          <Suspense fallback={<Loading />}>
            <TranscribePage />
          </Suspense>
        </ErrorBoundary>
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
      <Route path="/admin/sources">
        <AdminRouteGuard>
          <ErrorBoundary>
            <Suspense fallback={<Loading />}>
              <AutomationSourcesPage />
            </Suspense>
          </ErrorBoundary>
        </AdminRouteGuard>
      </Route>
      <Route path="/admin/automation/sources">
        <AdminRouteGuard>
          <ErrorBoundary>
            <Suspense fallback={<Loading />}>
              <AutomationSourcesPage />
            </Suspense>
          </ErrorBoundary>
        </AdminRouteGuard>
      </Route>
      <Route path="/admin/automation/review">
        <AdminRouteGuard>
          <ErrorBoundary>
            <Suspense fallback={<Loading />}>
              <AutomationReviewPage />
            </Suspense>
          </ErrorBoundary>
        </AdminRouteGuard>
      </Route>
      <Route path="/admin/content-import/url">
        <AdminRouteGuard>
          <ErrorBoundary>
            <Suspense fallback={<Loading />}>
              <LessonImportUrlPage />
            </Suspense>
          </ErrorBoundary>
        </AdminRouteGuard>
      </Route>
      <Route path="/admin/content-import/image">
        <AdminRouteGuard>
          <ErrorBoundary>
            <Suspense fallback={<Loading />}>
              <LessonImportImagePage />
            </Suspense>
          </ErrorBoundary>
        </AdminRouteGuard>
      </Route>
      <Route path="/admin/auto-content">
        <AdminRouteGuard>
          <ErrorBoundary>
            <Suspense fallback={<Loading />}>
              <AutoContentPage />
            </Suspense>
          </ErrorBoundary>
        </AdminRouteGuard>
      </Route>
      <Route path="/admin/fiqh-review">
        <AdminRouteGuard>
          <ErrorBoundary>
            <Suspense fallback={<Loading />}>
              <FiqhReviewPage />
            </Suspense>
          </ErrorBoundary>
        </AdminRouteGuard>
      </Route>
      <Route path="/admin/fiqh-quality">
        <AdminRouteGuard>
          <ErrorBoundary>
            <Suspense fallback={<Loading />}>
              <FiqhQualityPage />
            </Suspense>
          </ErrorBoundary>
        </AdminRouteGuard>
      </Route>
      <Route path="/admin/dashboard">
        <AdminRouteGuard>
          <ErrorBoundary>
            <Suspense fallback={<Loading />}>
              <AdminDashboardPage />
            </Suspense>
          </ErrorBoundary>
        </AdminRouteGuard>
      </Route>
      <Route path="/admin">
        <AdminRouteGuard>
          <ErrorBoundary>
            <Suspense fallback={<Loading />}>
              <AdminPage />
            </Suspense>
          </ErrorBoundary>
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
