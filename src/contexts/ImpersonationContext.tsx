import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams } from "react-router-dom";

interface ImpersonationContextType {
  isImpersonating: boolean;
  impersonatedAgencyId: string | null;
  impersonatedAgencyName: string | null;
  isAgencyActive: boolean;
  isBillingBlocked: boolean;
  stopImpersonation: () => void;
}

const ImpersonationContext = createContext<ImpersonationContextType>({
  isImpersonating: false,
  impersonatedAgencyId: null,
  impersonatedAgencyName: null,
  isAgencyActive: true,
  isBillingBlocked: false,
  stopImpersonation: () => {},
});

export const useImpersonation = () => useContext(ImpersonationContext);

const SESSION_KEY = "tridots_impersonation";

interface StoredImpersonation {
  agencyId: string;
  agencyName: string;
  isActive: boolean;
  isBillingBlocked: boolean;
}

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const { role } = useAuth();
  const [searchParams] = useSearchParams();

  const [state, setState] = useState<StoredImpersonation | null>(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const isAllowedRole = role === "master" || role === "analyst";

  // Check URL param on mount
  useEffect(() => {
    const impersonateId = searchParams.get("impersonate");
    if (!impersonateId || !isAllowedRole) return;

    // If already impersonating this agency, skip
    if (state?.agencyId === impersonateId) return;

    const fetchAgency = async () => {
      const { data: agency } = await supabase
        .from("agencies")
        .select("id, nome_fantasia, razao_social, active, billing_blocked_at")
        .eq("id", impersonateId)
        .single();

      if (agency) {
        const newState: StoredImpersonation = {
          agencyId: agency.id,
          agencyName: agency.nome_fantasia || agency.razao_social,
          isActive: agency.active,
          isBillingBlocked: agency.billing_blocked_at !== null,
        };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(newState));
        setState(newState);
      }
    };

    fetchAgency();
  }, [searchParams, isAllowedRole]); // eslint-disable-line react-hooks/exhaustive-deps

  const stopImpersonation = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setState(null);
  }, []);

  const isImpersonating = isAllowedRole && state !== null;

  return (
    <ImpersonationContext.Provider
      value={{
        isImpersonating,
        impersonatedAgencyId: isImpersonating ? state!.agencyId : null,
        impersonatedAgencyName: isImpersonating ? state!.agencyName : null,
        isAgencyActive: state?.isActive ?? true,
        isBillingBlocked: state?.isBillingBlocked ?? false,
        stopImpersonation,
      }}
    >
      {children}
    </ImpersonationContext.Provider>
  );
}
