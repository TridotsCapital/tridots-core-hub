import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AgencyLayout } from "@/components/layout/AgencyLayout";
import { AgencyContractList } from "@/components/agency/AgencyContractList";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function AgencyContracts() {
  const location = useLocation();
  const { user } = useAuth();
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoOpenContractId, setAutoOpenContractId] = useState<string | null>(null);

  // Auto-open contract from notification
  useEffect(() => {
    const state = location.state as { contractId?: string } | null;
    if (state?.contractId) {
      setAutoOpenContractId(state.contractId);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // First get agency ID
      const { data: agencyUser, error: agencyError } = await supabase
        .from('agency_users')
        .select('agency_id')
        .eq('user_id', user.id)
        .single();

      if (agencyError) throw agencyError;
      setAgencyId(agencyUser.agency_id);

      // Then fetch analyses for this agency
      const { data: analysesData, error: analysesError } = await supabase
        .from('analyses')
        .select('id, inquilino_nome, inquilino_cpf, status, valor_aluguel, valor_total, created_at, approved_at')
        .eq('agency_id', agencyUser.agency_id)
        .order('created_at', { ascending: false });

      if (analysesError) throw analysesError;
      setAnalyses(analysesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  if (!agencyId && loading) {
    return (
      <AgencyLayout 
        title="Meus Contratos" 
        description="Gerencie suas análises e contratos de garantia"
      >
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AgencyLayout>
    );
  }

  return (
    <AgencyLayout 
      title="Meus Contratos" 
      description="Gerencie suas análises e contratos de garantia"
    >
      <AgencyContractList 
        analyses={analyses} 
        isLoading={loading}
        onRefresh={fetchData}
        autoOpenContractId={autoOpenContractId}
        onAutoOpenHandled={() => setAutoOpenContractId(null)}
      />
    </AgencyLayout>
  );
}
