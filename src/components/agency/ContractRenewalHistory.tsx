import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useContractRenewals } from '@/hooks/useContractRenewal';
import { Loader2, History, CheckCircle, XCircle, Clock, Ban } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/lib/validators';

interface ContractRenewalHistoryProps {
  contractId: string;
}

const STATUS_CONFIG = {
  pending: { label: 'Aguardando', icon: Clock, color: 'bg-amber-100 text-amber-700 border-amber-300' },
  approved: { label: 'Aprovada', icon: CheckCircle, color: 'bg-green-100 text-green-700 border-green-300' },
  rejected: { label: 'Recusada', icon: XCircle, color: 'bg-red-100 text-red-700 border-red-300' },
  canceled: { label: 'Cancelada', icon: Ban, color: 'bg-gray-100 text-gray-700 border-gray-300' }
};

export function ContractRenewalHistory({ contractId }: ContractRenewalHistoryProps) {
  const { data: renewals, isLoading } = useContractRenewals(contractId);

  // Filter out pending renewals (shown separately)
  const historicalRenewals = renewals?.filter(r => r.status !== 'pending') || [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (historicalRenewals.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <History className="h-4 w-4" />
          Histórico de Renovações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {historicalRenewals.map((renewal) => {
          const config = STATUS_CONFIG[renewal.status as keyof typeof STATUS_CONFIG];
          const StatusIcon = config.icon;
          const newTotal = renewal.new_valor_aluguel + renewal.new_valor_condominio + renewal.new_valor_iptu + renewal.new_valor_outros_encargos;
          const oldTotal = renewal.old_valor_aluguel + (renewal.old_valor_condominio || 0) + (renewal.old_valor_iptu || 0) + (renewal.old_valor_outros_encargos || 0);

          return (
            <div 
              key={renewal.id} 
              className="border rounded-lg p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {format(new Date(renewal.requested_at), "dd/MM/yyyy", { locale: ptBR })}
                </span>
                <Badge variant="outline" className={config.color}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {config.label}
                </Badge>
              </div>
              
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">De:</span>
                  <span className="line-through text-muted-foreground">{formatCurrency(oldTotal)}</span>
                </div>
                <span className="text-muted-foreground">→</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Para:</span>
                  <span className="font-medium">{formatCurrency(newTotal)}</span>
                </div>
              </div>

              {renewal.status === 'approved' && renewal.renewal_duration_months && (
                <div className="text-xs text-green-600">
                  Renovado por {renewal.renewal_duration_months} meses
                </div>
              )}

              {renewal.status === 'rejected' && renewal.rejection_reason && (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                  Motivo: {renewal.rejection_reason}
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Solicitado por: {renewal.request_source === 'agency' ? 'Imobiliária' : 'GarantFácil'}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
