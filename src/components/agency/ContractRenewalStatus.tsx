import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCancelRenewal } from '@/hooks/useContractRenewal';
import { Loader2, Clock, CalendarSync, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/lib/validators';

interface ContractRenewalStatusProps {
  renewal: {
    id: string;
    contract_id: string;
    requested_at: string;
    request_source: 'agency' | 'tridots';
    status: 'pending' | 'approved' | 'rejected' | 'canceled';
    new_valor_aluguel: number;
    new_valor_condominio: number;
    new_valor_iptu: number;
    new_valor_outros_encargos: number;
    new_taxa_garantia_percentual: number;
  };
}

export function ContractRenewalStatus({ renewal }: ContractRenewalStatusProps) {
  const { mutate: cancelRenewal, isPending } = useCancelRenewal();

  const newTotal = renewal.new_valor_aluguel + renewal.new_valor_condominio + renewal.new_valor_iptu + renewal.new_valor_outros_encargos;

  const handleCancel = () => {
    if (confirm('Tem certeza que deseja cancelar esta solicitação de renovação?')) {
      cancelRenewal({ renewalId: renewal.id, contractId: renewal.contract_id });
    }
  };

  return (
    <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarSync className="h-4 w-4 text-amber-600" />
            Renovação Solicitada
          </div>
          <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
            <Clock className="h-3 w-3 mr-1" />
            Aguardando Análise
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground">
          Solicitada em {format(new Date(renewal.requested_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Novo aluguel:</span>
            <span className="font-medium ml-1">{formatCurrency(renewal.new_valor_aluguel)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Total garantido:</span>
            <span className="font-medium ml-1">{formatCurrency(newTotal)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Taxa:</span>
            <span className="font-medium ml-1">{renewal.new_taxa_garantia_percentual}%</span>
          </div>
        </div>

        {renewal.request_source === 'agency' && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleCancel}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <X className="mr-2 h-4 w-4" />
            )}
            Cancelar Solicitação
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
