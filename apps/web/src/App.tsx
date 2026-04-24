import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Explore from "./pages/Explore";
import Compare from "./pages/Compare";
import Themes from "./pages/Themes";
import Countries from "./pages/Countries";
import About from "./pages/About";
import Reports from "./pages/Reports";
import Contact from "./pages/Contact";
import YouthIndex from "./pages/YouthIndex";
import Insights from "./pages/Insights";
import Dashboard from "./pages/Dashboard";
import Glossary from "./pages/resources/Glossary";
import FAQ from "./pages/resources/FAQ";
import Methodology from "./pages/resources/Methodology";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import AskAI from "./pages/AskAI";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/landing" element={<Landing />} />
            <Route path="/" element={<Index />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/themes" element={<Themes />} />
            <Route path="/countries" element={<Countries />} />
            <Route path="/about" element={<About />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/youth-index" element={<YouthIndex />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/ask-ai" element={<AskAI />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/resources/glossary" element={<Glossary />} />
            <Route path="/resources/faq" element={<FAQ />} />
            <Route path="/resources/methodology" element={<Methodology />} />
            <Route path="/auth/signin" element={<SignIn />} />
            <Route path="/auth/signup" element={<SignUp />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
