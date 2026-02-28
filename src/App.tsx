import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/layout/AppLayout";

import NotFound from "./pages/NotFound";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import ForgotPassword from "./pages/auth/ForgotPassword";
import SplashScreen from "./components/SplashScreen";

import Dashboard from "./pages/Dashboard";
import ContentCalendar from "./pages/ContentCalendar";
import SchedulePost from "./pages/SchedulePost";
import Analytics from "./pages/Analytics";
import HashtagSuggestions from "./pages/HashtagSuggestions";
import EngagementMonitor from "./pages/EngagementMonitor";
import ContentCategories from "./pages/ContentCategories";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();


// ✅ Protected Route Component
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <SplashScreen />;

  if (!user) return <Navigate to="/signin" replace />;

  return children;
};

// Wrapper to show splash screen during initial auth loading
const AppRoutes = () => {
  const { isLoading } = useAuth();
  const [isSplashComplete, setIsSplashComplete] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsSplashComplete(true);
    }, 3000);

    return () => window.clearTimeout(timer);
  }, []);

  if (isLoading || !isSplashComplete) {
    return <SplashScreen />;
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/signin" replace />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/calendar" element={<ContentCalendar />} />
        <Route path="/schedule" element={<SchedulePost />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/hashtags" element={<HashtagSuggestions />} />
        <Route path="/engagement" element={<EngagementMonitor />} />
        <Route path="/categories" element={<ContentCategories />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
