import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Ticket, TicketStatus, TicketCategory, TicketPriority, ticketStatusConfig, ticketCategoryConfig, ticketPriorityConfig } from "@/types/tickets";
import { TicketConversationItem } from "./TicketConversationItem";
import { Search, SlidersHorizontal, X, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUnreadItemIds, useMarkItemAsRead } from "@/hooks/useUnreadItemIds";

interface TicketConversationListProps {
  tickets: Ticket[];
  isLoading: boolean;
  selectedTicketId: string | null;
  onSelectTicket: (id: string) => void;
  filters: {
    status?: TicketStatus | 'all';
    category?: TicketCategory | 'all';
    priority?: TicketPriority | 'all';
    unread_only?: boolean;
  };
  onFiltersChange: (filters: any) => void;
  lastMessages?: Record<string, string>;
}

export function TicketConversationList({
  tickets,
  isLoading,
  selectedTicketId,
  onSelectTicket,
  filters,
  onFiltersChange,
  lastMessages = {},
}: TicketConversationListProps) {
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { data: unreadIds } = useUnreadItemIds();
  const markAsRead = useMarkItemAsRead();

  const handleSelectTicket = (ticketId: string) => {
    // Mark as read when selecting
    if (unreadIds?.chamados.has(ticketId)) {
      markAsRead(ticketId, 'chamados');
    }
    onSelectTicket(ticketId);
  };

  const filteredTickets = useMemo(() => {
    let result = tickets;
    
    // Filter by unread only
    if (filters.unread_only && unreadIds?.chamados) {
      result = result.filter(t => unreadIds.chamados.has(t.id));
    }
    
    // Filter by search
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(t => 
        t.subject.toLowerCase().includes(searchLower) ||
        t.agency?.nome_fantasia?.toLowerCase().includes(searchLower) ||
        t.agency?.razao_social?.toLowerCase().includes(searchLower)
      );
    }
    
    return result;
  }, [tickets, search, filters.unread_only, unreadIds]);

  const activeFiltersCount = [
    filters.status && filters.status !== 'all',
    filters.category && filters.category !== 'all',
    filters.priority && filters.priority !== 'all',
    filters.unread_only,
  ].filter(Boolean).length;

  const clearFilters = () => {
    onFiltersChange({ status: 'all', category: 'all', priority: 'all', unread_only: false });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b">
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex-1 p-2 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Search and Filters Header */}
      <div className="p-3 border-b space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar chamados..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
            {search && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearch("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10 relative shrink-0">
                <SlidersHorizontal className="h-4 w-4" />
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-4" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Filtros</h4>
                  {activeFiltersCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-auto p-0 text-xs">
                      Limpar
                    </Button>
                  )}
                </div>
                
                <div className="space-y-3">
                  {/* Unread Filter */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Leitura</label>
                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        variant={!filters.unread_only ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => onFiltersChange({ ...filters, unread_only: false })}
                      >
                        Todos
                      </Button>
                      <Button
                        variant={filters.unread_only ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => onFiltersChange({ ...filters, unread_only: true })}
                      >
                        <span className="h-2 w-2 rounded-full bg-red-500 mr-1.5"></span>
                        Não lidos
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Status</label>
                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        variant={filters.status === 'all' ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => onFiltersChange({ ...filters, status: 'all' })}
                      >
                        Todos
                      </Button>
                      {Object.entries(ticketStatusConfig).map(([key, config]) => (
                        <Button
                          key={key}
                          variant={filters.status === key ? "default" : "outline"}
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => onFiltersChange({ ...filters, status: key })}
                        >
                          {config.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Categoria</label>
                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        variant={filters.category === 'all' ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => onFiltersChange({ ...filters, category: 'all' })}
                      >
                        Todas
                      </Button>
                      {Object.entries(ticketCategoryConfig).map(([key, config]) => (
                        <Button
                          key={key}
                          variant={filters.category === key ? "default" : "outline"}
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => onFiltersChange({ ...filters, category: key })}
                        >
                          {config.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Prioridade</label>
                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        variant={filters.priority === 'all' ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => onFiltersChange({ ...filters, priority: 'all' })}
                      >
                        Todas
                      </Button>
                      {Object.entries(ticketPriorityConfig).map(([key, config]) => (
                        <Button
                          key={key}
                          variant={filters.priority === key ? "default" : "outline"}
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => onFiltersChange({ ...filters, priority: key })}
                        >
                          {config.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Active filters chips */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {filters.unread_only && (
              <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                Não lidos
                <X className="h-3 w-3 cursor-pointer" onClick={() => onFiltersChange({ ...filters, unread_only: false })} />
              </span>
            )}
            {filters.status && filters.status !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                {ticketStatusConfig[filters.status]?.label}
                <X className="h-3 w-3 cursor-pointer" onClick={() => onFiltersChange({ ...filters, status: 'all' })} />
              </span>
            )}
            {filters.category && filters.category !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                {ticketCategoryConfig[filters.category]?.label}
                <X className="h-3 w-3 cursor-pointer" onClick={() => onFiltersChange({ ...filters, category: 'all' })} />
              </span>
            )}
            {filters.priority && filters.priority !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                {ticketPriorityConfig[filters.priority]?.label}
                <X className="h-3 w-3 cursor-pointer" onClick={() => onFiltersChange({ ...filters, priority: 'all' })} />
              </span>
            )}
          </div>
        )}
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        {filteredTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground p-4">
            <MessageSquare className="h-12 w-12 mb-3 opacity-50" />
            <p className="font-medium">Nenhum chamado encontrado</p>
            <p className="text-sm text-center mt-1">
              {search ? "Tente buscar com outros termos" : "Os chamados aparecerão aqui"}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredTickets.map((ticket) => (
              <TicketConversationItem
                key={ticket.id}
                ticket={ticket}
                isSelected={selectedTicketId === ticket.id}
                lastMessage={lastMessages[ticket.id]}
                hasUnread={unreadIds?.chamados.has(ticket.id) ?? false}
                onClick={() => handleSelectTicket(ticket.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
