import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Clock, 
  AlertTriangle, 
  FileWarning,
  Eye,
  MessageSquare,
  DollarSign 
} from 'lucide-react';
import { formatDistanceToNow, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Claim, ClaimInternalStatus } from '@/types/claims';
import { useTicketCountByClaim } from '@/hooks/useTickets';

interface ClaimsKanbanCardProps {
  claim: Claim & {
    docs_checklist?: Record<string, boolean>;
    last_internal_status_change_at?: string;
  };
  onViewDetails: (claim: Claim) => void;
  onOpenTicket: (claim: Claim) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const HIGH_VALUE_THRESHOLD = 10000;
const STAGNATION_WARNING_DAYS = 7;
const STAGNATION_CRITICAL_DAYS = 14;

export function ClaimsKanbanCard({ claim, onViewDetails, onOpenTicket }: ClaimsKanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: claim.id });

  const { data: ticketData } = useTicketCountByClaim(claim.id);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Calculate stagnation
  const lastChangeDate = claim.last_internal_status_change_at || claim.created_at;
  const parsedDate = lastChangeDate ? new Date(lastChangeDate) : null;
  const isValidDate = parsedDate && !isNaN(parsedDate.getTime());
  const daysStagnant = isValidDate ? differenceInDays(new Date(), parsedDate) : 0;
  
  const isHighValue = claim.total_claimed_value >= HIGH_VALUE_THRESHOLD;
  const isStagnantWarning = daysStagnant >= STAGNATION_WARNING_DAYS && daysStagnant < STAGNATION_CRITICAL_DAYS;
  const isStagnantCritical = daysStagnant >= STAGNATION_CRITICAL_DAYS;

  // Check for pending docs
  const docsChecklist = claim.docs_checklist || {};
  const totalDocs = Object.keys(docsChecklist).length;
  const completedDocs = Object.values(docsChecklist).filter(Boolean).length;
  const hasPendingDocs = completedDocs < totalDocs;

  // Determine border color based on urgency
  const getBorderClass = () => {
    if (isStagnantCritical) return 'border-l-4 border-l-destructive';
    if (isStagnantWarning) return 'border-l-4 border-l-warning';
    if (isHighValue) return 'border-l-4 border-l-purple-500';
    return '';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-50 z-50'
      )}
      onClick={() => onViewDetails(claim)}
    >
      <Card className={cn(
        'transition-all duration-200 hover:shadow-md bg-card cursor-pointer',
        getBorderClass(),
        isDragging && 'shadow-lg ring-2 ring-primary'
      )}>
        <CardContent className="p-3 space-y-2">
          {/* Header with ID and agency */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-mono text-muted-foreground">
                #{claim.id.slice(0, 8).toUpperCase()}
              </span>
              <div className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium truncate">
                  {claim.agency?.nome_fantasia || claim.agency?.razao_social || 'Imobiliária'}
                </span>
              </div>
            </div>
            {hasPendingDocs && (
              <Badge variant="outline" className="shrink-0 text-amber-600 border-amber-300 bg-amber-50">
                <FileWarning className="h-3 w-3 mr-1" />
                Docs
              </Badge>
            )}
          </div>

          {/* Tenant name */}
          <p className="text-sm text-muted-foreground truncate">
            {claim.contract?.analysis?.inquilino_nome}
          </p>

          {/* Value and indicators row */}
          <div className="flex items-center justify-between gap-2">
            <div className={cn(
              'flex items-center gap-1 font-semibold',
              isHighValue ? 'text-purple-600' : 'text-amber-600'
            )}>
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">{formatCurrency(claim.total_claimed_value)}</span>
            </div>

            <div className="flex items-center gap-1">
              {isHighValue && (
                <Badge variant="secondary" className="bg-purple-500 text-white text-xs px-1.5 animate-pulse shadow-sm">
                  <DollarSign className="h-3 w-3 mr-0.5" />
                  Alto Valor
                </Badge>
              )}
              {(isStagnantWarning || isStagnantCritical) && (
                <Badge 
                  variant="secondary" 
                  className={cn(
                    'text-xs px-1.5',
                    isStagnantCritical 
                      ? 'bg-destructive/10 text-destructive' 
                      : 'bg-warning/20 text-warning-foreground'
                  )}
                >
                  <AlertTriangle className="h-3 w-3 mr-0.5" />
                  {daysStagnant}d
                </Badge>
              )}
            </div>
          </div>

          {/* Time since last update */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>
              {isValidDate 
                ? `Atualizado ${formatDistanceToNow(parsedDate, { addSuffix: true, locale: ptBR })}`
                : 'Data não disponível'}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-7 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(claim);
              }}
            >
              <Eye className="h-3 w-3 mr-1" />
              Detalhes
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 text-xs px-2 relative",
                ticketData?.hasOpen && "text-destructive"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onOpenTicket(claim);
              }}
            >
              <MessageSquare className="h-3 w-3" />
              {ticketData && ticketData.count > 0 && (
                <Badge 
                  variant={ticketData.hasOpen ? "destructive" : "secondary"} 
                  className="absolute -top-1 -right-1 h-4 min-w-4 p-0 flex items-center justify-center text-[9px]"
                >
                  {ticketData.count}
                </Badge>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
