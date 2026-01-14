import { useState, useMemo, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { AnalysisDrawer } from './AnalysisDrawer';
import { ApprovalModal } from './ApprovalModal';
import { StatusChangeConfirmation } from './StatusChangeConfirmation';
import { StartAnalysisModal } from './StartAnalysisModal';
import { useAnalysesKanban, useMoveAnalysis } from '@/hooks/useAnalysesKanban';
import { Analysis, AnalysisStatus, kanbanColumns, statusConfig } from '@/types/database';
import { Skeleton } from '@/components/ui/skeleton';
import { useUnreadItemIds, useMarkItemAsRead } from '@/hooks/useUnreadItemIds';
import { toast } from 'sonner';

interface KanbanBoardProps {
  filters?: {
    agency_id?: string;
    analyst_id?: string;
    unread_only?: boolean;
    searchTerm?: string;
  };
  autoOpenAnalysisId?: string | null;
  onAutoOpenHandled?: () => void;
}

export function KanbanBoard({ filters, autoOpenAnalysisId, onAutoOpenHandled }: KanbanBoardProps) {
  const { data: analyses, isLoading, isError, error } = useAnalysesKanban(filters);
  
  // Show toast on error
  useEffect(() => {
    if (isError && error) {
      toast.error('Erro ao carregar análises: ' + (error as Error).message);
    }
  }, [isError, error]);
  const moveAnalysis = useMoveAnalysis();
  const { data: unreadIds } = useUnreadItemIds();
  const markAsRead = useMarkItemAsRead();
  
  const [activeCard, setActiveCard] = useState<Analysis | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [pendingMove, setPendingMove] = useState<{ analysis: Analysis; newStatus: AnalysisStatus } | null>(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [startModalOpen, setStartModalOpen] = useState(false);
  const [pendingStartAnalysis, setPendingStartAnalysis] = useState<Analysis | null>(null);

  // Auto-open analysis from notification
  useEffect(() => {
    if (autoOpenAnalysisId && analyses) {
      const analysis = analyses.find(a => a.id === autoOpenAnalysisId);
      if (analysis) {
        setSelectedAnalysis(analysis);
        setDrawerOpen(true);
        onAutoOpenHandled?.();
      }
    }
  }, [autoOpenAnalysisId, analyses, onAutoOpenHandled]);

  // Keep selectedAnalysis in sync with latest data from analyses array
  useEffect(() => {
    if (selectedAnalysis && analyses) {
      const updated = analyses.find(a => a.id === selectedAnalysis.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedAnalysis)) {
        setSelectedAnalysis(updated);
      }
    }
  }, [analyses, selectedAnalysis]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Group analyses by status with search filtering
  const analysesByStatus = useMemo(() => {
    const grouped: Record<AnalysisStatus, Analysis[]> = {
      pendente: [],
      em_analise: [],
      aprovada: [],
      reprovada: [],
      cancelada: [],
      aguardando_pagamento: [],
      ativo: [],
    };

    if (!analyses) return grouped;

    // Start with all analyses
    let filteredAnalyses = [...analyses];

    // Apply search filter
    if (filters?.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filteredAnalyses = filteredAnalyses.filter(a => 
        a.id.toLowerCase().includes(term) ||
        a.inquilino_nome?.toLowerCase().includes(term) ||
        a.inquilino_cpf?.includes(term) ||
        a.inquilino_telefone?.includes(term) ||
        a.inquilino_email?.toLowerCase().includes(term) ||
        a.agency?.razao_social?.toLowerCase().includes(term) ||
        a.agency?.nome_fantasia?.toLowerCase().includes(term) ||
        a.imovel_endereco?.toLowerCase().includes(term) ||
        (a as any).analyst?.full_name?.toLowerCase().includes(term)
      );
    }

    // Filter by unread if needed
    if (filters?.unread_only && unreadIds?.analises) {
      filteredAnalyses = filteredAnalyses.filter(a => unreadIds.analises.has(a.id));
    }

    filteredAnalyses.forEach((analysis) => {
      if (grouped[analysis.status]) {
        grouped[analysis.status].push(analysis);
      }
    });

    return grouped;
  }, [analyses, filters?.searchTerm, filters?.unread_only, unreadIds]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const analysis = analyses?.find((a) => a.id === active.id);
    if (analysis) {
      setActiveCard(analysis);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const analysisId = active.id as string;
    const newStatus = over.id as string;
    
    // Validate if over.id is a valid status (not a card UUID)
    const validStatuses: AnalysisStatus[] = [
      'pendente', 
      'em_analise', 
      'aprovada', 
      'reprovada', 
      'cancelada', 
      'aguardando_pagamento'
    ];
    
    if (!validStatuses.includes(newStatus as AnalysisStatus)) {
      console.log('Drop target is not a valid status column:', newStatus);
      return;
    }
    
    const analysis = analyses?.find((a) => a.id === analysisId);

    if (!analysis || analysis.status === newStatus) return;

    // Prevent moving from reprovada (final status)
    if (analysis.status === 'reprovada') {
      toast.error('Análises reprovadas não podem ser movidas');
      return;
    }

    // Prevent moving to aprovada directly - it happens after payment
    if (newStatus === 'aprovada') {
      toast.error('Análises só podem ser aprovadas após confirmação de pagamento');
      return;
    }

    // If moving from PENDENTE to EM_ANALISE, show StartAnalysisModal
    if (analysis.status === 'pendente' && newStatus === 'em_analise') {
      setPendingStartAnalysis(analysis);
      setStartModalOpen(true);
      return;
    }

    // Block moving directly from PENDENTE to AGUARDANDO_PAGAMENTO - must go through EM_ANALISE first
    if (analysis.status === 'pendente' && newStatus === 'aguardando_pagamento') {
      toast.error('É necessário iniciar a análise antes de aprovar');
      return;
    }

    // Check if moving to aguardando_pagamento - show approval modal (only from em_analise)
    if (newStatus === 'aguardando_pagamento') {
      setPendingMove({ analysis, newStatus });
      setApprovalModalOpen(true);
      return;
    }

    // Check if critical status change - show confirmation
    if (['reprovada', 'cancelada'].includes(newStatus)) {
      setPendingMove({ analysis, newStatus: newStatus as AnalysisStatus });
      setConfirmationOpen(true);
      return;
    }

    // Direct move for non-critical status changes
    moveAnalysis.mutate({ id: analysisId, newStatus: newStatus as AnalysisStatus });
  };

  const handleStartAnalysisSuccess = () => {
    setPendingStartAnalysis(null);
    setStartModalOpen(false);
  };

  const handleStartAnalysisCancel = () => {
    setPendingStartAnalysis(null);
    setStartModalOpen(false);
  };

  const handleApprovalConfirm = (additionalData?: Record<string, unknown>) => {
    if (pendingMove) {
      moveAnalysis.mutate({
        id: pendingMove.analysis.id,
        newStatus: pendingMove.newStatus,
        additionalData,
      });
    }
    setPendingMove(null);
    setApprovalModalOpen(false);
  };

  const handleConfirmationConfirm = (reason?: string) => {
    if (pendingMove) {
      moveAnalysis.mutate({
        id: pendingMove.analysis.id,
        newStatus: pendingMove.newStatus,
        additionalData: reason ? { observacoes: reason } : undefined,
      });
    }
    setPendingMove(null);
    setConfirmationOpen(false);
  };

  const handleCardClick = (analysis: Analysis) => {
    // Mark as read when opening
    if (unreadIds?.analises.has(analysis.id)) {
      markAsRead(analysis.id, 'analises');
    }
    setSelectedAnalysis(analysis);
    setDrawerOpen(true);
  };

  if (isLoading || isError) {
    return (
      <div className="grid grid-cols-5 gap-4">
        {kanbanColumns.map((status) => (
          <div key={status} className="kanban-column">
            <Skeleton className="h-8 w-32 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-5 gap-4 min-h-[600px]">
          {kanbanColumns.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              title={statusConfig[status].label}
              analyses={analysesByStatus[status]}
              onCardClick={handleCardClick}
              unreadIds={unreadIds?.analises}
            />
          ))}
        </div>

        <DragOverlay>
          {activeCard && (
            <div className="kanban-card dragging w-64">
              <KanbanCard analysis={activeCard} onClick={() => {}} isDragging />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <AnalysisDrawer
        analysis={selectedAnalysis}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />

      <ApprovalModal
        analysis={pendingMove?.analysis ?? null}
        open={approvalModalOpen}
        onOpenChange={setApprovalModalOpen}
        onConfirm={handleApprovalConfirm}
      />

      <StatusChangeConfirmation
        analysis={pendingMove?.analysis ?? null}
        newStatus={pendingMove?.newStatus ?? null}
        open={confirmationOpen}
        onOpenChange={setConfirmationOpen}
        onConfirm={handleConfirmationConfirm}
      />

      <StartAnalysisModal
        open={startModalOpen}
        onOpenChange={(open) => {
          if (!open) handleStartAnalysisCancel();
          setStartModalOpen(open);
        }}
        analysisId={pendingStartAnalysis?.id || ''}
        tenantName={pendingStartAnalysis?.inquilino_nome || ''}
        onSuccess={handleStartAnalysisSuccess}
      />
    </>
  );
}
