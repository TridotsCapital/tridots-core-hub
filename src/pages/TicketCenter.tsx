import { useState, useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useTickets, useTicketNotifications } from "@/hooks/useTickets";
import { TicketConversationList } from "@/components/tickets/TicketConversationList";
import { TicketChatArea } from "@/components/tickets/TicketChatArea";
import { TicketStatus, TicketCategory, TicketPriority } from "@/types/tickets";
import { Bell, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useUnreadItemIds } from "@/hooks/useUnreadItemIds";

const TicketCenter = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all' | 'unread'>('all');
  const [contractFilter, setContractFilter] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    status?: TicketStatus | 'all';
    category?: TicketCategory | 'all';
    priority?: TicketPriority | 'all';
    unread_only?: boolean;
  }>({
    status: 'all',
    category: 'all',
    priority: 'all',
    unread_only: false,
  });

  const { data: tickets = [], isLoading } = useTickets(filters as any);
  const { data: notifications } = useTicketNotifications();
  const { data: unreadIds } = useUnreadItemIds();

  // Read contract filter from URL
  useEffect(() => {
    const contract = searchParams.get('contract');
    if (contract) {
      setContractFilter(contract);
    }
  }, [searchParams]);

  // Sync statusFilter with filters
  useEffect(() => {
    if (statusFilter === 'unread') {
      setFilters(f => ({ ...f, status: 'all', unread_only: true }));
    } else {
      setFilters(f => ({ ...f, status: statusFilter, unread_only: false }));
    }
  }, [statusFilter]);

  // Auto-open ticket from notification
  useEffect(() => {
    const state = location.state as { ticketId?: string } | null;
    if (state?.ticketId) {
      setSelectedTicketId(state.ticketId);
      // Clear state to prevent re-opening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const clearContractFilter = () => {
    setContractFilter(null);
    setSearchParams({});
  };

  // Sort tickets by most recent activity (updated_at)
  const sortedTickets = [...tickets].sort((a, b) => 
    new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  // Filter by search term and contract
  const filteredTickets = sortedTickets.filter(ticket => {
    // Contract filter
    if (contractFilter && ticket.analysis_id !== contractFilter) {
      return false;
    }

    if (!search.trim()) return true;
    const searchLower = search.toLowerCase();
    return (
      ticket.subject.toLowerCase().includes(searchLower) ||
      ticket.agency?.nome_fantasia?.toLowerCase().includes(searchLower) ||
      ticket.agency?.razao_social?.toLowerCase().includes(searchLower) ||
      ticket.id.toLowerCase().includes(searchLower)
    );
  });

  const statusFilterOptions: { value: TicketStatus | 'all' | 'unread'; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'unread', label: 'Não lidos' },
    { value: 'aberto', label: 'Abertos' },
    { value: 'em_atendimento', label: 'Em Atendimento' },
    { value: 'aguardando_cliente', label: 'Aguardando' },
    { value: 'resolvido', label: 'Resolvidos' },
  ];

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
        {/* Header with title */}
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

        {/* Contract filter banner */}
        {contractFilter && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-200">
            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
              Filtrado por contrato
            </Badge>
            <span className="text-sm text-amber-700">
              Mostrando apenas chamados do contrato #{contractFilter.slice(0, 8).toUpperCase()}
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-auto h-7 text-amber-700 hover:text-amber-900 hover:bg-amber-100"
              onClick={clearContractFilter}
            >
              <X className="h-4 w-4 mr-1" />
              Limpar filtro
            </Button>
          </div>
        )}

        {/* Top filter bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/30">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar chamados..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto">
            {statusFilterOptions.map((filter) => (
              <Button
                key={filter.value}
                variant={statusFilter === filter.value ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(filter.value)}
                className="whitespace-nowrap h-9"
              >
                {filter.value === "unread" && (
                  <span className="h-2 w-2 rounded-full bg-red-500 mr-1.5"></span>
                )}
                {filter.label}
              </Button>
            ))}
          </div>

          <Button size="sm" className="ml-auto h-9">
            <Plus className="h-4 w-4 mr-2" />
            Novo Chamado
          </Button>
        </div>

        {/* Main content - WhatsApp style layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Conversation List */}
          <div className="w-[380px] border-r flex-shrink-0">
            <TicketConversationList
              tickets={filteredTickets}
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
