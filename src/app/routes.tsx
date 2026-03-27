import { createBrowserRouter, Navigate, Outlet } from "react-router";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";

// Public pages (Authentication only)
import Login from "./pages/Login";
import LoginClean from "./pages/LoginClean";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Protected pages
import Dashboard from "./pages/Dashboard";
import Compare from "./pages/Compare";
import Reports from "./pages/Reports";
import ReportsHub from "./pages/ReportsHub";
import ScoutReportDetail from "./pages/ScoutReportDetail";
import History from "./pages/History";
import AnalysisDetail from "./pages/AnalysisDetail";
import Governance from "./pages/Governance";
import PlayersRanking from "./pages/PlayersRanking";
import PlayerDetails from "./pages/PlayerDetails";
import SmartMatch from "./pages/SmartMatch";
import Profile from "./pages/Profile";
import Squad from "./pages/Squad";
import ActionsDemo from "./pages/ActionsDemo";
import HealthAnalytics from "./pages/HealthAnalytics";
import ServiceDesk from "./pages/ServiceDesk";

// Root layout that provides contexts
function RootLayout() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    </LanguageProvider>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    ErrorBoundary: ErrorBoundary,
    children: [
      // Public routes - Authentication only
      {
        path: "/",
        Component: Login,
      },
      {
        path: "/login",
        Component: Login,
      },
      {
        path: "/login-clean",
        Component: LoginClean,
      },
      {
        path: "/forgot-password",
        Component: ForgotPassword,
      },
      {
        path: "/reset-password",
        Component: ResetPassword,
      },

      // Protected routes
      {
        path: "/dashboard",
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "/profile",
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: "/actions-demo",
        element: (
          <ProtectedRoute>
            <ActionsDemo />
          </ProtectedRoute>
        ),
      },
      {
        path: "/squad",
        element: (
          <ProtectedRoute>
            <Squad />
          </ProtectedRoute>
        ),
      },
      {
        path: "/players",
        element: (
          <ProtectedRoute>
            <PlayersRanking />
          </ProtectedRoute>
        ),
      },
      {
        path: "/players/:id",
        element: (
          <ProtectedRoute>
            <PlayerDetails />
          </ProtectedRoute>
        ),
      },
      {
        path: "/smart-match/:playerId",
        element: (
          <ProtectedRoute>
            <SmartMatch />
          </ProtectedRoute>
        ),
      },
      {
        path: "/compare",
        element: (
          <ProtectedRoute>
            <Compare />
          </ProtectedRoute>
        ),
      },
      {
        path: "/reports",
        element: (
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        ),
      },
      {
        path: "/reports/generate",
        element: (
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        ),
      },
      {
        path: "/reports/hub",
        element: (
          <ProtectedRoute>
            <ReportsHub />
          </ProtectedRoute>
        ),
      },
      {
        path: "/reports/:id",
        element: (
          <ProtectedRoute>
            <ScoutReportDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: "/history",
        element: (
          <ProtectedRoute>
            <History />
          </ProtectedRoute>
        ),
      },
      {
        path: "/analysis/:id",
        element: (
          <ProtectedRoute>
            <AnalysisDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: "/governance",
        element: (
          <ProtectedRoute>
            <Governance />
          </ProtectedRoute>
        ),
      },
      {
        path: "/health-analytics",
        element: (
          <ProtectedRoute>
            <HealthAnalytics />
          </ProtectedRoute>
        ),
      },
      {
        path: "/service-desk",
        element: (
          <ProtectedRoute>
            <ServiceDesk />
          </ProtectedRoute>
        ),
      },

      // Fallback - redirect to login
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
