import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SubdomainProvider, useSubdomain } from "@/contexts/SubdomainContext";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Agencies from "./pages/Agencies";
import AgencyForm from "./pages/AgencyForm";
import Analyses from "./pages/Analyses";
import AnalysisForm from "./pages/AnalysisForm";
import Commissions from "./pages/Commissions";
import FinancialDashboard from "./pages/FinancialDashboard";
import DocumentCenter from "./pages/DocumentCenter";
import AuditViewer from "./pages/AuditViewer";
import UserManagement from "./pages/UserManagement";
import DigitalAcceptance from "./pages/DigitalAcceptance";
import TicketCenter from "./pages/TicketCenter";
import Contracts from "./pages/Contracts";
import ContractDetail from "./pages/ContractDetail";
import NotFound from "./pages/NotFound";

// Agency Portal Pages
import { 
  AgencyDashboard, 
  AgencyAnalyses, 
  AgencyContracts, 
  AgencyContractDetail,
  AgencySupport,
  AgencyNewAnalysis,
  AgencyCollaborators,
  AgencyClaims,
  AgencyClaimDetail,
  AgencyNewClaim
} from "./pages/agency";

// Internal Portal Pages
import Claims from "./pages/Claims";
import ClaimDetail from "./pages/ClaimDetail";

const queryClient = new QueryClient();

/**
 * Internal Portal Routes (app.tridotscapital.com)
 * These are the routes for Tridots team members (master, analyst)
 */
function InternalRoutes() {
  return (
    <>
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
      <Route path="/documents" element={<DocumentCenter />} />
      <Route path="/audit" element={<AuditViewer />} />
      <Route path="/users" element={<UserManagement />} />
      <Route path="/accept/:analysisId" element={<DigitalAcceptance />} />
      <Route path="/tickets" element={<TicketCenter />} />
      <Route path="/contracts" element={<Contracts />} />
      <Route path="/contracts/:id" element={<ContractDetail />} />
      <Route path="/claims" element={<Claims />} />
      <Route path="/claims/:id" element={<ClaimDetail />} />
    </>
  );
}

/**
 * Agency Portal Routes (portal.tridotscapital.com)
 * These are the routes for agency users
 * In production subdomain: served at root (/)
 * In dev/preview: served at /agency/*
 */
function AgencyRoutes({ atRoot = false }: { atRoot?: boolean }) {
  const prefix = atRoot ? "" : "/agency";
  
  return (
    <>
      <Route path={`${prefix}`} element={<AgencyDashboard />} />
      <Route path={`${prefix}/analyses`} element={<AgencyAnalyses />} />
      <Route path={`${prefix}/analyses/new`} element={<AgencyNewAnalysis />} />
      <Route path={`${prefix}/contracts`} element={<AgencyContracts />} />
      <Route path={`${prefix}/contracts/:id`} element={<AgencyContractDetail />} />
      <Route path={`${prefix}/claims`} element={<AgencyClaims />} />
      <Route path={`${prefix}/claims/new`} element={<AgencyNewClaim />} />
      <Route path={`${prefix}/claims/:id`} element={<AgencyClaimDetail />} />
      <Route path={`${prefix}/collaborators`} element={<AgencyCollaborators />} />
      <Route path={`${prefix}/support`} element={<AgencySupport />} />
    </>
  );
}

/**
 * Router component that renders routes based on the current subdomain
 */
function AppRoutes() {
  const { isInternalPortal, isAgencyPortal, isUnknownPortal } = useSubdomain();

  return (
    <Routes>
      {/* Production: Internal Portal (app.tridotscapital.com) */}
      {isInternalPortal && (
        <>
          {InternalRoutes()}
          <Route path="*" element={<NotFound />} />
        </>
      )}

      {/* Production: Agency Portal (portal.tridotscapital.com) */}
      {isAgencyPortal && (
        <>
          <Route path="/auth" element={<Auth />} />
          {AgencyRoutes({ atRoot: true })}
          <Route path="*" element={<NotFound />} />
        </>
      )}

      {/* Development/Preview: Both portals available */}
      {isUnknownPortal && (
        <>
          {/* Tridots Team Routes */}
          {InternalRoutes()}
          
          {/* Agency Portal Routes (prefixed with /agency) */}
          {AgencyRoutes({ atRoot: false })}
          
          <Route path="*" element={<NotFound />} />
        </>
      )}
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SubdomainProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </SubdomainProvider>
  </QueryClientProvider>
);

export default App;
