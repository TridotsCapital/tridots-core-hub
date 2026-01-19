import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { differenceInDays } from 'date-fns';
import { ClaimsKanbanColumn } from './ClaimsKanbanColumn';
import { ClaimsKanbanCard } from './ClaimsKanbanCard';
import { ClaimStatusTransitionModal } from './ClaimStatusTransitionModal';
import { InternalClaimTicketSheet } from './InternalClaimTicketSheet';
import { useUpdateClaimStatus } from '@/hooks/useClaims';
import { useCreateClaimNote } from '@/hooks/useClaimNotes';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Clock, DollarSign, AlertTriangle, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Claim, ClaimInternalStatus } from '@/types/claims';

interface ClaimsKanbanProps {
  claims: (Claim & {
    docs_checklist?: Record<string, boolean>;
    last_internal_status_change_at?: string;
  })[];
  isLoading?: boolean;
  onRefresh: () => void;
}

type QuickFilter = 'all' | 'aguardando' | 'alto_valor' | 'estagnados';

const HIGH_VALUE_THRESHOLD = 10000;
const STAGNATION_DAYS = 7;

// Kanban columns based on internal_status (excluding encerrado for now)
const KANBAN_COLUMNS: { status: ClaimInternalStatus; title: string }[] = [
  { status: 'aguardando_analise', title: 'Aguardando Análise' },
  { status: 'cobranca_amigavel', title: 'Cobrança Amigável' },
  { status: 'notificacao_extrajudicial', title: 'Em Negociação' },
  { status: 'exoneracao_despejo_interno', title: 'Exoneração e Despejo' },
  { status: 'acordo_realizado', title: 'Acordo Realizado' },
  { status: 'juridico_acionado', title: 'Jurídico Acionado' },
];

// Define transition warnings (travas com override)
const TRANSITION_WARNINGS: Partial<Record<ClaimInternalStatus, Partial<Record<ClaimInternalStatus, string>>>> = {
  cobranca_amigavel: {
    acordo_realizado: 'Está pulando a etapa de Notificação Extrajudicial. Tem certeza?',
    juridico_acionado: 'Está pulando etapas intermediárias. Recomenda-se passar por Notificação primeiro.',
  },
  notificacao_extrajudicial: {
    cobranca_amigavel: 'Está retornando para uma etapa anterior. Tem certeza?',
  },
  acordo_realizado: {
    cobranca_amigavel: 'Está retornando para uma etapa anterior. Tem certeza?',
    notificacao_extrajudicial: 'Está retornando para uma etapa anterior. Tem certeza?',
  },
  juridico_acionado: {
    cobranca_amigavel: 'Está retornando de Jurídico para Cobrança Amigável. Tem certeza?',
    notificacao_extrajudicial: 'Está retornando de Jurídico. Tem certeza?',
    acordo_realizado: 'Está retornando de Jurídico. Tem certeza?',
  },
};

// Helper to check if claim is stagnant
const isClaimStagnant = (claim: Claim & { last_internal_status_change_at?: string }) => {
  const lastChangeDate = claim.last_internal_status_change_at || claim.created_at;
  const parsedDate = lastChangeDate ? new Date(lastChangeDate) : null;
  if (!parsedDate || isNaN(parsedDate.getTime())) return false;
  return differenceInDays(new Date(), parsedDate) >= STAGNATION_DAYS;
};

