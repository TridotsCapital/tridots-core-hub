import { Ticket } from "@/types/tickets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { ticketCategoryConfig, ticketPriorityConfig } from "@/types/tickets";
import { cn } from "@/lib/utils";

interface TicketAgencyHeaderProps {
  ticket: Ticket;
  agencyStats?: {
    activeContracts: number;
    totalCommissions: number;
  } | null;
  onClose: () => void;
}

export function TicketAgencyHeader({ ticket, agencyStats, onClose }: TicketAgencyHeaderProps) {
  const agency = ticket.agency;
  const priorityConfig = ticketPriorityConfig[ticket.priority];
  const categoryConfig = ticketCategoryConfig[ticket.category];
  const agencyName = agency?.nome_fantasia || agency?.razao_social || 'Imobiliária';

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
      <div className="flex items-center gap-3 min-w-0">
        <span className={cn("text-lg", priorityConfig.color)}>
          {priorityConfig.icon}
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold truncate">{ticket.subject}</h2>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="truncate">{agencyName}</span>
            <span>•</span>
            <Badge variant="outline" className={cn("text-[10px] h-5", categoryConfig.color)}>
              {categoryConfig.label}
            </Badge>
          </div>
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0 h-8 w-8">
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}