import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Agencies from "./pages/Agencies";
import AgencyForm from "./pages/AgencyForm";
import Analyses from "./pages/Analyses";
import AnalysisForm from "./pages/AnalysisForm";
import Commissions from "./pages/Commissions";
import FinancialDashboard from "./pages/FinancialDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/agencies" element={<Agencies />} />
            <Route path="/agencies/new" element={<AgencyForm />} />
            <Route path="/agencies/:id" element={<AgencyForm />} />
            <Route path="/analyses" element={<Analyses />} />
            <Route path="/analyses/new" element={<AnalysisForm />} />
            <Route path="/analyses/:id" element={<AnalysisForm />} />
            <Route path="/commissions" element={<Commissions />} />
            <Route path="/financial" element={<FinancialDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
