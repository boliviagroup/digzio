import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Home from "./pages/Home";
import ForStudents from "./pages/ForStudents";
import ForProviders from "./pages/ForProviders";
import ForInstitutions from "./pages/ForInstitutions";
import HowItWorks from "./pages/HowItWorks";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Search from "./pages/Search";
import StudentDashboard from "./pages/StudentDashboard";
import ProviderDashboard from "./pages/ProviderDashboard";
import ListProperty from "./pages/ListProperty";
import AdminDashboard from "./pages/AdminDashboard";
import PropertyDetail from "./pages/PropertyDetail";
import CookieConsent from "./components/CookieConsent";

// Guard component: only renders children if user has ADMIN role
function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();

  if (!isAuthenticated || !user) {
    navigate("/");
    return null;
  }
  if (user.role !== "ADMIN") {
    navigate("/");
    return null;
  }
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/students" component={ForStudents} />
      <Route path="/providers" component={ForProviders} />
      <Route path="/institutions" component={ForInstitutions} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/search" component={Search} />
      <Route path="/property/:id" component={PropertyDetail} />
      <Route path="/dashboard/student" component={StudentDashboard} />
      <Route path="/dashboard/provider" component={ProviderDashboard} />
      <Route path="/list-property" component={ListProperty} />
      <Route path="/admin">{() => <AdminRoute component={AdminDashboard} />}</Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
            <CookieConsent />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
