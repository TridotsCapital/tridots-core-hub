import { ReactNode, useEffect, useState, createContext, useContext } from "react";
import { Navigate } from "react-router-dom";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AgencySidebar } from "./AgencySidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useSubdomain } from "@/contexts/SubdomainContext";
import { NpsProvider } from "@/contexts/NpsContext";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { PendingApprovalBanner } from "@/components/agency/PendingApprovalBanner";
import { BillingBlockedBanner } from "@/components/agency/BillingBlockedBanner";
import { ImpersonationBanner } from "@/components/agency/ImpersonationBanner";
import { isCorrectPortalForRole, getPortalUrlForRole } from "@/lib/subdomain";

interface AgencyLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
}

// Context to share agency status
interface AgencyStatusContextType {
  isAgencyActive: boolean;
  isAgencyStatusLoading: boolean;
  isBillingBlocked: boolean;
}

const AgencyStatusContext = createContext<AgencyStatusContextType>({
  isAgencyActive: true,
  isAgencyStatusLoading: true,
  isBillingBlocked: false,
});

export const useAgencyStatus = () => useContext(AgencyStatusContext);

export function AgencyLayout({ children, title, description, actions }: AgencyLayoutProps) {
  const { user, loading, role, profile } = useAuth();
  const { portal, isProduction } = useSubdomain();
  const {
    isImpersonating,
    impersonatedAgencyId,
    impersonatedAgencyName,
    isAgencyActive: impersonatedIsActive,
    isBillingBlocked: impersonatedIsBillingBlocked,
  } = useImpersonation();

  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [agencyName, setAgencyName] = useState<string | null>(null);
  const [isAgencyActive, setIsAgencyActive] = useState(true);
  const [isBillingBlocked, setIsBillingBlocked] = useState(false);
  const [loadingAgency, setLoadingAgency] = useState(true);
  const [agencyStatusLoading, setAgencyStatusLoading] = useState(true);

  const isInternalUser = role === "master" || role === "analyst";

  useEffect(() => {
    // If impersonating, use data from ImpersonationContext directly
    if (isImpersonating && impersonatedAgencyId) {
      setAgencyId(impersonatedAgencyId);
      setAgencyName(impersonatedAgencyName);
      setIsAgencyActive(impersonatedIsActive);
      setIsBillingBlocked(impersonatedIsBillingBlocked);
      setLoadingAgency(false);
      setAgencyStatusLoading(false);
      return;
    }

    const fetchAgencyInfo = async () => {
      if (!user) {
        setLoadingAgency(false);
        return;
      }

      try {
        const { data: agencyUserData, error } = await supabase
          .from('agency_users' as any)
          .select('agency_id')
          .eq('user_id', user.id)
          .single();

        if (error || !agencyUserData) {
          setLoadingAgency(false);
          return;
        }

        const fetchedAgencyId = (agencyUserData as any).agency_id;
        setAgencyId(fetchedAgencyId);

        const { data: agency } = await supabase
          .from('agencies')
          .select('nome_fantasia, razao_social, active, billing_blocked_at')
          .eq('id', fetchedAgencyId)
          .single();

        if (agency) {
          setAgencyName(agency.nome_fantasia || agency.razao_social);
          setIsAgencyActive(agency.active);
          setIsBillingBlocked(agency.billing_blocked_at !== null);
        }
      } catch (err) {
        console.error('Error fetching agency info:', err);
      }
      
      setLoadingAgency(false);
      setAgencyStatusLoading(false);
    };

    fetchAgencyInfo();
  }, [user, isImpersonating, impersonatedAgencyId, impersonatedAgencyName, impersonatedIsActive, impersonatedIsBillingBlocked]);

  // Show loading while checking auth
  const { impersonationLoading } = useImpersonation();

  if (loading || loadingAgency || impersonationLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Allow impersonating internal users to access the agency portal
  if (isImpersonating && isInternalUser) {
    // Skip all role/portal checks - internal user is impersonating
  } else {
    // In production, check if user is on correct portal
    if (isProduction && role && !isCorrectPortalForRole(portal, role)) {
      const correctUrl = getPortalUrlForRole(role);
      if (correctUrl) {
        window.location.href = correctUrl;
        return (
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Redirecionando para o portal correto...</p>
            </div>
          </div>
        );
      }
    }

    // Redirect internal users to their portal (dev environment)
    if (isInternalUser && !isProduction) {
      return <Navigate to="/" replace />;
    }

    // Block access for invalid roles (only agency_user allowed)
    if (role !== 'agency_user') {
      return <Navigate to="/auth" replace />;
    }
  }

  // Show error if no agency linked
  if (!agencyId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md p-6">
          <h2 className="text-xl font-semibold mb-2">Acesso Pendente</h2>
          <p className="text-muted-foreground mb-4">
            Sua conta ainda não está vinculada a uma imobiliária. 
            Entre em contato com a equipe Tridots para ativar seu acesso.
          </p>
        </div>
      </div>
    );
  }

  const layoutContent = (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AgencySidebar />
        <SidebarInset className="flex-1 flex flex-col overflow-hidden">
          {isImpersonating && <ImpersonationBanner />}
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
            <SidebarTrigger className="-ml-2" />
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold truncate">{title}</h1>
              {description && (
                <p className="text-sm text-muted-foreground truncate">{description}</p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
            {agencyName && (
              <div className="text-right shrink-0">
                <p className="text-sm font-medium">{agencyName}</p>
                {profile?.full_name && (
                  <p className="text-xs text-muted-foreground">{profile.full_name}</p>
                )}
                <div className="flex items-center justify-end gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                    {isImpersonating ? "Modo Suporte" : "Portal Imobiliária"}
                  </span>
                </div>
              </div>
            )}
          </header>
          <main className="flex-1 p-6 overflow-x-auto overflow-y-auto">
            {isBillingBlocked && (
              <BillingBlockedBanner className="mb-6" />
            )}
            {!isAgencyActive && !isBillingBlocked && (
              <PendingApprovalBanner className="mb-6" />
            )}
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );

  // When impersonating, skip NPS provider
  if (isImpersonating) {
    return (
      <AgencyStatusContext.Provider value={{ isAgencyActive, isAgencyStatusLoading: agencyStatusLoading, isBillingBlocked }}>
        {layoutContent}
      </AgencyStatusContext.Provider>
    );
  }

  return (
    <AgencyStatusContext.Provider value={{ isAgencyActive, isAgencyStatusLoading: agencyStatusLoading, isBillingBlocked }}>
      <NpsProvider agencyId={agencyId}>
        {layoutContent}
      </NpsProvider>
    </AgencyStatusContext.Provider>
  );
}
