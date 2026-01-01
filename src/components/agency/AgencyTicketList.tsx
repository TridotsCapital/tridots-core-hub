import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, MessageSquare, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TicketStatus, TicketCategory } from "@/types/tickets";
import { cn } from "@/lib/utils";
import { useUnreadItemIds, useMarkItemAsRead } from "@/hooks/useUnreadItemIds";

interface Ticket {
  id: string;
  subject: string;
  description: string | null;
  status: TicketStatus;
  category: TicketCategory;
  created_at: string;
  updated_at: string;
  first_response_at: string | null;
}

interface AgencyTicketListProps {
  tickets: Ticket[];
  isLoading: boolean;
  onSelectTicket: (ticketId: string) => void;
  selectedTicketId?: string;
}

const statusConfig: Record<TicketStatus, { label: string; className: string }> = {
  aberto: {
    label: "Aberto",
    className: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50",
  },
  em_atendimento: {
    label: "Em Atendimento",
    className: "bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-50",
  },
  aguardando_cliente: {
    label: "Aguardando Resposta",
    className: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-50",
  },
  resolvido: {
    label: "Resolvido",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50",
  },
};

const categoryConfig: Record<TicketCategory, { label: string; className: string }> = {
  financeiro: {
    label: "Financeiro",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50",
  },
  tecnico: {
    label: "Técnico",
    className: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50",
  },
  comercial: {
    label: "Comercial",
    className: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-50",
  },
  urgente: {
    label: "Urgente",
    className: "bg-red-50 text-red-700 border-red-200 hover:bg-red-50",
  },
};

const statusFilters: { value: TicketStatus | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "aberto", label: "Abertos" },
  { value: "em_atendimento", label: "Em Atendimento" },
  { value: "resolvido", label: "Resolvidos" },
];

export function AgencyTicketList({
  tickets,
  isLoading,
  onSelectTicket,
  selectedTicketId,
}: AgencyTicketListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");
  const { data: unreadIds } = useUnreadItemIds();
  const markAsRead = useMarkItemAsRead();

  const handleSelectTicket = (ticketId: string) => {
    if (unreadIds?.chamados.has(ticketId)) {
      markAsRead(ticketId, 'chamados');
    }
    onSelectTicket(ticketId);
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(search.toLowerCase()) ||
      ticket.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 rounded-lg border border-border bg-muted/30 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por assunto ou protocolo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {statusFilters.map((filter) => (
            <Button
              key={filter.value}
              variant={statusFilter === filter.value ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(filter.value)}
              className="whitespace-nowrap"
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Ticket List */}
      <ScrollArea className="h-[calc(100vh-320px)]">
        <div className="space-y-3 pr-4">
          {filteredTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {search || statusFilter !== "all"
                  ? "Nenhum chamado encontrado com esses filtros."
                  : "Você ainda não tem chamados abertos."}
              </p>
            </div>
          ) : (
            filteredTickets.map((ticket) => {
              const hasUnread = unreadIds?.chamados.has(ticket.id) ?? false;
              return (
                <button
                  key={ticket.id}
                  onClick={() => handleSelectTicket(ticket.id)}
                  className={cn(
                    "w-full text-left p-4 rounded-lg border transition-all relative",
                    "hover:border-primary/50 hover:shadow-sm",
                    selectedTicketId === ticket.id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card",
                    hasUnread && selectedTicketId !== ticket.id && "bg-red-50/50 dark:bg-red-950/20 border-red-200"
                  )}
                >
                  {/* Unread indicator */}
                  {hasUnread && (
                    <span className="absolute top-2 right-2 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                  )}
                  
                  <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-muted-foreground">
                        #{ticket.id.slice(0, 8).toUpperCase()}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn("text-xs", categoryConfig[ticket.category].className)}
                      >
                        {categoryConfig[ticket.category].label}
                      </Badge>
                    </div>
                    <h4 className="font-medium text-foreground truncate">
                      {ticket.subject}
                    </h4>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("shrink-0", statusConfig[ticket.status].className)}
                  >
                    {statusConfig[ticket.status].label}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(ticket.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                  {ticket.status === "aguardando_cliente" && (
                    <span className="text-orange-600 font-medium">
                      Aguardando sua resposta
                    </span>
                  )}
                </div>
              </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
