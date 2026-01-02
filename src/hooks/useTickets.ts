import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Ticket, TicketMessage, TicketNotification, QuickReply, TypingIndicator, TicketStatus, TicketCategory, TicketPriority } from "@/types/tickets";
import { useEffect } from "react";

interface CreateTicketData {
  agency_id: string;
  analysis_id?: string;
  claim_id?: string;
  subject: string;
  description?: string;
  category: TicketCategory;
  priority?: TicketPriority;
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateTicketData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: ticket, error } = await supabase
        .from("tickets")
        .insert({
          agency_id: data.agency_id,
          analysis_id: data.analysis_id || null,
          claim_id: data.claim_id || null,
          created_by: user.id,
          subject: data.subject,
          description: data.description,
          category: data.category,
          priority: data.priority || "media",
          status: "aberto",
        })
        .select()
        .single();

      if (error) throw error;
      return ticket;
    },
    onSuccess: (ticket) => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["agency-tickets"] });
      toast({
        title: "Chamado aberto com sucesso",
        description: `Protocolo: #${ticket.id.slice(0, 8).toUpperCase()}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao abrir chamado",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useAgencyTickets(agencyId: string | undefined) {
  return useQuery({
    queryKey: ["agency-tickets", agencyId],
    queryFn: async () => {
      if (!agencyId) return [];

      const { data, error } = await supabase
        .from("tickets")
        .select(`
          *,
          created_by_profile:profiles!tickets_created_by_fkey(full_name, email),
          assigned_to_profile:profiles!tickets_assigned_to_fkey(full_name, email),
          analysis:analyses(id, inquilino_nome, imovel_endereco, status)
        `)
        .eq("agency_id", agencyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!agencyId,
  });
}

interface TicketFilters {
  status?: TicketStatus;
  category?: TicketCategory;
  priority?: TicketPriority;
  agency_id?: string;
  assigned_to?: string;
}

export function useTickets(filters?: TicketFilters) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["tickets", filters],
    queryFn: async () => {
      let q = supabase
        .from("tickets")
        .select(`
          *,
          agency:agencies(id, nome_fantasia, razao_social, responsavel_nome, responsavel_email, responsavel_telefone),
          creator:profiles!tickets_created_by_fkey(id, full_name, email, avatar_url),
          assignee:profiles!tickets_assigned_to_fkey(id, full_name, email, avatar_url),
          analysis:analyses(id, inquilino_nome, imovel_endereco, status)
        `)
        .order("created_at", { ascending: false });

      if (filters?.status && filters.status !== 'all' as any) {
        q = q.eq("status", filters.status);
      }
      if (filters?.category && filters.category !== 'all' as any) {
        q = q.eq("category", filters.category);
      }
      if (filters?.priority && filters.priority !== 'all' as any) {
        q = q.eq("priority", filters.priority);
      }
      if (filters?.agency_id && filters.agency_id !== 'all') {
        q = q.eq("agency_id", filters.agency_id);
      }
      if (filters?.assigned_to && filters.assigned_to !== 'all') {
        q = q.eq("assigned_to", filters.assigned_to);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as Ticket[];
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("tickets-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["tickets"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

export function useTicket(ticketId: string | undefined) {
  return useQuery({
    queryKey: ["ticket", ticketId],
    queryFn: async () => {
      if (!ticketId) return null;
      const { data, error } = await supabase
        .from("tickets")
        .select(`
          *,
          agency:agencies(id, nome_fantasia, razao_social, responsavel_nome, responsavel_email, responsavel_telefone),
          creator:profiles!tickets_created_by_fkey(id, full_name, email, avatar_url),
          assignee:profiles!tickets_assigned_to_fkey(id, full_name, email, avatar_url),
          analysis:analyses(id, inquilino_nome, imovel_endereco, status)
        `)
        .eq("id", ticketId)
        .single();
      if (error) throw error;
      return data as Ticket;
    },
    enabled: !!ticketId,
  });
}

interface UseTicketMessagesOptions {
  onNewMessage?: (senderId: string) => void;
}

export function useTicketMessages(ticketId: string | undefined, options?: UseTicketMessagesOptions) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["ticket-messages", ticketId],
    queryFn: async () => {
      if (!ticketId) return [];
      const { data, error } = await supabase
        .from("ticket_messages")
        .select(`
          *,
          sender:profiles(id, full_name, email, avatar_url)
        `)
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as TicketMessage[];
    },
    enabled: !!ticketId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!ticketId) return;

    const channel = supabase
      .channel(`ticket-messages-${ticketId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ticket_messages", filter: `ticket_id=eq.${ticketId}` },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["ticket-messages", ticketId] });
          // Trigger callback with sender ID
          if (payload.new && options?.onNewMessage) {
            options.onNewMessage((payload.new as any).sender_id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, queryClient, options?.onNewMessage]);

  return query;
}

export function useSendTicketMessage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ ticketId, message, attachmentsUrl }: { ticketId: string; message: string; attachmentsUrl?: string[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("ticket_messages")
        .insert({
          ticket_id: ticketId,
          sender_id: user.id,
          message,
          attachments_url: attachmentsUrl || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ["ticket-messages", ticketId] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao enviar mensagem",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateTicket() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ ticketId, updates }: { ticketId: string; updates: Partial<Ticket> }) => {
      const { data, error } = await supabase
        .from("tickets")
        .update(updates)
        .eq("id", ticketId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
      toast({
        title: "Ticket atualizado",
        description: "As alterações foram salvas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar ticket",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useTicketNotifications() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["ticket-notifications"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("ticket_notifications")
        .select("*")
        .eq("user_id", user.id)
        .is("read_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as TicketNotification[];
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("ticket-notifications-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ticket_notifications" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["ticket-notifications"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("ticket_notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-notifications"] });
    },
  });
}

export function useQuickReplies(category?: TicketCategory) {
  return useQuery({
    queryKey: ["quick-replies", category],
    queryFn: async () => {
      let q = supabase
        .from("ticket_quick_replies")
        .select("*")
        .order("usage_count", { ascending: false });

      if (category) {
        q = q.or(`category.eq.${category},category.is.null`);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as QuickReply[];
    },
  });
}

export function useCreateQuickReply() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (reply: { title: string; content: string; category?: TicketCategory }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("ticket_quick_replies")
        .insert({
          ...reply,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quick-replies"] });
      toast({
        title: "Resposta rápida criada",
        description: "O template foi salvo com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar resposta rápida",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useTypingIndicators(ticketId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["typing-indicators", ticketId],
    queryFn: async () => {
      if (!ticketId) return [];
      const { data, error } = await supabase
        .from("ticket_typing_indicators")
        .select(`
          *,
          user:profiles(id, full_name)
        `)
        .eq("ticket_id", ticketId);

      if (error) throw error;
      return data as TypingIndicator[];
    },
    enabled: !!ticketId,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Realtime subscription
  useEffect(() => {
    if (!ticketId) return;

    const channel = supabase
      .channel(`typing-${ticketId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ticket_typing_indicators", filter: `ticket_id=eq.${ticketId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["typing-indicators", ticketId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, queryClient]);

  return query;
}

// Hook to count tickets for a specific analysis/contract
export function useTicketCountByAnalysis(analysisId: string | undefined) {
  return useQuery({
    queryKey: ["ticket-count-by-analysis", analysisId],
    queryFn: async () => {
      if (!analysisId) return 0;
      const { count, error } = await supabase
        .from("tickets")
        .select("*", { count: "exact", head: true })
        .eq("analysis_id", analysisId);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!analysisId,
  });
}

// Hook to fetch tickets for a specific analysis/contract (for timeline)
export function useTicketsByAnalysis(analysisId: string | undefined) {
  return useQuery({
    queryKey: ["tickets-by-analysis", analysisId],
    queryFn: async () => {
      if (!analysisId) return [];
      const { data, error } = await supabase
        .from("tickets")
        .select("id, subject, status, created_at, resolved_at")
        .eq("analysis_id", analysisId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!analysisId,
  });
}

// Hook to fetch tickets for a specific claim
export function useTicketsByClaimId(claimId: string | undefined) {
  return useQuery({
    queryKey: ["tickets-by-claim", claimId],
    queryFn: async () => {
      if (!claimId) return [];
      const { data, error } = await supabase
        .from("tickets")
        .select(`
          id, 
          subject, 
          status, 
          priority,
          category,
          created_at, 
          resolved_at,
          agency:agencies(id, nome_fantasia, razao_social)
        `)
        .eq("claim_id", claimId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!claimId,
  });
}

export function useSetTypingIndicator() {
  return useMutation({
    mutationFn: async ({ ticketId, isTyping }: { ticketId: string; isTyping: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (isTyping) {
        await supabase
          .from("ticket_typing_indicators")
          .upsert({
            ticket_id: ticketId,
            user_id: user.id,
            started_at: new Date().toISOString(),
          }, { onConflict: 'ticket_id,user_id' });
      } else {
        await supabase
          .from("ticket_typing_indicators")
          .delete()
          .eq("ticket_id", ticketId)
          .eq("user_id", user.id);
      }
    },
  });
}

export function useAgencyStats(agencyId: string | undefined) {
  return useQuery({
    queryKey: ["agency-stats", agencyId],
    queryFn: async () => {
      if (!agencyId) return null;

      // Get active analyses count
      const { data: analyses, error: analysesError } = await supabase
        .from("analyses")
        .select("id", { count: "exact" })
        .eq("agency_id", agencyId)
        .eq("status", "ativo");

      if (analysesError) throw analysesError;

      // Get total commissions
      const { data: commissions, error: commissionsError } = await supabase
        .from("commissions")
        .select("valor")
        .eq("agency_id", agencyId)
        .eq("status", "paga");

      if (commissionsError) throw commissionsError;

      const totalCommissions = commissions?.reduce((acc, c) => acc + Number(c.valor), 0) || 0;

      return {
        activeContracts: analyses?.length || 0,
        totalCommissions,
      };
    },
    enabled: !!agencyId,
  });
}
