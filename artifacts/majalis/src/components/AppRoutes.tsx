"use client";

import { Suspense, lazy, type ComponentType } from "react";
import { Redirect, Route, Switch, useLocation } from "wouter";
import { AdminRouteGuard } from "@/components/AdminRouteGuard";
import AboutPage from "@/views/AboutPage";
import PrivacyPage from "@/views/PrivacyPage";
import TermsPage from "@/views/TermsPage";
import ContactPage from "@/views/ContactPage";
import NotFound from "@/views/not-found";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { usePageSeo } from "@/lib/seo";
import { LazyRouteFallback } from "@/components/LazyRouteFallback";

const CalendarPage = lazy(() => import("@/views/CalendarPage"));
const SearchPage = lazy(() => import("@/views/SearchPage"));
const TopicPage = lazy(() => import("@/views/TopicPage"));
const TopicsIndexPage = lazy(() => import("@/views/TopicsIndexPage"));
const ScientificAnnouncementDetailPage = lazy(() => import("@/views/ScientificAnnouncementDetailPage"));
const AdhkarPage = lazy(() => import("@/views/AdhkarPage"));
const QuizPage = lazy(() => import("@/views/QuizPage"));
const LoginPage = lazy(() => import("@/views/LoginPage"));
const RegisterPage = lazy(() => import("@/views/RegisterPage"));
const AuthCallbackPage = lazy(() => import("@/views/AuthCallbackPage"));
const UserStatsPage = lazy(() => import("@/views/UserStatsPage"));
const TranscribePage = lazy(() => import("@/views/TranscribePage"));
const AssistantPage = lazy(() => import("@/views/AssistantPage"));
const CardsPage = lazy(() => import("@/views/CardsPage"));
const PrayerTimesPage = lazy(() => import("@/views/PrayerTimesPage"));

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
const AdminDashboardPage = lazy(() => import("@/views/admin/AdminDashboardPage"));
const AutoContentPage = lazy(() => import("@/views/admin/AutoContentPage"));
const FiqhReviewPage = lazy(() => import("@/views/admin/FiqhReviewPage"));
const FiqhQualityPage = lazy(() => import("@/views/admin/FiqhQualityPage"));
const AutonomousPlatformPage = lazy(() => import("@/views/admin/AutonomousPlatformPage"));
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

function QuranComingSoon() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: "60vh", gap: "1rem",
      fontFamily: "inherit", direction: "rtl", textAlign: "center", padding: "2rem",
    }}>
      <span style={{ fontSize: "3rem", opacity: 0.4 }}>📖</span>
      <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "var(--text-base, #1a1a1a)" }}>قريباً</h2>
      <p style={{ margin: 0, color: "var(--text-muted, #6b7280)", fontSize: "1rem" }}>
        قسم القرآن الكريم قيد التطوير
      </p>
    </div>
  );
}

/** Client routes not handled by App Router SEO pages. */
export default function AppRoutes() {
  return (
    <>
      <SeoManager />
      <Switch>
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
        <Route path="/calendar"><SafeLazyRoute component={CalendarPage} /></Route>
        <Route path="/kuwait-lessons"><Redirect to="/lessons" /></Route>
        <Route path="/announcements"><Redirect to="/lessons" /></Route>
        <Route path="/courses"><Redirect to="/lessons?tab=courses" /></Route>
        <Route path="/adhkar"><SafeLazyRoute component={AdhkarPage} /></Route>
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
        <Route path="/condolences"><Redirect to="/" /></Route>
        <Route path="/transcribe">
          <ErrorBoundary>
            <Suspense fallback={<LazyRouteFallback />}>
              <TranscribePage />
            </Suspense>
          </ErrorBoundary>
        </Route>
        <Route path="/quran-live" component={QuranComingSoon} />
        <Route path="/quran/tajweed" component={QuranComingSoon} />
        <Route path="/quran/surah-stories/:number" component={QuranComingSoon} />
        <Route path="/quran/surah-stories" component={QuranComingSoon} />
        <Route path="/quran-radio" component={QuranComingSoon} />
        <Route path="/quran" component={QuranComingSoon} />
        <Route path="/prayer-times"><SafeLazyRoute component={PrayerTimesPage} /></Route>
        <Route path="/prayer-ranks"><Redirect to="/prayer-times?tab=ranks" /></Route>
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
        <Route path="/auth/callback"><SafeLazyRoute component={AuthCallbackPage} /></Route>
        <Route path="/stats"><SafeLazyRoute component={UserStatsPage} /></Route>
        <Route path="/profile"><SafeLazyRoute component={UserStatsPage} /></Route>
        <Route path="/admin/auto-content">
          <AdminRouteGuard>
            <ErrorBoundary>
              <Suspense fallback={<LazyRouteFallback />}>
                <AutoContentPage />
              </Suspense>
            </ErrorBoundary>
          </AdminRouteGuard>
        </Route>
        <Route path="/admin/fiqh-review">
          <AdminRouteGuard>
            <ErrorBoundary>
              <Suspense fallback={<LazyRouteFallback />}>
                <FiqhReviewPage />
              </Suspense>
            </ErrorBoundary>
          </AdminRouteGuard>
        </Route>
        <Route path="/admin/fiqh-quality">
          <AdminRouteGuard>
            <ErrorBoundary>
              <Suspense fallback={<LazyRouteFallback />}>
                <FiqhQualityPage />
              </Suspense>
            </ErrorBoundary>
          </AdminRouteGuard>
        </Route>
        <Route path="/admin/dashboard">
          <AdminRouteGuard>
            <ErrorBoundary>
              <Suspense fallback={<LazyRouteFallback />}>
                <AdminDashboardPage />
              </Suspense>
            </ErrorBoundary>
          </AdminRouteGuard>
        </Route>
        <Route path="/admin/autonomous-platform">
          <AdminRouteGuard>
            <ErrorBoundary>
              <Suspense fallback={<LazyRouteFallback />}>
                <AutonomousPlatformPage />
              </Suspense>
            </ErrorBoundary>
          </AdminRouteGuard>
        </Route>
        <Route path="/admin">
          <AdminRouteGuard>
            <ErrorBoundary>
              <Suspense fallback={<LazyRouteFallback />}>
                <AdminPage />
              </Suspense>
            </ErrorBoundary>
          </AdminRouteGuard>
        </Route>
        <Route component={NotFound} />
      </Switch>
    </>
  );
}
