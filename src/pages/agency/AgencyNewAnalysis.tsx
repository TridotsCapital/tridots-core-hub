import { useState, useEffect } from 'react';
import { AgencyLayout, useAgencyStatus } from '@/components/layout/AgencyLayout';
import { NewAnalysisForm } from '@/components/agency/NewAnalysisForm';
import { PendingApprovalBanner } from '@/components/agency/PendingApprovalBanner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function AgencyNewAnalysis() {
  const { user } = useAuth();
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [descontoPix, setDescontoPix] = useState<number | null>(null);
  const [isAgencyActive, setIsAgencyActive] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgencyId = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('agency_users')
          .select('agency_id')
          .eq('user_id', user.id)
          .single();
        
        if (error) throw error;
        setAgencyId(data.agency_id);

        // Check if agency is active and get discount
        const { data: agency } = await supabase
          .from('agencies')
          .select('active, desconto_pix_percentual')
          .eq('id', data.agency_id)
          .single();

        if (agency) {
          setIsAgencyActive(agency.active);
          setDescontoPix(agency.desconto_pix_percentual);
        }
      } catch (error) {
        console.error('Error fetching agency:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAgencyId();
  }, [user]);

  if (loading) {
    return (
      <AgencyLayout title="Nova Análise" description="Solicite uma nova análise de crédito">
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AgencyLayout>
    );
  }

  if (!agencyId) {
    return (
      <AgencyLayout title="Nova Análise" description="Solicite uma nova análise de crédito">
        <div className="flex items-center justify-center h-[400px] border-2 border-dashed border-destructive/50 rounded-lg">
          <p className="text-destructive">Erro: Imobiliária não encontrada</p>
        </div>
      </AgencyLayout>
    );
  }

  if (!isAgencyActive) {
    return (
      <AgencyLayout 
        title="Nova Análise" 
        description="Solicite uma nova análise de crédito"
      >
        <Card className="max-w-2xl mx-auto mt-8">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-4 py-8">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Lock className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold">Funcionalidade Bloqueada</h3>
              <p className="text-muted-foreground max-w-md">
                A criação de novas análises estará disponível após a aprovação do seu cadastro 
                pela equipe Tridots. Você será notificado quando seu perfil for ativado.
              </p>
            </div>
          </CardContent>
        </Card>
      </AgencyLayout>
    );
  }

  return (
    <AgencyLayout 
      title="Nova Análise" 
      description="Solicite uma nova análise de crédito"
    >
      <NewAnalysisForm agencyId={agencyId} descontoPix={descontoPix} />
    </AgencyLayout>
  );
}
