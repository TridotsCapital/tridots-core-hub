import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AgencyLayout } from "@/components/layout/AgencyLayout";
import { AgencyNewClaimForm } from "@/components/agency/claims/AgencyNewClaimForm";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function AgencyNewClaim() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pre-selected contract from URL param
  const preselectedContractId = searchParams.get('contract');

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        // Fetch agency ID
        const { data: agencyUser, error: agencyError } = await supabase
          .from('agency_users')
          .select('agency_id')
          .eq('user_id', user.id)
          .single();

        if (agencyError) throw agencyError;
        setAgencyId(agencyUser.agency_id);

        // Fetch active contracts (analyses with status 'ativo')
        const { data: contractsData, error: contractsError } = await supabase
          .from('analyses')
          .select('id, inquilino_nome, inquilino_cpf, imovel_endereco, imovel_cidade, imovel_estado, valor_aluguel')
          .eq('agency_id', agencyUser.agency_id)
          .eq('status', 'ativo')
          .order('inquilino_nome', { ascending: true });

        if (contractsError) throw contractsError;
        setContracts(contractsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <AgencyLayout title="Novo Sinistro">
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AgencyLayout>
    );
  }

  if (contracts.length === 0) {
    return (
      <AgencyLayout 
        title="Novo Sinistro"
        actions={
          <Button variant="ghost" onClick={() => navigate('/agency/claims')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        }
      >
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Você não possui contratos ativos para abrir um sinistro.
          </p>
          <Button onClick={() => navigate('/agency/contracts')}>
            Ver Meus Contratos
          </Button>
        </div>
      </AgencyLayout>
    );
  }

  return (
    <AgencyLayout 
      title="Novo Sinistro"
      description="Preencha os dados do sinistro para solicitar a garantia"
      actions={
        <Button variant="ghost" onClick={() => navigate('/agency/claims')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      }
    >
      <AgencyNewClaimForm 
        agencyId={agencyId!}
        contracts={contracts}
        preselectedContractId={preselectedContractId}
        onSuccess={(claimId) => navigate(`/agency/claims/${claimId}`)}
      />
    </AgencyLayout>
  );
}
