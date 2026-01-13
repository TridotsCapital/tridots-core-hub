import { forwardRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Analysis } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Clock, Building2, UserPlus, Bell, MoreHorizontal, AlertTriangle, MessageSquare } from 'lucide-react';
import { formatDistanceToNow, differenceInHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAssignAnalyst, useTeamMembers } from '@/hooks/useAnalysesKanban';
import { useTicketCountWithStatus } from '@/hooks/useTickets';

interface KanbanCardProps {
  analysis: Analysis;
  onClick: () => void;
  isDragging?: boolean;
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

export const KanbanCard = forwardRef<HTMLDivElement, KanbanCardProps>(
  function KanbanCard({ analysis, onClick, isDragging, hasUnread = false }, forwardedRef) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
      id: analysis.id,
    });

    const assignAnalyst = useAssignAnalyst();
    const { data: teamMembers } = useTeamMembers();
    const { data: ticketData } = useTicketCountWithStatus(analysis.id);

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    const urgencyLevel = getUrgencyLevel(analysis);
    const urgencyClass = getUrgencyClass(analysis);
    
    // Only show urgency badge for actionable statuses
    const showUrgencyBadge = 
      urgencyLevel !== 'low' && 
      ['pendente', 'em_analise', 'aguardando_pagamento'].includes(analysis.status);

    const handleAssignAnalyst = (analystId: string) => {
      assignAnalyst.mutate({ analysisId: analysis.id, analystId });
    };

    const handleSendNotification = (e: React.MouseEvent) => {
      e.stopPropagation();
      // TODO: Implement notification sending
      console.log('Send notification for analysis:', analysis.id);
    };

    // Combine refs
    const handleRef = (node: HTMLDivElement | null) => {
      setNodeRef(node);
      if (typeof forwardedRef === 'function') {
        forwardedRef(node);
      } else if (forwardedRef) {
        forwardedRef.current = node;
      }
    };

    return (
      <div
        ref={handleRef}
        style={style}
        {...attributes}
        {...listeners}
        className={cn(
          'kanban-card relative',
          urgencyClass,
          isDragging && 'opacity-50',
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
      {/* Header with name and quick actions */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-foreground truncate">
            {analysis.inquilino_nome}
          </h4>
          <p className="text-[10px] font-mono text-muted-foreground">
            #{analysis.id.slice(0, 8).toUpperCase()}
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <Building2 className="h-3 w-3" />
            <span className="truncate">{analysis.agency?.razao_social || 'Sem imobiliária'}</span>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleSendNotification}>
              <Bell className="h-4 w-4 mr-2" />
              Enviar notificação
            </DropdownMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger className="w-full flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-accent rounded-sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Atribuir analista
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right">
                {teamMembers?.map((member) => (
                  <DropdownMenuItem
                    key={member.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAssignAnalyst(member.id);
                    }}
                  >
                    <Avatar className="h-5 w-5 mr-2">
                      <AvatarFallback className="text-[10px]">
                        {member.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    {member.full_name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Value - Total */}
      <div className="mb-3">
        <span className="text-lg font-bold text-foreground">
          {formatCurrency(analysis.valor_total || (analysis.valor_aluguel + (analysis.valor_condominio || 0) + (analysis.valor_iptu || 0)))}
        </span>
        <span className="text-xs text-muted-foreground">/mês</span>
      </div>

      {/* Status badges for aguardando_pagamento */}
      {analysis.status === 'aguardando_pagamento' && (
        <div className="flex flex-wrap gap-1 mb-2">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-success/20 text-success border-success/30">
            Aprovada
          </Badge>
          {analysis.rate_adjusted_by_tridots && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-warning/20 text-warning border-warning/30">
              Taxa Reajustada
            </Badge>
          )}
          {analysis.acceptance_token_expires_at && new Date(analysis.acceptance_token_expires_at) < new Date() && !analysis.acceptance_token_used_at && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5">
              Link Expirado
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

          {analysis.analyst_id && (
            <Avatar className="h-6 w-6 border-2 border-background">
              <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                AN
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </div>
    );
  }
);
