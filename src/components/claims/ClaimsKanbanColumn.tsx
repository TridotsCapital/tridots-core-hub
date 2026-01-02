import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ClaimsKanbanCard } from './ClaimsKanbanCard';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Claim, ClaimInternalStatus } from '@/types/claims';

interface ClaimsKanbanColumnProps {
  status: ClaimInternalStatus;
  title: string;
  claims: (Claim & {
    docs_checklist?: Record<string, boolean>;
    last_internal_status_change_at?: string;
  })[];
  onCardClick: (claim: Claim) => void;
  onOpenTicket: (claim: Claim) => void;
}

const columnColors: Record<ClaimInternalStatus, string> = {
  aguardando_analise: 'bg-muted/30 border-muted-foreground/20',
  cobranca_amigavel: 'bg-orange-50 border-orange-200',
  notificacao_extrajudicial: 'bg-red-50 border-red-200',
  acordo_realizado: 'bg-teal-50 border-teal-200',
  juridico_acionado: 'bg-rose-50 border-rose-200',
  encerrado: 'bg-slate-50 border-slate-200',
};

const headerColors: Record<ClaimInternalStatus, string> = {
  aguardando_analise: 'bg-muted-foreground text-background',
  cobranca_amigavel: 'bg-orange-500 text-white',
  notificacao_extrajudicial: 'bg-red-500 text-white',
  acordo_realizado: 'bg-teal-500 text-white',
  juridico_acionado: 'bg-rose-600 text-white',
  encerrado: 'bg-slate-500 text-white',
};

export function ClaimsKanbanColumn({ 
  status, 
  title, 
  claims, 
  onCardClick,
  onOpenTicket 
}: ClaimsKanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  // Calculate total value in column
  const totalValue = claims.reduce((sum, c) => sum + c.total_claimed_value, 0);
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: value >= 10000 ? 'compact' : 'standard',
    }).format(value);
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col rounded-lg border transition-all duration-200 min-w-[280px] w-[280px]',
        columnColors[status],
        isOver && 'ring-2 ring-primary ring-offset-2 scale-[1.01]'
      )}
    >
      {/* Column Header */}
      <div className="p-3 border-b">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-sm text-foreground truncate">{title}</h3>
          <Badge 
            variant="secondary" 
            className={cn('text-xs font-bold shrink-0', headerColors[status])}
          >
            {claims.length}
          </Badge>
        </div>
        {totalValue > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            Total: {formatCurrency(totalValue)}
          </p>
        )}
      </div>

      {/* Cards Container */}
      <SortableContext items={claims.map(c => c.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-300px)] overflow-y-auto">
          {claims.map((claim) => (
            <ClaimsKanbanCard
              key={claim.id}
              claim={claim}
              onViewDetails={onCardClick}
              onOpenTicket={onOpenTicket}
            />
          ))}

          {claims.length === 0 && (
            <div className="flex items-center justify-center h-24 text-muted-foreground text-sm border-2 border-dashed rounded-lg bg-background/50">
              Nenhum sinistro
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
