import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { AgencyClaimKanbanCard } from './AgencyClaimKanbanCard';
import { ClaimDetailDrawer } from './ClaimDetailDrawer';
import { ClaimTicketSheet } from './ClaimTicketSheet';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useUnreadItemIds, useMarkItemAsRead } from '@/hooks/useUnreadItemIds';
import type { Claim, ClaimPublicStatus } from '@/types/claims';
import { claimPublicStatusConfig } from '@/types/claims';

interface AgencyClaimsKanbanProps {
  claims: Claim[];
  onRefresh: () => void;
}

const columns: ClaimPublicStatus[] = [
  'solicitado',
  'em_analise_tecnica',
  'pagamento_programado',
  'finalizado',
];

export function AgencyClaimsKanban({ claims, onRefresh }: AgencyClaimsKanbanProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [ticketSheetOpen, setTicketSheetOpen] = useState(false);
  
  const { data: unreadIds } = useUnreadItemIds();
  const markAsRead = useMarkItemAsRead();

  // Configure DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const getClaimsByStatus = (status: ClaimPublicStatus) => {
    return claims.filter((claim) => claim.public_status === status && !claim.canceled_at);
  };

  const handleCardClick = (claim: Claim) => {
    // Mark as read when clicking
    if (unreadIds?.garantias.has(claim.id)) {
      markAsRead(claim.id, 'sinistros');
    }
    navigate(`/agency/claims/${claim.id}`);
  };

  const handleViewDetails = (claim: Claim) => {
    setSelectedClaim(claim);
    setDrawerOpen(true);
  };

  const handleOpenTicket = (claim: Claim) => {
    setSelectedClaim(claim);
    setTicketSheetOpen(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    // Always show the message - user cannot change status
    toast({
      title: "Ação não permitida",
      description: "Apenas a equipe Tridots pode alterar o status da garantia.",
      variant: "destructive",
    });
  };

  return (
    <>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4 min-w-max">
            {columns.map((status) => {
              const statusConfig = claimPublicStatusConfig[status];
              const columnClaims = getClaimsByStatus(status);

              return (
                <div
                  key={status}
                  className="w-[300px] flex-shrink-0 bg-muted/30 rounded-xl p-3"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${statusConfig.bgColor.replace(
                          'bg-',
                          'bg-'
                        )}`}
                        style={{
                          backgroundColor: statusConfig.color
                            .replace('text-', '')
                            .includes('-')
                            ? undefined
                            : undefined,
                        }}
                      />
                      <h3 className="font-semibold text-sm">{statusConfig.label}</h3>
                    </div>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {columnClaims.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="space-y-2">
                    {columnClaims.length === 0 ? (
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        Nenhuma garantia
                      </div>
                    ) : (
                      columnClaims.map((claim) => (
                        <AgencyClaimKanbanCard
                          key={claim.id}
                          claim={claim}
                          onClick={() => handleCardClick(claim)}
                          onViewDetails={() => handleViewDetails(claim)}
                          onOpenTicket={() => handleOpenTicket(claim)}
                          hasUnread={unreadIds?.garantias.has(claim.id) ?? false}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </DndContext>

      {/* Detail Drawer */}
      <ClaimDetailDrawer
        claim={selectedClaim}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />

      {/* Ticket Sheet */}
      {selectedClaim && (
        <ClaimTicketSheet
          claim={selectedClaim}
          open={ticketSheetOpen}
          onOpenChange={setTicketSheetOpen}
        />
      )}
    </>
  );
}
