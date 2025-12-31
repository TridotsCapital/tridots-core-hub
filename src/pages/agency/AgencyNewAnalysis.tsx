import { useState, useEffect } from 'react';
import { AgencyLayout } from '@/components/layout/AgencyLayout';
import { NewAnalysisForm } from '@/components/agency/NewAnalysisForm';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export default function AgencyNewAnalysis() {
  const { user } = useAuth();
  const [agencyId, setAgencyId] = useState<string | null>(null);
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

  return (
    <AgencyLayout 
      title="Nova Análise" 
      description="Solicite uma nova análise de crédito"
    >
      <NewAnalysisForm agencyId={agencyId} />
    </AgencyLayout>
  );
}
