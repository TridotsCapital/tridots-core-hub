import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Ticket, ticketStatusConfig, ticketPriorityConfig } from "@/types/tickets";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { FileText, Shield, Mail, MailOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface TicketConversationItemProps {
  ticket: Ticket;
  isSelected: boolean;
  lastMessage?: string;
  unreadCount?: number;
  hasUnread?: boolean;
  onClick: () => void;
  onMarkAsRead?: (ticketId: string) => void;
  onMarkAsUnread?: (ticketId: string) => void;
}

export function TicketConversationItem({
  ticket,
  isSelected,
  lastMessage,
  unreadCount = 0,
  hasUnread = false,
  onClick,
  onMarkAsRead,
  onMarkAsUnread,
}: TicketConversationItemProps) {
  const statusConfig = ticketStatusConfig[ticket.status];
  const priorityConfig = ticketPriorityConfig[ticket.priority];

  // Calculate wait time color
  const getWaitTimeColor = () => {
    const hours = (Date.now() - new Date(ticket.updated_at).getTime()) / (1000 * 60 * 60);
    if (ticket.status === 'resolvido') return 'border-l-green-500';
    if (hours > 48 || ticket.category === 'urgente') return 'border-l-red-500';
    if (hours > 24) return 'border-l-yellow-500';
    return 'border-l-green-500';
  };

  const agencyName = ticket.agency?.nome_fantasia || ticket.agency?.razao_social || 'Imobiliária';
  const initials = agencyName.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();

  const handleToggleRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasUnread) {
      onMarkAsRead?.(ticket.id);
    } else {
      onMarkAsUnread?.(ticket.id);
    }
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "group flex items-start gap-3 p-4 cursor-pointer transition-all duration-200 border-l-4 relative",
        "hover:bg-muted/50",
        getWaitTimeColor(),
        isSelected ? "bg-primary/5 border-l-primary" : "border-l-transparent",
        hasUnread && !isSelected && "bg-red-50/50 dark:bg-red-950/20"
      )}
    >
      {/* Read/Unread toggle on hover — replaces unread dot */}
      <div className="absolute top-2 right-2">
        {hasUnread && (
          <span className="flex h-3 w-3 group-hover:hidden">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-7 w-7 rounded-full hidden group-hover:flex",
                hasUnread
                  ? "text-primary hover:bg-primary/10"
                  : "text-muted-foreground hover:bg-muted"
              )}
              onClick={handleToggleRead}
            >
              {hasUnread ? <MailOpen className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="text-xs">
            {hasUnread ? "Marcar como lido" : "Marcar como não lido"}
          </TooltipContent>
        </Tooltip>
      </div>
      
      <Avatar className="h-12 w-12 shrink-0">
        <AvatarImage 
          src={ticket.agency?.logo_url || undefined} 
          alt={agencyName}
        />
        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-sm truncate">{agencyName}</span>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: false, locale: ptBR })}
          </span>
        </div>

        <p className="text-sm font-medium line-clamp-2 break-words mt-0.5 pr-6">{ticket.subject}</p>

        <p className="text-xs text-muted-foreground line-clamp-2 break-words mt-1 pr-6">
          {lastMessage || ticket.description || 'Sem mensagens ainda'}
        </p>

        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 shrink-0 whitespace-nowrap", statusConfig.color)}>
            {statusConfig.label}
          </Badge>
          <span className={cn("text-xs shrink-0", priorityConfig.color)}>
            {priorityConfig.icon}
          </span>
          {ticket.claim_id && (
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 py-0 shrink-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              <Shield className="h-2.5 w-2.5 mr-0.5" />
              Garantia
            </Badge>
          )}
          {ticket.contract_id && !ticket.claim_id && (
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 py-0 shrink-0">
              <FileText className="h-2.5 w-2.5 mr-0.5" />
              Contrato
            </Badge>
          )}
          {ticket.analysis_id && !ticket.contract_id && !ticket.claim_id && (
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 py-0 shrink-0 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              <FileText className="h-2.5 w-2.5 mr-0.5" />
              Análise
            </Badge>
          )}
          {unreadCount > 0 && (
            <span className="ml-auto bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shrink-0">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}