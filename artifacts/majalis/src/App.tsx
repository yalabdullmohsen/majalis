import { Suspense, lazy, type ComponentType } from "react";
import { Redirect, Route, Switch, Router as WouterRouter, useLocation } from "wouter";
import { AuthProvider } from "@/components/AuthProvider";
import { FontPreferenceProvider } from "@/components/FontPreferenceProvider";
import { AdminRouteGuard } from "@/components/AdminRouteGuard";
import NavBar from "@/components/NavBar";
import SiteFooter from "@/components/SiteFooter";
import { AssistantFloatingWidget } from "@/components/assistant/AssistantFloatingWidget";
import HomePage from "@/pages/HomePage";
import AboutPage from "@/pages/AboutPage";
import PrivacyPage from "@/pages/PrivacyPage";
import TermsPage from "@/pages/TermsPage";
import ContactPage from "@/pages/ContactPage";
import NotFound from "@/pages/not-found";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { usePageSeo } from "@/lib/seo";
import { Loading } from "@/components/ui-common";

const CalendarPage = lazy(() => import("@/pages/CalendarPage"));
const SearchPage = lazy(() => import("@/pages/SearchPage"));
const LessonsPage = lazy(() => import("@/pages/LessonsPage"));
const LessonDetailPage = lazy(() => import("@/pages/LessonDetailPage"));
const ScientificAnnouncementDetailPage = lazy(() => import("@/pages/ScientificAnnouncementDetailPage"));
const LibraryPage = lazy(() => import("@/pages/LibraryPage"));
const MiraclesPage = lazy(() => import("@/pages/MiraclesPage"));
const FawaidPage = lazy(() => import("@/pages/FawaidPage"));
const AdhkarPage = lazy(() => import("@/pages/AdhkarPage"));
const QaPage = lazy(() => import("@/pages/QaPage"));
const QuizPage = lazy(() => import("@/pages/QuizPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const TranscribePage = lazy(() => import("@/pages/TranscribePage"));
const AssistantPage = lazy(() => import("@/pages/AssistantPage"));
const CondolencesPage = lazy(() => import("@/pages/CondolencesPage"));
const CardsPage = lazy(() => import("@/pages/CardsPage"));
const QuranPage = lazy(() => import("@/pages/QuranPage"));
const QuranRadioPage = lazy(() => import("@/pages/QuranRadioPage"));
const PrayerTimesPage = lazy(() => import("@/pages/PrayerTimesPage"));
const QiblaPage = lazy(() => import("@/pages/QiblaPage"));
const TasbihPage = lazy(() => import("@/pages/TasbihPage"));
const DailyWirdPage = lazy(() => import("@/pages/DailyWirdPage"));
const OccasionsPage = lazy(() => import("@/pages/OccasionsPage"));
const ArbaeenNawawiPage = lazy(() => import("@/pages/ArbaeenNawawiPage"));
const AdminPage = lazy(() => import("@/pages/AdminPage"));
const AdminDashboardPage = lazy(() => import("@/pages/admin/AdminDashboardPage"));

function SeoManager() {
  const [location] = useLocation();
  usePageSeo(location);
  return null;
}

function SafeLazyRoute({ component: Component }: { component: ComponentType }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Loading />}>
        <Component />
      </Suspense>
    </ErrorBoundary>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/search/:q"><SafeLazyRoute component={SearchPage} /></Route>
      <Route path="/search"><SafeLazyRoute component={SearchPage} /></Route>
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
      <Route path="/quran"><SafeLazyRoute component={QuranPage} /></Route>
      <Route path="/prayer-times"><SafeLazyRoute component={PrayerTimesPage} /></Route>
      <Route path="/qibla"><SafeLazyRoute component={QiblaPage} /></Route>
      <Route path="/tasbih"><SafeLazyRoute component={TasbihPage} /></Route>
      <Route path="/daily-wird"><SafeLazyRoute component={DailyWirdPage} /></Route>
      <Route path="/occasions"><SafeLazyRoute component={OccasionsPage} /></Route>
      <Route path="/arbaeen-nawawi"><SafeLazyRoute component={ArbaeenNawawiPage} /></Route>
      <Route path="/cards"><SafeLazyRoute component={CardsPage} /></Route>
      <Route path="/login"><SafeLazyRoute component={LoginPage} /></Route>
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
    <FontPreferenceProvider>
      <AuthProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
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
    </FontPreferenceProvider>
  );
}

export default App;
