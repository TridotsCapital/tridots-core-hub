import { Ticket } from "@/types/tickets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Mail, Phone, FileText, DollarSign, X, ExternalLink } from "lucide-react";
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
    <div className="border-b bg-gradient-to-r from-card to-muted/30 p-4">
      {/* Top row: ticket info and close button */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={cn("font-bold text-lg", priorityConfig.color)}>
            {priorityConfig.icon}
          </span>
          <div>
            <h2 className="text-lg font-semibold line-clamp-1">{ticket.subject}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className={cn("text-xs", categoryConfig.color)}>
                {categoryConfig.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                #{ticket.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Agency info card */}
      <div className="bg-background/60 rounded-lg p-3 border">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{agencyName}</h3>
            {agency?.razao_social && agency.razao_social !== agencyName && (
              <p className="text-xs text-muted-foreground truncate">{agency.razao_social}</p>
            )}
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
              {agency?.responsavel_nome && (
                <span className="text-xs text-muted-foreground">
                  {agency.responsavel_nome}
                </span>
              )}
              {agency?.responsavel_email && (
                <a
                  href={`mailto:${agency.responsavel_email}`}
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Mail className="h-3 w-3" />
                  {agency.responsavel_email}
                </a>
              )}
              {agency?.responsavel_telefone && (
                <a
                  href={`tel:${agency.responsavel_telefone}`}
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Phone className="h-3 w-3" />
                  {agency.responsavel_telefone}
                </a>
              )}
            </div>
          </div>

          {/* Quick stats */}
          {agencyStats && (
            <div className="flex gap-4 shrink-0">
              <div className="text-center">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  <span className="text-xs">Contratos</span>
                </div>
                <p className="font-bold text-lg">{agencyStats.activeContracts}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span className="text-xs">Comissões</span>
                </div>
                <p className="font-bold text-lg">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                    notation: "compact",
                  }).format(agencyStats.totalCommissions)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
