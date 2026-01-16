import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanCard } from './KanbanCard';
import { Analysis, AnalysisStatus, statusConfig } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/validators';

interface KanbanColumnProps {
  status: AnalysisStatus;
  title: string;
  analyses: Analysis[];
  onCardClick: (analysis: Analysis) => void;
  unreadIds?: Set<string>;
}

const columnColors: Record<AnalysisStatus, string> = {
  pendente: 'bg-warning/10 border-warning/30',
  em_analise: 'bg-info/10 border-info/30',
  aprovada: 'bg-success/10 border-success/30',
  reprovada: 'bg-destructive/10 border-destructive/30',
  cancelada: 'bg-muted border-muted-foreground/20',
  aguardando_pagamento: 'bg-purple-50 border-purple-200',
  ativo: 'bg-emerald-50 border-emerald-200',
};

const headerColors: Record<AnalysisStatus, string> = {
  pendente: 'bg-warning text-warning-foreground',
  em_analise: 'bg-info text-info-foreground',
  aprovada: 'bg-success text-success-foreground',
  reprovada: 'bg-destructive text-destructive-foreground',
  cancelada: 'bg-muted-foreground text-background',
  aguardando_pagamento: 'bg-purple-600 text-white',
  ativo: 'bg-emerald-600 text-white',
};

export function KanbanColumn({ status, title, analyses, onCardClick, unreadIds }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  // Calculate column totals
  const totalGarantia = analyses.reduce((sum, a) => sum + ((a as any).garantia_anual || 0), 0);
  const totalCobertura = analyses.reduce((sum, a) => {
    const valorTotal = (a.valor_aluguel || 0) + (a.valor_condominio || 0) + (a.valor_iptu || 0);
    return sum + (valorTotal * 20);
  }, 0);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'kanban-column border transition-all duration-200',
        columnColors[status],
        isOver && 'ring-2 ring-primary ring-offset-2 scale-[1.02]'
      )}
    >
      <div className="kanban-column-header">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-foreground">{title}</h3>
            <Badge 
              variant="secondary" 
              className={cn('text-xs font-bold', headerColors[status])}
            >
              {analyses.length}
            </Badge>
          </div>
          {analyses.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-primary">
                      {formatCurrency(totalGarantia)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Cob: {formatCurrency(totalCobertura)}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <div className="text-xs space-y-1">
                    <p><strong>{analyses.length}</strong> análises</p>
                    <p>Garantia Total: <strong>{formatCurrency(totalGarantia)}</strong></p>
                    <p>Cobertura (20x): <strong>{formatCurrency(totalCobertura)}</strong></p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      <SortableContext items={analyses.map(a => a.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3 min-h-[400px]">
          {analyses.map((analysis) => (
            <KanbanCard
              key={analysis.id}
              analysis={analysis}
              onClick={() => onCardClick(analysis)}
              hasUnread={unreadIds?.has(analysis.id) ?? false}
            />
          ))}

          {analyses.length === 0 && (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm border-2 border-dashed rounded-lg bg-background/50">
              Nenhuma análise
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
