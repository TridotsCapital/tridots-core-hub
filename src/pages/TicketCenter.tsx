import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useTickets, useTicketNotifications } from "@/hooks/useTickets";
import { TicketList } from "@/components/tickets/TicketList";
import { TicketFilters } from "@/components/tickets/TicketFilters";
import { TicketDetail } from "@/components/tickets/TicketDetail";
import { TicketStatus, TicketCategory, TicketPriority } from "@/types/tickets";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

const TicketCenter = () => {
  const { user } = useAuth();
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    status?: TicketStatus | 'all';
    category?: TicketCategory | 'all';
    priority?: TicketPriority | 'all';
    agency_id?: string;
    assigned_to?: string;
  }>({});

  const { data: tickets, isLoading } = useTickets(filters as any);
  const { data: notifications } = useTicketNotifications();

  // Sound notification for urgent tickets
  useEffect(() => {
    if (notifications && notifications.length > 0) {
      const hasUrgent = notifications.some(n => n.type === 'new_message');
      if (hasUrgent) {
        // Play notification sound
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => {});
      }
    }
  }, [notifications?.length]);

  const unreadCount = notifications?.length || 0;

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-card">
          <div>
            <h1 className="text-2xl font-bold">Central de Atendimento</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie todos os chamados das imobiliárias
            </p>
          </div>
          <div className="flex items-center gap-4">
            {unreadCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-500 rounded-full animate-pulse">
                <Bell className="h-4 w-4" />
                <span className="text-sm font-medium">{unreadCount} novo{unreadCount > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <TicketFilters filters={filters} onFiltersChange={setFilters} />

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Ticket list */}
          <div className={`${selectedTicketId ? 'w-1/3 border-r' : 'w-full'} overflow-auto`}>
            <TicketList
              tickets={tickets || []}
              isLoading={isLoading}
              selectedTicketId={selectedTicketId}
              onSelectTicket={setSelectedTicketId}
            />
          </div>

          {/* Ticket detail */}
          {selectedTicketId && (
            <div className="flex-1 overflow-hidden">
              <TicketDetail
                ticketId={selectedTicketId}
                onClose={() => setSelectedTicketId(null)}
              />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TicketCenter;
