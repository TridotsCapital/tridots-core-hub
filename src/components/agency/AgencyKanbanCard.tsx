import { Analysis } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, MessageSquare } from 'lucide-react';
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

  // Get payment method badge label
  const getPaymentBadgeLabel = (method: string | null | undefined): string | null => {
    if (!method) return null;
    if (method === 'pix') return 'PIX';
    const match = method.match(/card_(\d+)x/);
    if (match) return `${match[1]}x`;
    return null;
  };

  const paymentBadge = getPaymentBadgeLabel(analysis.forma_pagamento_preferida);

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
      <div className="flex items-start justify-between gap-2 mb-3">
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

      {/* Value - Total */}
      <div className="mb-3">
        <span className="text-lg font-bold text-foreground">
          {formatCurrency(analysis.valor_total || (analysis.valor_aluguel + (analysis.valor_condominio || 0) + (analysis.valor_iptu || 0)))}
        </span>
        <span className="text-xs text-muted-foreground">/mês</span>
      </div>

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
          {paymentBadge && (
            <Badge 
              variant="outline" 
              className="text-[10px] px-1.5 py-0 h-5 border-primary/30 text-primary"
            >
              {paymentBadge}
            </Badge>
          )}

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
