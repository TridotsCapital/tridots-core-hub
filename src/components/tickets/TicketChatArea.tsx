import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { 
  useTicket, 
  useTicketMessages, 
  useSendTicketMessage, 
  useUpdateTicket, 
  useTypingIndicators, 
  useSetTypingIndicator, 
  useQuickReplies, 
  useAgencyStats 
} from "@/hooks/useTickets";
import { useNotificationSound } from "@/hooks/useNotificationSound";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ticketStatusConfig, ticketCategoryConfig, ticketPriorityConfig, TicketStatus } from "@/types/tickets";
import { TicketChatMessages } from "./TicketChatMessages";
import { TicketChatInput } from "./TicketChatInput";
import { MessageSquare, X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface TicketChatAreaProps {
  ticketId: string | null;
  onClose: () => void;
}

export function TicketChatArea({ ticketId, onClose }: TicketChatAreaProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const { playSound } = useNotificationSound();

  // Play sound when new message arrives from someone else
  const handleNewMessage = useCallback((senderId: string) => {
    if (senderId !== user?.id) {
      playSound();
    }
  }, [user?.id, playSound]);

  const { data: ticket, isLoading: ticketLoading } = useTicket(ticketId || undefined);
  const { data: messages = [], isLoading: messagesLoading } = useTicketMessages(ticketId || undefined, {
    onNewMessage: handleNewMessage,
  });
  const { data: typingIndicators } = useTypingIndicators(ticketId || undefined);
  const { data: quickReplies } = useQuickReplies(ticket?.category);
  const { data: agencyStats } = useAgencyStats(ticket?.agency_id);

  const sendMessage = useSendTicketMessage();
  const updateTicket = useUpdateTicket();
  const setTypingIndicator = useSetTypingIndicator();


  // Handle typing indicator
  const handleTyping = () => {
    if (!ticketId) return;
    
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

  const handleSendMessage = async (message: string, attachments?: string[]) => {
    if (!ticketId || !ticket) return;

    await sendMessage.mutateAsync({ ticketId, message, attachmentsUrl: attachments });
    setIsTyping(false);
    setTypingIndicator.mutate({ ticketId, isTyping: false });

    // If ticket is open, move to em_atendimento
    if (ticket.status === 'aberto') {
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
    if (!ticketId || !user) return;
    const updates: any = { status };
    if (status === 'resolvido') {
      updates.resolved_at = new Date().toISOString();
      updates.closed_by = user.id;
      updates.closed_by_type = 'internal';
    }
    updateTicket.mutate({ ticketId, updates });
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
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Ticket não encontrado</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      {/* Compact Header with integrated actions */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-card">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className={cn("text-lg", ticketPriorityConfig[ticket.priority].color)}>
            {ticketPriorityConfig[ticket.priority].icon}
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold truncate">{ticket.subject}</h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="truncate">{ticket.agency?.nome_fantasia || ticket.agency?.razao_social || 'Imobiliária'}</span>
              <Badge variant="outline" className={cn("text-[10px] h-5", ticketCategoryConfig[ticket.category].color)}>
                {ticketCategoryConfig[ticket.category].label}
              </Badge>
              {ticket.analysis_id && (
                <Badge 
                  variant="secondary" 
                  className="text-[10px] h-5 cursor-pointer hover:bg-secondary/80"
                  onClick={() => navigate(`/contracts/${ticket.analysis_id}`)}
                >
                  <FileText className="h-3 w-3 mr-1" />
                  Contrato
                </Badge>
              )}
              {ticket.status === 'resolvido' && ticket.closed_by_type === 'agency' && (
                <Badge 
                  variant="secondary" 
                  className="text-[10px] h-5 bg-amber-100 text-amber-700 border-amber-200"
                >
                  Encerrado pela Imobiliária
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Select value={ticket.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
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


          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <TicketChatMessages
        messages={messages}
        description={ticket.description || undefined}
        currentUserId={user?.id}
        isLoading={messagesLoading}
        typingUsers={typingIndicators}
      />

      {/* Input */}
      <TicketChatInput
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        isSending={sendMessage.isPending}
        quickReplies={quickReplies}
        ticketStatus={ticket.status}
      />
    </div>
  );
}
