import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { AuthProvider } from "@/components/AuthProvider";
import { AdminRouteGuard } from "@/components/AdminRouteGuard";
import NavBar from "@/components/NavBar";
import HomePage from "@/pages/HomePage";
import AboutPage from "@/pages/AboutPage";
import SearchPage from "@/pages/SearchPage";
import LessonsPage from "@/pages/LessonsPage";
import SheikhsPage from "@/pages/SheikhsPage";
import SheikhDetailPage from "@/pages/SheikhDetailPage";
import LibraryPage from "@/pages/LibraryPage";
import MiraclesPage from "@/pages/MiraclesPage";
import FawaidPage from "@/pages/FawaidPage";
import QaPage from "@/pages/QaPage";
import AssistantPage from "@/pages/AssistantPage";
import CondolencesPage from "@/pages/CondolencesPage";
import TranscribePage from "@/pages/TranscribePage";
import CardsPage from "@/pages/CardsPage";
import LoginPage from "@/pages/LoginPage";
import AdminPage from "@/pages/AdminPage";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import NotFound from "@/pages/not-found";
import { usePageSeo } from "@/lib/seo";

function SeoManager() {
  const [location] = useLocation();
  usePageSeo(location);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/search/:q" component={SearchPage} />
      <Route path="/search" component={SearchPage} />
      <Route path="/lessons" component={LessonsPage} />
      <Route path="/sheikhs" component={SheikhsPage} />
      <Route path="/sheikhs/:id" component={SheikhDetailPage} />
      <Route path="/library" component={LibraryPage} />
      <Route path="/miracles" component={MiraclesPage} />
      <Route path="/fawaid" component={FawaidPage} />
      <Route path="/qa" component={QaPage} />
      <Route path="/assistant" component={AssistantPage} />
      <Route path="/condolences" component={CondolencesPage} />
      <Route path="/transcribe" component={TranscribePage} />
      <Route path="/cards" component={CardsPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/admin/dashboard">
        <AdminRouteGuard>
          <AdminDashboardPage />
        </AdminRouteGuard>
      </Route>
      <Route path="/admin">
        <AdminRouteGuard>
          <AdminPage />
        </AdminRouteGuard>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
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
  );
}

export default App;
