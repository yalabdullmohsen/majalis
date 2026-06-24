import { Suspense, lazy, type ComponentType } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { AuthProvider } from "@/components/AuthProvider";
import { FontPreferenceProvider } from "@/components/FontPreferenceProvider";
import { AdminRouteGuard } from "@/components/AdminRouteGuard";
import NavBar from "@/components/NavBar";
import HomePage from "@/pages/HomePage";
import AboutPage from "@/pages/AboutPage";
import SearchPage from "@/pages/SearchPage";
import LessonsPage from "@/pages/LessonsPage";
import KuwaitLessonsPage from "@/pages/KuwaitLessonsPage";
import LessonsMapPage from "@/pages/LessonsMapPage";
import CalendarPage from "@/pages/CalendarPage";
import SeriesPage from "@/pages/SeriesPage";
import BooksPage from "@/pages/BooksPage";
import AudioLibraryPage from "@/pages/AudioLibraryPage";
import FavoritesPage from "@/pages/FavoritesPage";
import QuranPage from "@/pages/QuranPage";
import AdhkarPage from "@/pages/AdhkarPage";
import MosqueDetailPage from "@/pages/MosqueDetailPage";
import CurrentLessonsPage from "@/pages/CurrentLessonsPage";
import AnnouncementsPage from "@/pages/AnnouncementsPage";
import CoursesPage from "@/pages/CoursesPage";
import SheikhsPage from "@/pages/SheikhsPage";
import SheikhDetailPage from "@/pages/SheikhDetailPage";
import LibraryPage from "@/pages/LibraryPage";
import MiraclesPage from "@/pages/MiraclesPage";
import FawaidPage from "@/pages/FawaidPage";
import QaPage from "@/pages/QaPage";
import QuizPage from "@/pages/QuizPage";
import LoginPage from "@/pages/LoginPage";
import TranscribePage from "@/pages/TranscribePage";
import AssistantPage from "@/pages/AssistantPage";
import NotFound from "@/pages/not-found";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { usePageSeo } from "@/lib/seo";
import { Loading } from "@/components/ui-common";

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

function SafeRoute({ path, component: Component }: { path: string; component: ComponentType }) {
  return (
    <Route path={path}>
      <ErrorBoundary>
        <Component />
      </ErrorBoundary>
    </Route>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/search/:q" component={SearchPage} />
      <Route path="/search" component={SearchPage} />
      <Route path="/lessons" component={LessonsPage} />
      <Route path="/lessons-map" component={LessonsMapPage} />
      <Route path="/kuwait-lessons" component={KuwaitLessonsPage} />
      <Route path="/calendar" component={CalendarPage} />
      <Route path="/series" component={SeriesPage} />
      <Route path="/books" component={BooksPage} />
      <Route path="/audio-library" component={AudioLibraryPage} />
      <Route path="/favorites" component={FavoritesPage} />
      <Route path="/quran" component={QuranPage} />
      <Route path="/adhkar" component={AdhkarPage} />
      <Route path="/announcements" component={AnnouncementsPage} />
      <Route path="/lessons/current" component={CurrentLessonsPage} />
      <Route path="/courses" component={CoursesPage} />
      <Route path="/sheikhs" component={SheikhsPage} />
      <SafeRoute path="/sheikhs/:id" component={SheikhDetailPage} />
      <SafeRoute path="/mosques/:id" component={MosqueDetailPage} />
      <Route path="/library" component={LibraryPage} />
      <Route path="/miracles" component={MiraclesPage} />
      <Route path="/fawaid" component={FawaidPage} />
      <Route path="/qa" component={QaPage} />
      <Route path="/quiz" component={QuizPage} />
      <Route path="/assistant">
        <ErrorBoundary>
          <AssistantPage />
        </ErrorBoundary>
      </Route>
      <Route path="/condolences"><SafeLazyRoute component={CondolencesPage} /></Route>
      <Route path="/transcribe">
        <ErrorBoundary>
          <TranscribePage />
        </ErrorBoundary>
      </Route>
      <Route path="/cards"><SafeLazyRoute component={CardsPage} /></Route>
      <Route path="/login" component={LoginPage} />
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