export function ClaimsKanban({ claims, isLoading, onRefresh }: ClaimsKanbanProps) {
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [ticketSheetOpen, setTicketSheetOpen] = useState(false);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  
  // Transition modal state
  const [transitionModal, setTransitionModal] = useState<{
    open: boolean;
    claim: Claim | null;
    fromStatus: ClaimInternalStatus;
    toStatus: ClaimInternalStatus;
    warning?: string;
  }>({
    open: false,
    claim: null,
    fromStatus: 'cobranca_amigavel',
    toStatus: 'cobranca_amigavel',
  });

  const updateStatus = useUpdateClaimStatus();
  const createNote = useCreateClaimNote();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Filter claims to only show those not closed or canceled
  const operationalClaims = useMemo(() => {
    return claims.filter(c => 
      c.internal_status !== 'encerrado' &&
      !c.canceled_at
    );
  }, [claims]);

  // Calculate filter counts
  const filterCounts = useMemo(() => ({
    aguardando: operationalClaims.filter(c => c.internal_status === 'aguardando_analise').length,
    altoValor: operationalClaims.filter(c => c.total_claimed_value >= HIGH_VALUE_THRESHOLD).length,
    estagnados: operationalClaims.filter(isClaimStagnant).length,
  }), [operationalClaims]);

  // Apply quick filter
  const filteredClaims = useMemo(() => {
    switch (quickFilter) {
      case 'aguardando':
        return operationalClaims.filter(c => c.internal_status === 'aguardando_analise');
      case 'alto_valor':
        return operationalClaims.filter(c => c.total_claimed_value >= HIGH_VALUE_THRESHOLD);
      case 'estagnados':
        return operationalClaims.filter(isClaimStagnant);
      default:
        return operationalClaims;
    }
  }, [operationalClaims, quickFilter]);

  const getClaimsByStatus = (status: ClaimInternalStatus) => {
    return filteredClaims.filter((c) => c.internal_status === status);
  };

  const activeClaim = activeId 
    ? operationalClaims.find(c => c.id === activeId) 
    : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const claim = operationalClaims.find(c => c.id === active.id);
    if (!claim) return;

    const newStatus = over.id as ClaimInternalStatus;
    const oldStatus = claim.internal_status;

    // Same column, no change
    if (oldStatus === newStatus) return;

    // Check for warnings
    const warning = TRANSITION_WARNINGS[oldStatus]?.[newStatus];

    if (warning) {
      // Show confirmation modal
      setTransitionModal({
        open: true,
        claim,
        fromStatus: oldStatus,
        toStatus: newStatus,
        warning,
      });
    } else {
      // Direct transition
      performStatusChange(claim.id, newStatus);
    }
  };

  const performStatusChange = async (claimId: string, newStatus: ClaimInternalStatus, justification?: string) => {
    try {
      await updateStatus.mutateAsync({
        id: claimId,
        internal_status: newStatus,
      });

      // If there's a justification, create a note
      if (justification) {
        await createNote.mutateAsync({
          claim_id: claimId,
          note_type: 'observacao',
          content: `Transição de status: ${justification}`,
        });
      }

      onRefresh();
    } catch {
      // Error handled by hook
    }
  };

  const handleTransitionConfirm = async (justification: string) => {
    if (!transitionModal.claim) return;
    
    await performStatusChange(
      transitionModal.claim.id,
      transitionModal.toStatus,
      justification
    );
    
    setTransitionModal(prev => ({ ...prev, open: false, claim: null }));
  };

  const handleViewDetails = (claim: Claim) => {
    navigate(`/claims/${claim.id}`);
  };

  const handleOpenTicket = (claim: Claim) => {
    setSelectedClaim(claim);
    setTicketSheetOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((col) => (
          <div key={col.status} className="min-w-[280px] w-[280px]">
            <Skeleton className="h-10 w-full mb-3" />
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Quick Filter Bar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground mr-1">Filtro:</span>
        
        <Button
          variant={quickFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          className="h-7 text-xs"
          onClick={() => setQuickFilter('all')}
        >
          Todos ({operationalClaims.length})
        </Button>

        <Button
          variant={quickFilter === 'aguardando' ? 'default' : 'outline'}
          size="sm"
          className={cn(
            'h-7 text-xs',
            quickFilter !== 'aguardando' && 'border-blue-300 text-blue-700 hover:bg-blue-50'
          )}
          onClick={() => setQuickFilter('aguardando')}
        >
          <Clock className="h-3 w-3 mr-1" />
          Aguardando ({filterCounts.aguardando})
        </Button>

        <Button
          variant={quickFilter === 'alto_valor' ? 'default' : 'outline'}
          size="sm"
          className={cn(
            'h-7 text-xs',
            quickFilter !== 'alto_valor' && 'border-purple-300 text-purple-700 hover:bg-purple-50'
          )}
          onClick={() => setQuickFilter('alto_valor')}
        >
          <DollarSign className="h-3 w-3 mr-1" />
          Alto Valor ({filterCounts.altoValor})
        </Button>

        <Button
          variant={quickFilter === 'estagnados' ? 'default' : 'outline'}
          size="sm"
          className={cn(
            'h-7 text-xs',
            quickFilter !== 'estagnados' && 'border-amber-300 text-amber-700 hover:bg-amber-50'
          )}
          onClick={() => setQuickFilter('estagnados')}
        >
          <AlertTriangle className="h-3 w-3 mr-1" />
          Estagnados ({filterCounts.estagnados})
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4 min-w-max">
            {KANBAN_COLUMNS.map((column) => (
              <ClaimsKanbanColumn
                key={column.status}
                status={column.status}
                title={column.title}
                claims={getClaimsByStatus(column.status)}
                onCardClick={handleViewDetails}
                onOpenTicket={handleOpenTicket}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <DragOverlay>
          {activeClaim && (
            <div className="opacity-80 rotate-3 scale-105">
              <ClaimsKanbanCard
                claim={activeClaim}
                onViewDetails={() => {}}
                onOpenTicket={() => {}}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Transition Confirmation Modal */}
      <ClaimStatusTransitionModal
        open={transitionModal.open}
        onOpenChange={(open) => setTransitionModal(prev => ({ ...prev, open }))}
        fromStatus={transitionModal.fromStatus}
        toStatus={transitionModal.toStatus}
        warning={transitionModal.warning}
        onConfirm={handleTransitionConfirm}
        isPending={updateStatus.isPending}
      />

      {/* Ticket Sheet */}
      {selectedClaim && (
        <InternalClaimTicketSheet
          open={ticketSheetOpen}
          onOpenChange={setTicketSheetOpen}
          claim={selectedClaim}
        />
      )}
    </>
  );
}
