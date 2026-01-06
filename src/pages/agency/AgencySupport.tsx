import { useState, useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { AgencyLayout } from "@/components/layout/AgencyLayout";
import { AgencyTicketForm } from "@/components/agency/AgencyTicketForm";
import { AgencyTicketChatArea } from "@/components/agency/AgencyTicketChatArea";
import { useAgencyUser } from "@/hooks/useAgencyUser";
import { useAgencyTickets } from "@/hooks/useTickets";
import { useUnreadItemIds, useMarkItemAsRead } from "@/hooks/useUnreadItemIds";
import { Loader2, Search, MessageSquare, Clock, FileText, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TicketStatus, TicketCategory } from "@/types/tickets";
import { cn } from "@/lib/utils";

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

type StatusFilterValue = TicketStatus | "all" | "unread";

const statusFilters: { value: StatusFilterValue; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "unread", label: "Não lidos" },
  { value: "aberto", label: "Abertos" },
  { value: "em_atendimento", label: "Em Atendimento" },
  { value: "resolvido", label: "Resolvidos" },
];

export default function AgencySupport() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all");
  const [linkFilter, setLinkFilter] = useState<'all' | 'analysis' | 'contract'>('all');
  const [contractFilter, setContractFilter] = useState<string | null>(null);
  
  const { data: agencyUser, isLoading: agencyUserLoading } = useAgencyUser();
  const { data: tickets = [], isLoading: ticketsLoading } = useAgencyTickets(
    agencyUser?.agency_id
  );
  const { data: unreadIds } = useUnreadItemIds();
  const markAsRead = useMarkItemAsRead();

  // Read contract filter from URL
  useEffect(() => {
    const contract = searchParams.get('contract');
    if (contract) {
      setContractFilter(contract);
    }
  }, [searchParams]);

  // Auto-open ticket from notification
  useEffect(() => {
    const state = location.state as { ticketId?: string } | null;
    if (state?.ticketId) {
      setSelectedTicketId(state.ticketId);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleSelectTicket = (ticketId: string) => {
    if (unreadIds?.chamados.has(ticketId)) {
      markAsRead(ticketId, 'chamados');
    }
    setSelectedTicketId(ticketId);
  };

  const clearContractFilter = () => {
    setContractFilter(null);
    setSearchParams({});
  };

  // Sort tickets by most recent activity
  const sortedTickets = [...tickets].sort((a, b) => 
    new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  // Filter tickets
  const filteredTickets = sortedTickets.filter((ticket) => {
    // Contract filter from URL
    if (contractFilter && ticket.analysis_id !== contractFilter) {
      return false;
    }

    const matchesSearch =
      ticket.subject.toLowerCase().includes(search.toLowerCase()) ||
      ticket.id.toLowerCase().includes(search.toLowerCase());
    
    // Link filter: analysis (has analysis_id but no contract) or contract (has contract)
    const hasContract = !!(ticket as any).contract?.id;
    const hasAnalysis = !!ticket.analysis_id;
    
    if (linkFilter === 'analysis' && (!hasAnalysis || hasContract)) return false;
    if (linkFilter === 'contract' && !hasContract) return false;
    
    if (statusFilter === "unread") {
      return matchesSearch && unreadIds?.chamados.has(ticket.id);
    }
    
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (agencyUserLoading) {
    return (
      <AgencyLayout title="Suporte" description="Central de atendimento e tickets">
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AgencyLayout>
    );
  }

  if (!agencyUser?.agency_id) {
    return (
      <AgencyLayout title="Suporte" description="Central de atendimento e tickets">
        <div className="flex items-center justify-center h-[400px] border-2 border-dashed border-border rounded-lg">
          <p className="text-muted-foreground">
            Você não está vinculado a nenhuma imobiliária.
          </p>
        </div>
      </AgencyLayout>
    );
  }

  return (
    <AgencyLayout title="Suporte" description="Central de atendimento e tickets">
      <div className="h-[calc(100vh-9rem)] flex flex-col">
        {/* Contract filter banner */}
        {contractFilter && (
          <div className="flex items-center gap-2 px-4 py-2 mb-3 bg-amber-50 border border-amber-200 rounded-lg">
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
        <div className="flex flex-col sm:flex-row gap-3 pb-4">
          <div className="relative flex-1 max-w-md">
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
                {filter.value === "unread" && (
                  <span className="h-2 w-2 rounded-full bg-red-500 mr-1.5"></span>
                )}
                {filter.label}
              </Button>
            ))}
            <Select value={linkFilter} onValueChange={(v) => setLinkFilter(v as any)}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="Vínculo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="analysis">Apenas Análises</SelectItem>
                <SelectItem value="contract">Apenas Contratos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AgencyTicketForm agencyId={agencyUser.agency_id} />
        </div>

        {/* Two-column layout */}
        <div className="flex-1 flex overflow-hidden rounded-lg border bg-card min-h-0">
          {/* Left: Ticket List */}
          <div className="w-[380px] border-r flex-shrink-0 flex flex-col min-h-0 overflow-hidden">
            {ticketsLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-24 rounded-lg border border-border bg-muted/30 animate-pulse"
                  />
                ))}
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground p-4">
                <MessageSquare className="h-12 w-12 mb-3 opacity-50" />
                <p className="font-medium">Nenhum chamado encontrado</p>
                <p className="text-sm text-center mt-1">
                  {search || statusFilter !== "all" || contractFilter
                    ? "Tente buscar com outros filtros"
                    : "Seus chamados aparecerão aqui"}
                </p>
              </div>
            ) : (
              <ScrollArea className="flex-1">
                <div className="divide-y">
                  {filteredTickets.map((ticket) => {
                    const hasUnread = unreadIds?.chamados.has(ticket.id) ?? false;
                    return (
                      <button
                        key={ticket.id}
                        onClick={() => handleSelectTicket(ticket.id)}
                        className={cn(
                          "w-full text-left p-4 transition-all relative hover:bg-muted/50",
                          selectedTicketId === ticket.id
                            ? "bg-primary/5 border-l-2 border-l-primary"
                            : "",
                          hasUnread && selectedTicketId !== ticket.id && "bg-red-50/50 dark:bg-red-950/20"
                        )}
                      >
                        {/* Unread indicator */}
                        {hasUnread && (
                          <span className="absolute top-2 right-2 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                          </span>
                        )}
                        
                        {/* Header row: ID + Category + Contract badge */}
                        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                          <span className="text-xs font-mono text-muted-foreground shrink-0">
                            #{ticket.id.slice(0, 8).toUpperCase()}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn("text-[10px] px-1.5 py-0 shrink-0", categoryConfig[ticket.category as TicketCategory].className)}
                          >
                            {categoryConfig[ticket.category as TicketCategory].label}
                          </Badge>
                          {ticket.analysis_id && (
                            (ticket as any).contract?.id ? (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                                <FileText className="h-2.5 w-2.5 mr-0.5" />
                                Contrato
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0 bg-blue-100 text-blue-700 border-blue-200">
                                <FileText className="h-2.5 w-2.5 mr-0.5" />
                                Análise
                              </Badge>
                            )
                          )}
                        </div>

                        {/* Subject */}
                        <h4 className="font-medium text-foreground line-clamp-2 break-words mb-2 pr-6">
                          {ticket.subject}
                        </h4>

                        {/* Footer: Time + Status */}
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pr-6">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(ticket.created_at), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn("text-[10px] px-1.5 py-0 shrink-0 ml-auto", statusConfig[ticket.status as TicketStatus].className)}
                          >
                            {statusConfig[ticket.status as TicketStatus].label}
                          </Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Right: Chat Area */}
          <AgencyTicketChatArea ticketId={selectedTicketId} />
        </div>
      </div>
    </AgencyLayout>
  );
}
