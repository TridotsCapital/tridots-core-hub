import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTicket, useTicketMessages, useSendTicketMessage, useUpdateTicket, useTypingIndicators, useSetTypingIndicator, useQuickReplies, useAgencyStats } from "@/hooks/useTickets";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ticketCategoryConfig, ticketStatusConfig, ticketPriorityConfig, TicketStatus } from "@/types/tickets";
import { X, Send, Zap, Building2, Phone, Mail, FileText, DollarSign, Clock, User, ChevronDown, Shield, AlertTriangle } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TicketDetailProps {
  ticketId: string;
  onClose: () => void;
}

export function TicketDetail({ ticketId, onClose }: TicketDetailProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const { data: ticket, isLoading: ticketLoading } = useTicket(ticketId);
  const { data: messages, isLoading: messagesLoading } = useTicketMessages(ticketId);
  const { data: typingIndicators } = useTypingIndicators(ticketId);
  const { data: quickReplies } = useQuickReplies(ticket?.category);
  const { data: agencyStats } = useAgencyStats(ticket?.agency_id);

  const sendMessage = useSendTicketMessage();
  const updateTicket = useUpdateTicket();
  const setTypingIndicator = useSetTypingIndicator();

  // Get analysts for assignment
  const { data: analysts } = useQuery({
    queryKey: ["analysts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`id, full_name, user_roles!inner(role)`)
        .eq("active", true);
      if (error) throw error;
      return data;
    },
  });

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle typing indicator
  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      setTypingIndicator.mutate({ ticketId, isTyping: true });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      setTypingIndicator.mutate({ ticketId, isTyping: false });
    }, 2000);
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    await sendMessage.mutateAsync({ ticketId, message: message.trim() });
    setMessage("");
    setIsTyping(false);
    setTypingIndicator.mutate({ ticketId, isTyping: false });

    // If ticket is open, move to em_atendimento
    if (ticket?.status === 'aberto') {
      updateTicket.mutate({ 
        ticketId, 
        updates: { 
          status: 'em_atendimento' as TicketStatus,
          assigned_to: user?.id 
        } 
      });
    }
  };

  const handleStatusChange = (status: TicketStatus) => {
    const updates: any = { status };
    if (status === 'resolvido') {
      updates.resolved_at = new Date().toISOString();
    }
    updateTicket.mutate({ ticketId, updates });
  };

  const handleAssigneeChange = (assigneeId: string) => {
    updateTicket.mutate({ 
      ticketId, 
      updates: { 
        assigned_to: assigneeId === 'unassigned' ? null : assigneeId 
      } 
    });
  };

  const handleQuickReply = (content: string) => {
    setMessage(content);
  };

  const otherTypingUsers = typingIndicators?.filter(t => t.user_id !== user?.id) || [];

  if (ticketLoading) {
    return (
      <div className="h-full flex flex-col p-4">
        <Skeleton className="h-8 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Ticket não encontrado</p>
      </div>
    );
  }

  const categoryConfig = ticketCategoryConfig[ticket.category];
  const statusConfig = ticketStatusConfig[ticket.status];
  const priorityConfig = ticketPriorityConfig[ticket.priority];

  return (
    <div className="h-full flex">
      {/* Deleted link banner */}
      {(ticket as any).deleted_link_info && (
        <div className="absolute top-0 left-0 right-72 z-10">
          <div className="mx-4 mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              {(() => {
                const info = (ticket as any).deleted_link_info;
                const entityLabel = info.entity_type === 'analysis' ? 'análise' : info.entity_type === 'contract' ? 'contrato' : 'garantia';
                const deletedDate = new Date(info.deleted_at).toLocaleDateString('pt-BR');
                return `A ${entityLabel} vinculada (${info.tenant_name}) foi excluída em ${deletedDate} por ${info.deleted_by}. O link original não está mais disponível.`;
              })()}
            </p>
          </div>
        </div>
      )}
      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-card">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={cn("font-bold", priorityConfig.color)}>
                  {priorityConfig.icon}
                </span>
                <h2 className="text-lg font-semibold">{ticket.subject}</h2>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={categoryConfig.color}>
                  {categoryConfig.label}
                </Badge>
                <Badge variant="outline" className={statusConfig.color}>
                  {statusConfig.label}
                </Badge>
                {/* Show Garantia badge if linked to claim, otherwise Contrato/Análise if linked */}
                {ticket.claim_id ? (
                  <Badge 
                    variant="secondary" 
                    className="bg-amber-100 text-amber-700 cursor-pointer hover:bg-amber-200"
                    onClick={() => navigate(`/claims/${ticket.claim_id}`)}
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    Garantia
                  </Badge>
                ) : ticket.contract_id ? (
                  <Badge 
                    variant="secondary" 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => navigate(`/contracts/${ticket.contract_id}`)}
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    Contrato
                  </Badge>
                ) : ticket.analysis_id && (
                  <Badge 
                    variant="secondary" 
                    className="cursor-pointer hover:bg-muted bg-blue-100 text-blue-700"
                    onClick={() => navigate(`/analyses/${ticket.analysis_id}`)}
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    Análise
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  Criado {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: ptBR })}
                </span>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-4">
            <Select value={ticket.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ticketStatusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={ticket.assigned_to || "unassigned"} 
              onValueChange={handleAssigneeChange}
            >
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Atribuir a..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Não atribuído</SelectItem>
                {analysts?.map((analyst) => (
                  <SelectItem key={analyst.id} value={analyst.id}>
                    {analyst.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {ticket.description && (
            <div className="mb-4 p-3 bg-muted/50 rounded-lg border">
              <p className="text-sm font-medium mb-1">Descrição do chamado:</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>
            </div>
          )}

          <div className="space-y-4">
            {messages?.map((msg) => {
              const isOwn = msg.sender_id === user?.id;
              return (
                <div
                  key={msg.id}
                  className={cn("flex gap-3", isOwn && "flex-row-reverse")}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={msg.sender?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {msg.sender?.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn("max-w-[70%]", isOwn && "text-right")}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium">{msg.sender?.full_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(msg.created_at), "HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "p-3 rounded-lg text-sm whitespace-pre-wrap",
                        isOwn
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      {msg.message}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Typing indicator */}
          {otherTypingUsers.length > 0 && (
            <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground animate-pulse">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
              </div>
              <span>
                {otherTypingUsers.map(t => t.user?.full_name).join(", ")} está digitando...
              </span>
            </div>
          )}
        </ScrollArea>

        {/* Input area */}
        <div className="p-4 border-t bg-card">
          <div className="flex items-center gap-2 mb-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Zap className="h-4 w-4" />
                  Respostas Rápidas
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-2" align="start">
                <div className="space-y-1 max-h-64 overflow-auto">
                  {quickReplies?.length === 0 && (
                    <p className="text-sm text-muted-foreground p-2">
                      Nenhuma resposta rápida disponível
                    </p>
                  )}
                  {quickReplies?.map((reply) => (
                    <button
                      key={reply.id}
                      onClick={() => handleQuickReply(reply.content)}
                      className="w-full text-left p-2 rounded hover:bg-muted transition-colors"
                    >
                      <p className="text-sm font-medium">{reply.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {reply.content}
                      </p>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex gap-2">
            <Textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                handleTyping();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Digite sua resposta..."
              className="min-h-[80px] resize-none"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || sendMessage.isPending}
              className="self-end"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Agency sidebar */}
      <div className="w-72 border-l bg-muted/30 p-4 overflow-auto">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Dados da Imobiliária
        </h3>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium">
              {ticket.agency?.nome_fantasia || ticket.agency?.razao_social}
            </p>
            <p className="text-xs text-muted-foreground">
              {ticket.agency?.razao_social}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{ticket.agency?.responsavel_nome}</span>
            </div>
            {ticket.agency?.responsavel_email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{ticket.agency.responsavel_email}</span>
              </div>
            )}
            {ticket.agency?.responsavel_telefone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{ticket.agency.responsavel_telefone}</span>
              </div>
            )}
          </div>

          {agencyStats && (
            <>
              <div className="h-px bg-border" />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    Contratos Ativos
                  </div>
                  <span className="font-semibold">{agencyStats.activeContracts}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    Comissões Pagas
                  </div>
                  <span className="font-semibold">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(agencyStats.totalCommissions)}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Ticket metrics */}
          <div className="h-px bg-border" />
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-muted-foreground uppercase">
              Métricas do Ticket
            </h4>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tempo de espera</span>
              <span className="font-medium">
                {formatDistanceToNow(new Date(ticket.created_at), { locale: ptBR })}
              </span>
            </div>
            {ticket.first_response_at && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">1ª Resposta</span>
                <span className="font-medium">
                  {formatDistanceToNow(
                    new Date(ticket.first_response_at).getTime() - new Date(ticket.created_at).getTime(),
                    { locale: ptBR }
                  )}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
