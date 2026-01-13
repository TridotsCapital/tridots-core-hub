import { useState, useEffect } from 'react';
import { Analysis, AnalysisStatus, kanbanColumns, statusConfig } from '@/types/database';
import { AgencyKanbanCard } from './AgencyKanbanCard';
import { AgencyAnalysisDrawer } from './AgencyAnalysisDrawer';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useUnreadItemIds, useMarkItemAsRead } from '@/hooks/useUnreadItemIds';

interface AgencyKanbanBoardProps {
  analyses: Analysis[];
  isLoading?: boolean;
  autoOpenAnalysisId?: string | null;
  onAutoOpenHandled?: () => void;
}

const columnColors: Record<AnalysisStatus, string> = {
  pendente: 'bg-amber-500/10 border-amber-500/30',
  em_analise: 'bg-blue-500/10 border-blue-500/30',
  aprovada: 'bg-emerald-500/10 border-emerald-500/30',
  reprovada: 'bg-red-500/10 border-red-500/30',
  cancelada: 'bg-slate-500/10 border-slate-500/30',
  aguardando_pagamento: 'bg-purple-500/10 border-purple-500/30',
  ativo: 'bg-green-500/10 border-green-500/30',
};

const headerColors: Record<AnalysisStatus, string> = {
  pendente: 'bg-amber-500',
  em_analise: 'bg-blue-500',
  aprovada: 'bg-emerald-500',
  reprovada: 'bg-red-500',
  cancelada: 'bg-slate-500',
  aguardando_pagamento: 'bg-purple-500',
  ativo: 'bg-green-500',
};

export function AgencyKanbanBoard({ analyses, isLoading, autoOpenAnalysisId, onAutoOpenHandled }: AgencyKanbanBoardProps) {
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hasShownDragToast, setHasShownDragToast] = useState(false);
  const { data: unreadIds } = useUnreadItemIds();
  const markAsRead = useMarkItemAsRead();

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

  const handleCardClick = (analysis: Analysis) => {
    // Mark as read when opening
    if (unreadIds?.analises.has(analysis.id)) {
      markAsRead(analysis.id, 'analises');
    }
    setSelectedAnalysis(analysis);
    setDrawerOpen(true);
  };

  const handleDragAttempt = (e: React.MouseEvent | React.TouchEvent) => {
    // Show toast only once per session
    if (!hasShownDragToast) {
      toast.info("Apenas a equipe Tridots pode alterar o status", {
        description: "Você pode acompanhar o progresso pelo Kanban e conversar com a equipe pelo chat."
      });
      setHasShownDragToast(true);
    }
  };

  const getAnalysesByStatus = (status: AnalysisStatus) => {
    return analyses.filter((a) => a.status === status);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4 min-w-max">
          {kanbanColumns.map((status) => {
            const columnAnalyses = getAnalysesByStatus(status);
            
            return (
              <div
                key={status}
                className={cn(
                  'kanban-column min-w-[280px] w-[280px] rounded-lg border-2 flex flex-col',
                  columnColors[status]
                )}
              >
                {/* Column Header */}
                <div className="p-3 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <Badge className={cn('text-white', headerColors[status])}>
                      {statusConfig[status].label}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-medium">
                      {columnAnalyses.length}
                    </span>
                  </div>
                </div>

                {/* Column Content */}
                <div className="flex-1 p-2 overflow-y-auto overflow-x-visible">
                  <div className="space-y-2 min-h-[200px] pt-1 pr-1">
                    {columnAnalyses.length === 0 ? (
                      <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">
                        Nenhuma análise
                      </div>
                    ) : (
                      columnAnalyses.map((analysis) => (
                        <div
                          key={analysis.id}
                          onMouseDown={handleDragAttempt}
                          onTouchStart={handleDragAttempt}
                        >
                          <AgencyKanbanCard
                            analysis={analysis}
                            onClick={() => handleCardClick(analysis)}
                            hasUnread={unreadIds?.analises.has(analysis.id) ?? false}
                          />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <AgencyAnalysisDrawer
        analysis={selectedAnalysis}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </>
  );
}
