import { Analysis } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow, differenceInHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface AgencyKanbanCardProps {
  analysis: Analysis;
  onClick: () => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const getUrgencyClass = (createdAt: string): string => {
  const hours = differenceInHours(new Date(), new Date(createdAt));
  if (hours < 24) return 'urgency-low';
  if (hours < 48) return 'urgency-medium';
  return 'urgency-high-pulse';
};

const getUrgencyLevel = (createdAt: string): 'low' | 'medium' | 'high' => {
  const hours = differenceInHours(new Date(), new Date(createdAt));
  if (hours < 24) return 'low';
  if (hours < 48) return 'medium';
  return 'high';
};

export function AgencyKanbanCard({ analysis, onClick }: AgencyKanbanCardProps) {
  const urgencyLevel = getUrgencyLevel(analysis.created_at);
  const urgencyClass = getUrgencyClass(analysis.created_at);

  return (
    <div
      className={cn(
        'kanban-card cursor-pointer hover:shadow-md transition-shadow',
        urgencyClass
      )}
      onClick={onClick}
    >
      {/* Header with name */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-foreground truncate">
            {analysis.inquilino_nome}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {analysis.imovel_endereco}, {analysis.imovel_cidade}
          </p>
        </div>
      </div>

      {/* Value */}
      <div className="mb-3">
        <span className="text-lg font-bold text-foreground">
          {formatCurrency(analysis.valor_aluguel)}
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

        {urgencyLevel === 'high' && (
          <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Urgente
          </Badge>
        )}
      </div>
    </div>
  );
}
