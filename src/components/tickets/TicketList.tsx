import { Ticket, ticketCategoryConfig, ticketStatusConfig, ticketPriorityConfig } from "@/types/tickets";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, User, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TicketListProps {
  tickets: Ticket[];
  isLoading: boolean;
  selectedTicketId: string | null;
  onSelectTicket: (ticketId: string) => void;
}

function getWaitTimeColor(createdAt: string): string {
  const hours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  if (hours < 24) return "border-l-green-500";
  if (hours < 48) return "border-l-yellow-500";
  return "border-l-red-500";
}

export function TicketList({ tickets, isLoading, selectedTicketId, onSelectTicket }: TicketListProps) {
  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-4">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Building2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-medium text-lg">Nenhum ticket encontrado</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Não há chamados com os filtros selecionados
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {tickets.map((ticket) => {
        const categoryConfig = ticketCategoryConfig[ticket.category];
        const statusConfig = ticketStatusConfig[ticket.status];
        const priorityConfig = ticketPriorityConfig[ticket.priority];
        const waitTimeColor = getWaitTimeColor(ticket.created_at);

        return (
          <div
            key={ticket.id}
            onClick={() => onSelectTicket(ticket.id)}
            className={cn(
              "p-4 cursor-pointer transition-all hover:bg-muted/50 border-l-4",
              waitTimeColor,
              selectedTicketId === ticket.id && "bg-muted"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn("text-sm font-bold", priorityConfig.color)}>
                    {priorityConfig.icon}
                  </span>
                  <h3 className="font-medium truncate">{ticket.subject}</h3>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Building2 className="h-3.5 w-3.5" />
                  <span className="truncate">
                    {ticket.agency?.nome_fantasia || ticket.agency?.razao_social}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={categoryConfig.color}>
                    {categoryConfig.label}
                  </Badge>
                  <Badge variant="outline" className={statusConfig.color}>
                    {statusConfig.label}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(ticket.created_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </div>

                {ticket.assignee ? (
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={ticket.assignee.avatar_url || undefined} />
                    <AvatarFallback className="text-[10px]">
                      {ticket.assignee.full_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-3 w-3 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
