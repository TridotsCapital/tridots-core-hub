import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useTickets, useTicketNotifications } from "@/hooks/useTickets";
import { TicketConversationList } from "@/components/tickets/TicketConversationList";
import { TicketChatArea } from "@/components/tickets/TicketChatArea";
import { TicketStatus, TicketCategory, TicketPriority } from "@/types/tickets";
import { Bell } from "lucide-react";

const TicketCenter = () => {
  const location = useLocation();
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    status?: TicketStatus | 'all';
    category?: TicketCategory | 'all';
    priority?: TicketPriority | 'all';
  }>({
    status: 'all',
    category: 'all',
    priority: 'all',
  });

  const { data: tickets = [], isLoading } = useTickets(filters as any);
  const { data: notifications } = useTicketNotifications();

  // Auto-open ticket from notification
  useEffect(() => {
    const state = location.state as { ticketId?: string } | null;
    if (state?.ticketId) {
      setSelectedTicketId(state.ticketId);
      // Clear state to prevent re-opening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Sort tickets by most recent activity (updated_at)
  const sortedTickets = [...tickets].sort((a, b) => 
    new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  // Sound notification for urgent tickets
  useEffect(() => {
    if (notifications && notifications.length > 0) {
      const hasUrgent = notifications.some(n => n.type === 'new_message');
      if (hasUrgent) {
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
        <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
          <div>
            <h1 className="text-xl font-bold">Central de Atendimento</h1>
            <p className="text-xs text-muted-foreground">
              Gerencie chamados das imobiliárias
            </p>
          </div>
          {unreadCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-destructive/10 text-destructive rounded-full animate-pulse">
              <Bell className="h-4 w-4" />
              <span className="text-sm font-medium">{unreadCount} novo{unreadCount > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Main content - WhatsApp style layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Conversation List */}
          <div className="w-[380px] border-r flex-shrink-0">
            <TicketConversationList
              tickets={sortedTickets}
              isLoading={isLoading}
              selectedTicketId={selectedTicketId}
              onSelectTicket={setSelectedTicketId}
              filters={filters}
              onFiltersChange={setFilters}
            />
          </div>

          {/* Right: Chat Area */}
          <TicketChatArea
            ticketId={selectedTicketId}
            onClose={() => setSelectedTicketId(null)}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TicketCenter;
