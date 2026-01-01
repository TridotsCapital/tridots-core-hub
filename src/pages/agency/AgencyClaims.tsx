import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AgencyLayout } from "@/components/layout/AgencyLayout";
import { AgencyClaimList } from "@/components/agency/claims/AgencyClaimList";
import { useAuth } from "@/contexts/AuthContext";
import { useClaims } from "@/hooks/useClaims";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";

export default function AgencyClaims() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [loadingAgency, setLoadingAgency] = useState(true);
  const [autoOpenClaimId, setAutoOpenClaimId] = useState<string | null>(null);

  // Auto-open claim from notification
  useEffect(() => {
    const state = location.state as { claimId?: string } | null;
    if (state?.claimId) {
      setAutoOpenClaimId(state.claimId);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchAgencyId = async () => {
      if (!user) return;
      
      try {
        const { data: agencyUser, error } = await supabase
          .from('agency_users')
          .select('agency_id')
          .eq('user_id', user.id)
          .single();

        if (!error && agencyUser) {
          setAgencyId(agencyUser.agency_id);
        }
      } catch (error) {
        console.error('Error fetching agency:', error);
      } finally {
        setLoadingAgency(false);
      }
    };

    fetchAgencyId();
  }, [user]);

  const { data: claims, isLoading, refetch } = useClaims(
    agencyId ? { agencyId } : undefined
  );

  if (loadingAgency) {
    return (
      <AgencyLayout 
        title="Sinistros" 
        description="Gerencie suas solicitações de garantia"
      >
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AgencyLayout>
    );
  }

  return (
    <AgencyLayout 
      title="Sinistros" 
      description="Gerencie suas solicitações de garantia"
      actions={
        <Button onClick={() => navigate('/agency/claims/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Sinistro
        </Button>
      }
    >
      <AgencyClaimList 
        claims={claims || []} 
        isLoading={isLoading}
        onRefresh={refetch}
        autoOpenClaimId={autoOpenClaimId}
        onAutoOpenHandled={() => setAutoOpenClaimId(null)}
      />
    </AgencyLayout>
  );
}
