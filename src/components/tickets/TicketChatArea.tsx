import { useState, useRef } from "react";
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
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ticketStatusConfig, TicketStatus } from "@/types/tickets";
import { TicketAgencyHeader } from "./TicketAgencyHeader";
import { TicketChatMessages } from "./TicketChatMessages";
import { TicketChatInput } from "./TicketChatInput";
import { MessageSquare } from "lucide-react";

interface TicketChatAreaProps {
  ticketId: string | null;
  onClose: () => void;
}

export function TicketChatArea({ ticketId, onClose }: TicketChatAreaProps) {
  const { user } = useAuth();
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const { data: ticket, isLoading: ticketLoading } = useTicket(ticketId || undefined);
  const { data: messages = [], isLoading: messagesLoading } = useTicketMessages(ticketId || undefined);
  const { data: typingIndicators } = useTypingIndicators(ticketId || undefined);
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

  const handleSendMessage = async (message: string) => {
    if (!ticketId || !ticket) return;

    await sendMessage.mutateAsync({ ticketId, message });
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
    if (!ticketId) return;
    const updates: any = { status };
    if (status === 'resolvido') {
      updates.resolved_at = new Date().toISOString();
    }
    updateTicket.mutate({ ticketId, updates });
  };

  const handleAssigneeChange = (assigneeId: string) => {
    if (!ticketId) return;
    updateTicket.mutate({ 
      ticketId, 
      updates: { 
        assigned_to: assigneeId === 'unassigned' ? null : assigneeId 
      } 
    });
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
      {/* Agency Header */}
      <TicketAgencyHeader
        ticket={ticket}
        agencyStats={agencyStats}
        onClose={onClose}
      />

      {/* Status and Assignee Actions */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/30">
        <Select value={ticket.status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[160px] h-9">
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
          <SelectTrigger className="w-[160px] h-9">
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
