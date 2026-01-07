import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AgencyLayout } from "@/components/layout/AgencyLayout";
import { AgencyContractList } from "@/components/agency/AgencyContractList";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertTriangle } from "lucide-react";
import { useRejectedDocumentsCount } from "@/hooks/useRejectedDocumentsCount";

export default function AgencyContracts() {
  const location = useLocation();
  const { user } = useAuth();
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoOpenContractId, setAutoOpenContractId] = useState<string | null>(null);
  const { data: rejectedDocsCount } = useRejectedDocumentsCount();

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

      // Fetch CONTRACTS (not analyses) for this agency
      const { data: contractsData, error: contractsError } = await supabase
        .from('contracts')
        .select(`
          id, 
          status, 
          created_at, 
          activated_at,
          doc_contrato_locacao_status,
          doc_vistoria_inicial_status,
          doc_seguro_incendio_status,
          analysis:analyses(
            id,
            inquilino_nome,
            inquilino_cpf,
            valor_aluguel,
            valor_total,
            identity_photo_path
          )
        `)
        .eq('agency_id', agencyUser.agency_id)
        .order('created_at', { ascending: false });

      if (contractsError) throw contractsError;
      setContracts(contractsData || []);
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
        description="Gerencie seus contratos de garantia ativos"
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
      description="Gerencie seus contratos de garantia ativos"
    >
      {(rejectedDocsCount ?? 0) > 0 && (
        <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-semibold text-red-800">
                {rejectedDocsCount === 1 
                  ? '1 contrato possui documento rejeitado' 
                  : `${rejectedDocsCount} contratos possuem documentos rejeitados`}
              </p>
              <p className="text-sm text-red-700">
                Reenvie os documentos solicitados para prosseguir com a ativação
              </p>
            </div>
          </div>
        </div>
      )}
      <AgencyContractList 
        contracts={contracts} 
        isLoading={loading}
        onRefresh={fetchData}
        autoOpenContractId={autoOpenContractId}
        onAutoOpenHandled={() => setAutoOpenContractId(null)}
      />
    </AgencyLayout>
  );
}