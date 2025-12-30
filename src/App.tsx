import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import Explore from "./pages/Explore";
import Compare from "./pages/Compare";
import Themes from "./pages/Themes";
import Countries from "./pages/Countries";
import About from "./pages/About";
import Reports from "./pages/Reports";
import Contact from "./pages/Contact";
import YouthIndex from "./pages/YouthIndex";
import Glossary from "./pages/resources/Glossary";
import FAQ from "./pages/resources/FAQ";
import Methodology from "./pages/resources/Methodology";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/themes" element={<Themes />} />
            <Route path="/countries" element={<Countries />} />
            <Route path="/about" element={<About />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/youth-index" element={<YouthIndex />} />
            <Route path="/resources/glossary" element={<Glossary />} />
            <Route path="/resources/faq" element={<FAQ />} />
            <Route path="/resources/methodology" element={<Methodology />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
