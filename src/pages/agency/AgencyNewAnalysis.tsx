import { AgencyLayout } from '@/components/layout/AgencyLayout';
import { NewAnalysisForm } from '@/components/agency/NewAnalysisForm';
import { useAgencyUser } from '@/hooks/useAgencyUser';
import { Loader2, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function AgencyNewAnalysis() {
  const { data: agencyUserData, isLoading: loading } = useAgencyUser();
  const agencyId = agencyUserData?.agency_id || null;
  const isAgencyActive = agencyUserData?.agency?.active ?? true;
  const descontoPix = agencyUserData?.agency?.desconto_pix_percentual ?? null;

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
                pela equipe GarantFácil. Você será notificado quando seu perfil for ativado.
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