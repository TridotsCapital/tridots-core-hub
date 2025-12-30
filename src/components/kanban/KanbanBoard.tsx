import { useState, useMemo } from 'react';
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
import { useAnalysesKanban, useMoveAnalysis } from '@/hooks/useAnalysesKanban';
import { Analysis, AnalysisStatus, kanbanColumns, statusConfig } from '@/types/database';
import { Skeleton } from '@/components/ui/skeleton';

interface KanbanBoardProps {
  filters?: {
    agency_id?: string;
    analyst_id?: string;
  };
}

export function KanbanBoard({ filters }: KanbanBoardProps) {
  const { data: analyses, isLoading } = useAnalysesKanban(filters);
  const moveAnalysis = useMoveAnalysis();
  
  const [activeCard, setActiveCard] = useState<Analysis | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [pendingMove, setPendingMove] = useState<{ analysis: Analysis; newStatus: AnalysisStatus } | null>(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Group analyses by status
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

    analyses.forEach((analysis) => {
      if (grouped[analysis.status]) {
        grouped[analysis.status].push(analysis);
      }
    });

    return grouped;
  }, [analyses]);

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
    const newStatus = over.id as AnalysisStatus;
    const analysis = analyses?.find((a) => a.id === analysisId);

    if (!analysis || analysis.status === newStatus) return;

    // Check if moving to approval status - show approval modal
    if (newStatus === 'aprovada') {
      setPendingMove({ analysis, newStatus });
      setApprovalModalOpen(true);
      return;
    }

    // Check if critical status change - show confirmation
    if (['reprovada', 'cancelada'].includes(newStatus)) {
      setPendingMove({ analysis, newStatus });
      setConfirmationOpen(true);
      return;
    }

    // Direct move for non-critical status changes
    moveAnalysis.mutate({ id: analysisId, newStatus });
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
    setSelectedAnalysis(analysis);
    setDrawerOpen(true);
  };

  if (isLoading) {
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
    </>
  );
}
