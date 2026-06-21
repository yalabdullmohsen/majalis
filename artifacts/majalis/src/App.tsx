import { Switch, Route, Router as WouterRouter } from "wouter";
import { AuthProvider } from "@/components/AuthProvider";
import NavBar from "@/components/NavBar";
import HomePage from "@/pages/HomePage";
import LessonsPage from "@/pages/LessonsPage";
import SheikhsPage from "@/pages/SheikhsPage";
import SheikhDetailPage from "@/pages/SheikhDetailPage";
import LibraryPage from "@/pages/LibraryPage";
import MiraclesPage from "@/pages/MiraclesPage";
import FawaidPage from "@/pages/FawaidPage";
import LoginPage from "@/pages/LoginPage";
import AdminPage from "@/pages/AdminPage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/lessons" component={LessonsPage} />
      <Route path="/sheikhs" component={SheikhsPage} />
      <Route path="/sheikhs/:id" component={SheikhDetailPage} />
      <Route path="/library" component={LibraryPage} />
      <Route path="/miracles" component={MiraclesPage} />
      <Route path="/fawaid" component={FawaidPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/admin" component={AdminPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <div style={{ minHeight: "100vh", direction: "rtl" }}>
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
