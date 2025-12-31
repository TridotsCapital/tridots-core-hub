import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Plus, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AnalysisSuccessScreenProps {
  analysisId: string;
  onNewAnalysis: () => void;
}

export function AnalysisSuccessScreen({ analysisId, onNewAnalysis }: AnalysisSuccessScreenProps) {
  const navigate = useNavigate();
  const shortId = analysisId.slice(0, 8).toUpperCase();

  return (
    <Card className="border-green-200 bg-gradient-to-br from-green-50 to-background dark:from-green-950/20">
      <CardContent className="py-12 text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Análise Enviada com Sucesso!</h2>
          <p className="text-muted-foreground">
            Sua solicitação foi recebida e está sendo processada.
          </p>
        </div>

        <div className="inline-block rounded-lg bg-muted px-4 py-2">
          <span className="text-sm text-muted-foreground">Protocolo: </span>
          <span className="font-mono font-bold">#{shortId}</span>
        </div>

        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          A equipe Tridots irá analisar sua solicitação em até 24 horas úteis. 
          Você receberá uma notificação quando houver atualizações.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Button variant="outline" onClick={onNewAnalysis}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Análise
          </Button>
          <Button onClick={() => navigate('/agency/analyses')}>
            <List className="mr-2 h-4 w-4" />
            Ver Minhas Análises
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
