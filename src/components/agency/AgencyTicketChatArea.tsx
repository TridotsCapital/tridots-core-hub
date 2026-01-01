import { useState, useEffect, useRef, useCallback } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Send, Loader2, Clock, CheckCircle, AlertCircle, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useTicket,
  useTicketMessages,
  useSendTicketMessage,
  useUpdateTicket,
} from "@/hooks/useTickets";
import { useAuth } from "@/contexts/AuthContext";
import { useNotificationSound } from "@/hooks/useNotificationSound";
import { TicketStatus, TicketCategory } from "@/types/tickets";
import { cn } from "@/lib/utils";

interface AgencyTicketChatAreaProps {
  ticketId: string | null;
}

const statusConfig: Record<TicketStatus, { label: string; className: string; icon: React.ElementType }> = {
  aberto: {
    label: "Aberto",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock,
  },
  em_atendimento: {
    label: "Em Atendimento",
    className: "bg-sky-50 text-sky-700 border-sky-200",
    icon: AlertCircle,
  },
  aguardando_cliente: {
    label: "Aguardando Resposta",
    className: "bg-orange-50 text-orange-700 border-orange-200",
    icon: Clock,
  },
  resolvido: {
    label: "Resolvido",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle,
  },
};

const categoryConfig: Record<TicketCategory, { label: string; className: string }> = {
  financeiro: {
    label: "Financeiro",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  tecnico: {
    label: "Técnico",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  comercial: {
    label: "Comercial",
    className: "bg-purple-50 text-purple-700 border-purple-200",
  },
  urgente: {
    label: "Urgente",
    className: "bg-red-50 text-red-700 border-red-200",
  },
};

export function AgencyTicketChatArea({ ticketId }: AgencyTicketChatAreaProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { playSound } = useNotificationSound();

  const handleNewMessage = useCallback((senderId: string) => {
    if (senderId !== user?.id) {
      playSound();
    }
  }, [user?.id, playSound]);

  const { data: ticket, isLoading: ticketLoading } = useTicket(ticketId || undefined);
  const { data: messages = [], isLoading: messagesLoading } = useTicketMessages(ticketId || undefined, {
    onNewMessage: handleNewMessage,
  });
  const sendMessage = useSendTicketMessage();
  const updateTicket = useUpdateTicket();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || !ticketId || !user) return;

    await sendMessage.mutateAsync({
      ticketId,
      message: message.trim(),
    });

    // If awaiting client response, update to em_atendimento
    if (ticket?.status === "aguardando_cliente") {
      await updateTicket.mutateAsync({
        ticketId,
        updates: { status: "em_atendimento" },
      });
    }

    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Empty state
  if (!ticketId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-muted/20 text-muted-foreground">
        <MessageSquare className="h-16 w-16 mb-4 opacity-30" />
        <h3 className="text-lg font-medium">Selecione um chamado</h3>
        <p className="text-sm mt-1">Escolha um chamado na lista para visualizar a conversa</p>
      </div>
    );
  }

  // Loading state
  if (ticketLoading) {
    return (
      <div className="flex-1 flex flex-col p-4">
        <Skeleton className="h-24 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Chamado não encontrado
      </div>
    );
  }

  const isResolved = ticket.status === "resolvido";

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      {/* Compact Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-card">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-xs font-mono text-muted-foreground shrink-0">
            #{ticket.id.slice(0, 8).toUpperCase()}
          </span>
          <Badge
            variant="outline"
            className={cn("text-xs shrink-0", categoryConfig[ticket.category as TicketCategory].className)}
          >
            {categoryConfig[ticket.category as TicketCategory].label}
          </Badge>
          <h2 className="font-semibold text-sm truncate">
            {ticket.subject}
          </h2>
        </div>
        <Badge
          variant="outline"
          className={cn("shrink-0 ml-2", statusConfig[ticket.status as TicketStatus].className)}
        >
          {statusConfig[ticket.status as TicketStatus].label}
        </Badge>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4">
        <div className="py-2 space-y-3">
          {/* Description as first message */}
          {ticket.description && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="text-xs bg-muted">?</AvatarFallback>
              </Avatar>
              <div className="max-w-[80%]">
                <div className="bg-muted p-3 rounded-tr-2xl rounded-tl-sm rounded-b-2xl">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Descrição do chamado:</p>
                  <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
                </div>
              </div>
            </div>
          )}
          
          {messagesLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 && !ticket.description ? (
            <div className="text-center py-4 text-muted-foreground">
              <p>Nenhuma mensagem ainda.</p>
              <p className="text-sm">Aguarde a resposta da equipe Tridots.</p>
            </div>
          ) : (
            messages.map((msg: any) => {
              const isOwnMessage = msg.sender_id === user?.id;
              const senderName = msg.sender?.full_name || "Usuário";
              const initials = senderName
                .split(" ")
                .map((n: string) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3",
                    isOwnMessage ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback
                      className={cn(
                        "text-xs",
                        isOwnMessage
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className={cn("max-w-[80%]", isOwnMessage && "text-right")}>
                    <div className={cn("flex items-center gap-2 mb-1", isOwnMessage && "flex-row-reverse")}>
                      <span className="text-xs font-medium">
                        {isOwnMessage ? "Você" : senderName}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "inline-block px-4 py-2 text-sm",
                        isOwnMessage
                          ? "bg-primary text-primary-foreground rounded-tl-2xl rounded-tr-sm rounded-b-2xl"
                          : "bg-muted rounded-tr-2xl rounded-tl-sm rounded-b-2xl"
                      )}
                    >
                      <p className="whitespace-pre-wrap">{msg.message}</p>
                    </div>
                    <div className={cn("flex items-center gap-1 mt-1", isOwnMessage && "justify-end")}>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(msg.created_at), "HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Compact Input */}
      <div className="px-4 py-2 border-t bg-background">
        {isResolved ? (
          <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            Este chamado foi resolvido
          </div>
        ) : (
          <div className="flex gap-2 items-end">
            <Textarea
              placeholder="Digite sua mensagem..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[44px] max-h-[120px] resize-none"
              disabled={sendMessage.isPending}
            />
            <Button
              size="icon"
              className="h-[44px] w-11 shrink-0"
              onClick={handleSendMessage}
              disabled={!message.trim() || sendMessage.isPending}
            >
              {sendMessage.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
