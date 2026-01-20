import { Analysis } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, MessageSquare, Loader2, XCircle } from 'lucide-react';
import { formatDistanceToNow, differenceInHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useTicketCountWithStatus } from '@/hooks/useTickets';

interface AgencyKanbanCardProps {
  analysis: Analysis;
  onClick: () => void;
  hasUnread?: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const getUrgencyClass = (analysis: Analysis): string => {
  // Don't show urgency for final statuses
  const finalStatuses = ['aprovada', 'reprovada', 'cancelada', 'ativo'];
  if (finalStatuses.includes(analysis.status)) {
    return 'urgency-low';
  }
  
  const lastUpdate = analysis.updated_at || analysis.created_at;
  const hours = differenceInHours(new Date(), new Date(lastUpdate));
  if (hours < 24) return 'urgency-low';
  if (hours < 48) return 'urgency-medium';
  return 'urgency-high-pulse';
};

const getUrgencyLevel = (analysis: Analysis): 'low' | 'medium' | 'high' => {
  // Don't show urgency for final statuses
  const finalStatuses = ['aprovada', 'reprovada', 'cancelada', 'ativo'];
  if (finalStatuses.includes(analysis.status)) {
    return 'low';
  }
  
  const lastUpdate = analysis.updated_at || analysis.created_at;
  const hours = differenceInHours(new Date(), new Date(lastUpdate));
  if (hours < 24) return 'low';
  if (hours < 48) return 'medium';
  return 'high';
};

export function AgencyKanbanCard({ analysis, onClick, hasUnread = false }: AgencyKanbanCardProps) {
  const urgencyLevel = getUrgencyLevel(analysis);
  const urgencyClass = getUrgencyClass(analysis);
  
  // Only show urgency badge for actionable statuses
  const showUrgencyBadge = 
    urgencyLevel !== 'low' && 
    ['pendente', 'em_analise', 'aguardando_pagamento'].includes(analysis.status);
  const { data: ticketData } = useTicketCountWithStatus(analysis.id);

  // Calculate garantia anual
  const garantiaMensal = (analysis.valor_total || 0) * (analysis.taxa_garantia_percentual / 100);
  const garantiaAnualBase = garantiaMensal * 12;
  const isPix = analysis.forma_pagamento_preferida === 'pix';
  
  // Get discount from agency (via JOIN or analysis data)
  const descontoPix = (analysis as any).agency?.desconto_pix_percentual ?? 0;
  
  // Use saved value if available, otherwise calculate
  const garantiaAnualFinal = (analysis as any).garantia_anual ?? 
    (isPix && descontoPix > 0 ? garantiaAnualBase * (1 - descontoPix / 100) : garantiaAnualBase);

  // Format payment method text
  const getPaymentMethodText = () => {
    if (isPix) {
      // Only show discount info if discount exists
      if (descontoPix > 0) {
        return `(Pix (${Math.round(descontoPix)}% off) de ${formatCurrency(garantiaAnualBase)})`;
      }
      return '(Pix)';
    }
    
    const match = analysis.forma_pagamento_preferida?.match(/card_(\d+)x/);
    if (match) {
      const parcelas = parseInt(match[1], 10);
      const valorParcela = garantiaAnualFinal / parcelas;
      return `(${parcelas}x de ${formatCurrency(valorParcela)})`;
    }
    
    return '(1x)';
  };

  return (
    <div
      className={cn(
        'kanban-card cursor-pointer hover:shadow-md transition-shadow relative',
        urgencyClass,
        hasUnread && 'ring-2 ring-red-500 ring-offset-1'
      )}
      onClick={onClick}
    >
      {/* Unread indicator */}
      {hasUnread && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3 z-10">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
      )}
      {/* Header with name */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-foreground truncate">
            {analysis.inquilino_nome}
          </h4>
          <p className="text-[10px] font-mono text-muted-foreground">
            #{analysis.id.slice(0, 8).toUpperCase()}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {analysis.imovel_endereco}, {analysis.imovel_cidade}
          </p>
        </div>
      </div>

      {/* Garantia Anual - Destaque */}
      <div className="mb-3 pt-2 border-t border-border/50">
        <p className="text-xs text-muted-foreground">Garantia anual</p>
        <p className="text-lg font-bold text-primary">
          {formatCurrency(garantiaAnualFinal)}
        </p>
        <p className="text-xs text-muted-foreground">
          {getPaymentMethodText()}
        </p>
      </div>

      {/* Status badges for aguardando_pagamento */}
      {analysis.status === 'aguardando_pagamento' && (
        <div className="flex flex-wrap gap-1 mb-2">
          {analysis.approved_at && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-success/20 text-success border-success/30">
              APROVADA
            </Badge>
          )}
          {(analysis as any).rate_adjusted_by_tridots && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-warning/20 text-warning border-warning/30">
              TAXA REAJUSTADA
            </Badge>
          )}
          {analysis.acceptance_token_used_at && !analysis.payments_validated_at && !analysis.payments_rejected_at && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-orange-100 text-orange-700 border-orange-200 gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Aguardando Validação
            </Badge>
          )}
          {analysis.payments_rejected_at && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5 gap-1">
              <XCircle className="h-3 w-3" />
              Pagamento Rejeitado
            </Badge>
          )}
        </div>
      )}

      {/* Footer with time and urgency indicator */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>
            {formatDistanceToNow(new Date(analysis.created_at), { 
              addSuffix: false, 
              locale: ptBR 
            })}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {ticketData && ticketData.count > 0 && (
            <Badge 
              variant={ticketData.hasOpen ? "destructive" : "secondary"} 
              className="text-[10px] px-1.5 py-0 h-5"
            >
              <MessageSquare className="h-3 w-3 mr-0.5" />
              {ticketData.count}
            </Badge>
          )}

          {showUrgencyBadge && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5 animate-pulse">
              <AlertTriangle className="h-3 w-3 mr-1" />
              URGENTE
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
