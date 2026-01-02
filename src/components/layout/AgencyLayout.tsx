import { ReactNode, useEffect, useState, createContext, useContext } from "react";
import { Navigate } from "react-router-dom";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AgencySidebar } from "./AgencySidebar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { PendingApprovalBanner } from "@/components/agency/PendingApprovalBanner";

interface AgencyLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
}

// Context to share isAgencyActive state
interface AgencyStatusContextType {
  isAgencyActive: boolean;
}

const AgencyStatusContext = createContext<AgencyStatusContextType>({ isAgencyActive: true });

export const useAgencyStatus = () => useContext(AgencyStatusContext);

export function AgencyLayout({ children, title, description, actions }: AgencyLayoutProps) {
  const { user, loading, role } = useAuth();
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [agencyName, setAgencyName] = useState<string | null>(null);
  const [isAgencyActive, setIsAgencyActive] = useState(true);
  const [loadingAgency, setLoadingAgency] = useState(true);

  useEffect(() => {
    const fetchAgencyInfo = async () => {
      if (!user) {
        setLoadingAgency(false);
        return;
      }

      try {
        // Direct query to agency_users table
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

        // Fetch agency name and active status
        const { data: agency } = await supabase
          .from('agencies')
          .select('nome_fantasia, razao_social, active')
          .eq('id', fetchedAgencyId)
          .single();

        if (agency) {
          setAgencyName(agency.nome_fantasia || agency.razao_social);
          setIsAgencyActive(agency.active);
        }
      } catch (err) {
        console.error('Error fetching agency info:', err);
      }
      
      setLoadingAgency(false);
    };

    fetchAgencyInfo();
  }, [user]);

  // Show loading while checking auth
  if (loading || loadingAgency) {
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

  // Redirect internal users to their portal
  if (role === 'master' || role === 'analyst') {
    return <Navigate to="/" replace />;
  }

  // Block access for invalid roles (only agency_user allowed)
  if (role !== 'agency_user') {
    return <Navigate to="/auth" replace />;
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

  return (
    <AgencyStatusContext.Provider value={{ isAgencyActive }}>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AgencySidebar />
          <SidebarInset className="flex-1">
            <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
              <SidebarTrigger className="-ml-2" />
              <div className="flex-1">
                <h1 className="text-lg font-semibold">{title}</h1>
                {description && (
                  <p className="text-sm text-muted-foreground">{description}</p>
                )}
              </div>
              {actions && <div className="flex items-center gap-2">{actions}</div>}
              {agencyName && (
                <div className="text-right">
                  <p className="text-sm font-medium">{agencyName}</p>
                  <p className="text-xs text-muted-foreground">Imobiliária Parceira</p>
                </div>
              )}
            </header>
            <main className="flex-1 p-6">
              {!isAgencyActive && (
                <PendingApprovalBanner className="mb-6" />
              )}
              {children}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AgencyStatusContext.Provider>
  );
}
