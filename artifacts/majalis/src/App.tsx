import { Switch, Route, Router as WouterRouter } from "wouter";
import { AuthProvider } from "@/components/AuthProvider";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import HomePage from "@/pages/HomePage";
import AboutPage from "@/pages/AboutPage";
import PrivacyPage from "@/pages/PrivacyPage";
import TermsPage from "@/pages/TermsPage";
import ContactPage from "@/pages/ContactPage";
import SearchPage from "@/pages/SearchPage";
import LessonsPage from "@/pages/LessonsPage";
import LessonDetailPage from "@/pages/LessonDetailPage";
import MyLessonsPage from "@/pages/MyLessonsPage";
import SheikhsPage from "@/pages/SheikhsPage";
import SheikhDetailPage from "@/pages/SheikhDetailPage";
import LibraryPage from "@/pages/LibraryPage";
import LibraryDetailPage from "@/pages/LibraryDetailPage";
import MiraclesPage from "@/pages/MiraclesPage";
import MiracleDetailPage from "@/pages/MiracleDetailPage";
import FawaidPage from "@/pages/FawaidPage";
import QaPage from "@/pages/QaPage";
import QaDetailPage from "@/pages/QaDetailPage";
import LoginPage from "@/pages/LoginPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ProfilePage from "@/pages/ProfilePage";
import AdminPage from "@/pages/AdminPage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/search/:q" component={SearchPage} />
      <Route path="/search" component={SearchPage} />
      <Route path="/lessons/:id" component={LessonDetailPage} />
      <Route path="/lessons" component={LessonsPage} />
      <Route path="/my-lessons" component={MyLessonsPage} />
      <Route path="/sheikhs" component={SheikhsPage} />
      <Route path="/sheikhs/:id" component={SheikhDetailPage} />
      <Route path="/library/:id" component={LibraryDetailPage} />
      <Route path="/library" component={LibraryPage} />
      <Route path="/miracles/:id" component={MiracleDetailPage} />
      <Route path="/miracles" component={MiraclesPage} />
      <Route path="/fawaid" component={FawaidPage} />
      <Route path="/qa/:id" component={QaDetailPage} />
      <Route path="/qa" component={QaPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/admin" component={AdminPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <div style={{ minHeight: "100vh", direction: "rtl", display: "flex", flexDirection: "column" }}>
          <NavBar />
          <main style={{ flex: 1 }}>
            <Router />
          </main>
          <Footer />
        </div>
      </WouterRouter>
    </AuthProvider>
  );
}

export default App;
