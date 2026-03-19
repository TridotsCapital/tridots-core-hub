import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Ticket, TicketStatus, TicketCategory, TicketPriority, ticketStatusConfig, ticketCategoryConfig, ticketPriorityConfig } from "@/types/tickets";
import { TicketConversationItem } from "./TicketConversationItem";
import { SlidersHorizontal, X, MessageSquare, FileText } from "lucide-react";
import { useUnreadItemIds, useMarkItemAsRead, useMarkItemAsUnread } from "@/hooks/useUnreadItemIds";

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
    has_contract?: boolean;
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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { data: unreadIds } = useUnreadItemIds();
  const markAsRead = useMarkItemAsRead();

  const handleSelectTicket = (ticketId: string) => {
    if (unreadIds?.chamados.has(ticketId)) {
      markAsRead(ticketId, 'chamados');
    }
    onSelectTicket(ticketId);
  };

  const filteredTickets = useMemo(() => {
    let result = tickets;
    
    if (filters.unread_only && unreadIds?.chamados) {
      result = result.filter(t => unreadIds.chamados.has(t.id));
    }

    if (filters.has_contract) {
      result = result.filter(t => t.analysis_id !== null);
    }
    
    return result;
  }, [tickets, filters.unread_only, filters.has_contract, unreadIds]);

  const activeFiltersCount = [
    filters.category && filters.category !== 'all',
    filters.priority && filters.priority !== 'all',
    filters.has_contract,
  ].filter(Boolean).length;

  const clearFilters = () => {
    onFiltersChange({ ...filters, category: 'all', priority: 'all', has_contract: undefined });
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
      {/* Additional Filters Header */}
      <div className="p-3 border-b">
        <div className="flex gap-2 items-center">
          <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 relative">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Mais filtros
                {activeFiltersCount > 0 && (
                  <span className="ml-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-4" align="start">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Filtros Avançados</h4>
                  {activeFiltersCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-auto p-0 text-xs">
                      Limpar
                    </Button>
                  )}
                </div>
                
                <div className="space-y-3">
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

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Vínculo</label>
                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        variant={!filters.has_contract ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => onFiltersChange({ ...filters, has_contract: undefined })}
                      >
                        Todos
                      </Button>
                      <Button
                        variant={filters.has_contract ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => onFiltersChange({ ...filters, has_contract: true })}
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        Com Contrato
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Active filters chips */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-1.5">
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
              {filters.has_contract && (
                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                  <FileText className="h-3 w-3" />
                  Com Contrato
                  <X className="h-3 w-3 cursor-pointer" onClick={() => onFiltersChange({ ...filters, has_contract: undefined })} />
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        {filteredTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground p-4">
            <MessageSquare className="h-12 w-12 mb-3 opacity-50" />
            <p className="font-medium">Nenhum chamado encontrado</p>
            <p className="text-sm text-center mt-1">
              Os chamados aparecerão aqui
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
