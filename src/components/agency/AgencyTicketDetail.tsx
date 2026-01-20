import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { X, Send, Loader2, Clock, CheckCircle, AlertCircle, User, FileCheck, Shield, FileText } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  useTicket,
  useTicketMessages,
  useSendTicketMessage,
  useUpdateTicket,
} from "@/hooks/useTickets";
import { useAuth } from "@/contexts/AuthContext";
import { useAgencyPath } from "@/hooks/useAgencyPath";
import { TicketStatus, TicketCategory } from "@/types/tickets";
import { cn } from "@/lib/utils";

interface AgencyTicketDetailProps {
  ticketId: string | null;
  onClose: () => void;
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
  solicitacao_link: {
    label: "Solicitação de Link",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
};

export function AgencyTicketDetail({ ticketId, onClose }: AgencyTicketDetailProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { agencyPath } = useAgencyPath();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: ticket, isLoading: ticketLoading } = useTicket(ticketId || undefined);
  const { data: messages = [], isLoading: messagesLoading } = useTicketMessages(ticketId || undefined);
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

    // Se o ticket estava aguardando resposta do cliente, atualiza para em_atendimento
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

  const isOpen = !!ticketId;
  const isResolved = ticket?.status === "resolvido";

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-[540px] p-0 flex flex-col">
        {ticketLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : ticket ? (
          <>
            {/* Header */}
            <SheetHeader className="p-6 pb-4 border-b">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs font-mono text-muted-foreground">
                      #{ticket.id.slice(0, 8).toUpperCase()}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn("text-xs", categoryConfig[ticket.category as TicketCategory].className)}
                    >
                      {categoryConfig[ticket.category as TicketCategory].label}
                    </Badge>
                    {/* Navigable link badges */}
                    {ticket.claim_id && (
                      <Badge 
                        variant="outline" 
                        className="cursor-pointer hover:bg-amber-100 border-amber-300 text-amber-700 text-xs"
                        onClick={() => navigate(agencyPath(`/claims/${ticket.claim_id}`))}
                      >
                        <Shield className="h-3 w-3 mr-1" />
                        Garantia
                      </Badge>
                    )}
                    {ticket.contract_id && !ticket.claim_id && ticket.analysis_id && (
                      <Badge 
                        variant="outline" 
                        className="cursor-pointer hover:bg-green-100 border-green-300 text-green-700 text-xs"
                        onClick={() => navigate(agencyPath(`/contracts/${ticket.analysis_id}`))}
                      >
                        <FileCheck className="h-3 w-3 mr-1" />
                        Contrato
                      </Badge>
                    )}
                    {ticket.analysis_id && !ticket.contract_id && !ticket.claim_id && (
                      <Badge 
                        variant="outline" 
                        className="cursor-pointer hover:bg-blue-100 border-blue-300 text-blue-700 text-xs"
                        onClick={() => navigate(agencyPath('/analyses'), { state: { analysisId: ticket.analysis_id } })}
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        Análise
                      </Badge>
                    )}
                  </div>
                  <SheetTitle className="text-left text-lg">
                    {ticket.subject}
                  </SheetTitle>
                </div>
                <Badge
                  variant="outline"
                  className={cn("shrink-0", statusConfig[ticket.status as TicketStatus].className)}
                >
                  {statusConfig[ticket.status as TicketStatus].label}
                </Badge>
              </div>

              {ticket.description && (
                <p className="text-sm text-muted-foreground mt-3">
                  {ticket.description}
                </p>
              )}

              <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                <span>
                  Aberto em {format(new Date(ticket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
                {ticket.first_response_at && (
                  <span>
                    Primeira resposta: {formatDistanceToNow(new Date(ticket.first_response_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                )}
              </div>
            </SheetHeader>

            {/* Messages */}
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4">
                {messagesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 && !ticket.description ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Nenhuma mensagem ainda.</p>
                    <p className="text-sm">Aguarde a resposta da equipe Tridots.</p>
                  </div>
                ) : (
                  <>
                    {/* Show ticket description as initial context if exists */}
                    {ticket.description && (
                      <div className="flex gap-3 flex-row">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                            {(ticket.creator?.full_name || "Você")
                              .split(" ")
                              .map((n: string) => n[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 max-w-[80%] text-left">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium">
                              {ticket.creator?.full_name || "Você"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(ticket.created_at), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </span>
                            <Badge variant="outline" className="text-[10px] px-1 py-0">
                              Descrição inicial
                            </Badge>
                          </div>
                          <div className="inline-block rounded-lg px-4 py-2 text-sm bg-primary text-primary-foreground">
                            <p className="whitespace-pre-wrap">{ticket.description}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Regular messages */}
                    {messages.map((msg: any) => {
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

                          <div
                            className={cn(
                              "flex-1 max-w-[80%]",
                              isOwnMessage ? "text-right" : "text-left"
                            )}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium">
                                {isOwnMessage ? "Você" : senderName}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(msg.created_at), {
                                  addSuffix: true,
                                  locale: ptBR,
                                })}
                              </span>
                            </div>
                            <div
                              className={cn(
                                "inline-block rounded-lg px-4 py-2 text-sm",
                                isOwnMessage
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              )}
                            >
                              <p className="whitespace-pre-wrap">{msg.message}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t bg-background">
              {isResolved ? (
                <div className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  Este chamado foi resolvido
                </div>
              ) : (
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Digite sua mensagem..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="min-h-[80px] resize-none"
                    disabled={sendMessage.isPending}
                  />
                  <Button
                    size="icon"
                    className="h-[80px] w-12 shrink-0"
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
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Chamado não encontrado
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
