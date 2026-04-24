import React, { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ContentProvider } from "@/contexts/ContentContext";
import { UserPreferencesProvider } from "@/contexts/UserPreferencesContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import CookieConsent from "@/components/CookieConsent";
import PublicLayout from "@/layouts/PublicLayout";
import DashboardLayout from "@/layouts/DashboardLayout";
import PageTransition from "@/components/PageTransition";

// Critical pages - static imports
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import NotFound from "./pages/NotFound";

// Lazy-loaded pages
const Explore = lazy(() => import("./pages/Explore"));
const Compare = lazy(() => import("./pages/Compare"));
const Themes = lazy(() => import("./pages/Themes"));
const Countries = lazy(() => import("./pages/Countries"));
const About = lazy(() => import("./pages/About"));
const Reports = lazy(() => import("./pages/Reports"));
const Contact = lazy(() => import("./pages/Contact"));
const YouthIndex = lazy(() => import("./pages/YouthIndex"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Insights = lazy(() => import("./pages/Insights"));
const PolicyMonitor = lazy(() => import("./pages/PolicyMonitor"));
const NaturalLanguageQuery = lazy(() => import("./pages/NaturalLanguageQuery"));
const Experts = lazy(() => import("./pages/Experts"));
const Admin = lazy(() => import("./pages/Admin"));
const Settings = lazy(() => import("./pages/Settings"));
const Glossary = lazy(() => import("./pages/resources/Glossary"));
const FAQ = lazy(() => import("./pages/resources/FAQ"));
const Methodology = lazy(() => import("./pages/resources/Methodology"));
const CountryProfilePage = lazy(() => import("./pages/CountryProfilePage"));
const DataUpload = lazy(() => import("./pages/DataUpload"));
const ContentManager = lazy(() => import("./pages/admin/ContentManager"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <LanguageProvider>
  <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
          <ContentProvider>
          <UserPreferencesProvider>
          <AnimatePresence mode="wait">
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
            <Routes>
              {/* Landing - standalone layout */}
              <Route path="/landing" element={<PageTransition><Landing /></PageTransition>} />

              {/* Auth - standalone layout */}
              <Route path="/auth/signin" element={<PageTransition><SignIn /></PageTransition>} />
              <Route path="/auth/signup" element={<PageTransition><SignUp /></PageTransition>} />

              {/* Public pages - shared Navbar + Footer layout */}
              <Route path="/" element={<PublicLayout><PageTransition><Index /></PageTransition></PublicLayout>} />
              <Route path="/explore" element={<PublicLayout><PageTransition><Explore /></PageTransition></PublicLayout>} />
              <Route path="/compare" element={<PublicLayout><PageTransition><Compare /></PageTransition></PublicLayout>} />
              <Route path="/themes" element={<PublicLayout><PageTransition><Themes /></PageTransition></PublicLayout>} />
              <Route path="/countries" element={<PublicLayout><PageTransition><Countries /></PageTransition></PublicLayout>} />
              <Route path="/countries/:id" element={<PublicLayout><PageTransition><CountryProfilePage /></PageTransition></PublicLayout>} />
              <Route path="/about" element={<PublicLayout><PageTransition><About /></PageTransition></PublicLayout>} />
              <Route path="/reports" element={<PublicLayout><PageTransition><Reports /></PageTransition></PublicLayout>} />
              <Route path="/contact" element={<PublicLayout><PageTransition><Contact /></PageTransition></PublicLayout>} />
              <Route path="/youth-index" element={<PublicLayout><PageTransition><YouthIndex /></PageTransition></PublicLayout>} />
              <Route path="/insights" element={<PublicLayout><PageTransition><Insights /></PageTransition></PublicLayout>} />
              <Route path="/policy-monitor" element={<PublicLayout><PageTransition><PolicyMonitor /></PageTransition></PublicLayout>} />
              <Route path="/ask" element={<PublicLayout><PageTransition><NaturalLanguageQuery /></PageTransition></PublicLayout>} />
              <Route path="/experts" element={<PublicLayout><PageTransition><Experts /></PageTransition></PublicLayout>} />
              <Route path="/resources/glossary" element={<PublicLayout><PageTransition><Glossary /></PageTransition></PublicLayout>} />
              <Route path="/resources/faq" element={<PublicLayout><PageTransition><FAQ /></PageTransition></PublicLayout>} />
              <Route path="/resources/methodology" element={<PublicLayout><PageTransition><Methodology /></PageTransition></PublicLayout>} />

              {/* Dashboard pages */}
              <Route path="/dashboard" element={<DashboardLayout><PageTransition><Dashboard /></PageTransition></DashboardLayout>} />
              <Route path="/dashboard/explore" element={<DashboardLayout><PageTransition><Explore /></PageTransition></DashboardLayout>} />
              <Route path="/dashboard/countries" element={<DashboardLayout><PageTransition><Countries /></PageTransition></DashboardLayout>} />
              <Route path="/dashboard/countries/:id" element={<DashboardLayout><PageTransition><CountryProfilePage /></PageTransition></DashboardLayout>} />
              <Route path="/dashboard/youth-index" element={<DashboardLayout><PageTransition><YouthIndex /></PageTransition></DashboardLayout>} />
              <Route path="/dashboard/compare" element={<DashboardLayout><PageTransition><Compare /></PageTransition></DashboardLayout>} />
              <Route path="/dashboard/insights" element={<DashboardLayout><PageTransition><Insights /></PageTransition></DashboardLayout>} />
              <Route path="/dashboard/ask" element={<DashboardLayout><PageTransition><NaturalLanguageQuery /></PageTransition></DashboardLayout>} />
              <Route path="/dashboard/policy-monitor" element={<DashboardLayout><PageTransition><PolicyMonitor /></PageTransition></DashboardLayout>} />
              <Route path="/dashboard/experts" element={<DashboardLayout><PageTransition><Experts /></PageTransition></DashboardLayout>} />
              <Route path="/dashboard/reports" element={<DashboardLayout><PageTransition><Reports /></PageTransition></DashboardLayout>} />
              <Route path="/settings" element={<DashboardLayout><PageTransition><Settings /></PageTransition></DashboardLayout>} />
              <Route path="/admin" element={<DashboardLayout><PageTransition><Admin /></PageTransition></DashboardLayout>} />
              <Route path="/admin/cms" element={<DashboardLayout><PageTransition><ContentManager /></PageTransition></DashboardLayout>} />
              <Route path="/dashboard/data-upload" element={<DashboardLayout><PageTransition><DataUpload /></PageTransition></DashboardLayout>} />

              {/* Catch-all */}
              <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
            </Routes>
            </Suspense>
          </AnimatePresence>
          </UserPreferencesProvider>
          </ContentProvider>
          </AuthProvider>
          <CookieConsent />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
  </LanguageProvider>
);

export default App;
