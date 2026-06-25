import { Suspense, lazy, type ComponentType } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { AuthProvider } from "@/components/AuthProvider";
import { FontPreferenceProvider } from "@/components/FontPreferenceProvider";
import { AdminRouteGuard } from "@/components/AdminRouteGuard";
import NavBar from "@/components/NavBar";
import HomePage from "@/pages/HomePage";
import AboutPage from "@/pages/AboutPage";
import NotFound from "@/pages/not-found";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { usePageSeo } from "@/lib/seo";
import { Loading } from "@/components/ui-common";

const SearchPage = lazy(() => import("@/pages/SearchPage"));
const LessonsPage = lazy(() => import("@/pages/LessonsPage"));
const LessonDetailPage = lazy(() => import("@/pages/LessonDetailPage"));
const KuwaitLessonsPage = lazy(() => import("@/pages/KuwaitLessonsPage"));
const CurrentLessonsPage = lazy(() => import("@/pages/CurrentLessonsPage"));
const AnnouncementsPage = lazy(() => import("@/pages/AnnouncementsPage"));
const CoursesPage = lazy(() => import("@/pages/CoursesPage"));
const SheikhsPage = lazy(() => import("@/pages/SheikhsPage"));
const SheikhDetailPage = lazy(() => import("@/pages/SheikhDetailPage"));
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
      <Route path="/search/:q"><SafeLazyRoute component={SearchPage} /></Route>
      <Route path="/search"><SafeLazyRoute component={SearchPage} /></Route>
      <Route path="/lessons/:id"><SafeLazyRoute component={LessonDetailPage} /></Route>
      <Route path="/lessons"><SafeLazyRoute component={LessonsPage} /></Route>
      <Route path="/kuwait-lessons"><SafeLazyRoute component={KuwaitLessonsPage} /></Route>
      <Route path="/announcements"><SafeLazyRoute component={AnnouncementsPage} /></Route>
      <Route path="/lessons/current"><SafeLazyRoute component={CurrentLessonsPage} /></Route>
      <Route path="/courses"><SafeLazyRoute component={CoursesPage} /></Route>
      <Route path="/sheikhs/:id"><SafeLazyRoute component={SheikhDetailPage} /></Route>
      <Route path="/sheikhs"><SafeLazyRoute component={SheikhsPage} /></Route>
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
          <div style={{ minHeight: "100vh", direction: "rtl" }}>
            <SeoManager />
            <NavBar />
            <main>
              <Router />
            </main>
          </div>
        </WouterRouter>
      </AuthProvider>
    </FontPreferenceProvider>
  );
}

export default App;
