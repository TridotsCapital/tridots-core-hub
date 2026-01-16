import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface RenewalNotification {
  id: string;
  contract_id: string;
  renewal_id: string | null;
  channel: 'email' | 'whatsapp' | 'both';
  sent_by: string;
  sent_at: string;
  recipient_name: string | null;
  recipient_email: string | null;
  recipient_phone: string | null;
  message_preview: string | null;
  status: 'sent' | 'delivered' | 'failed' | 'clicked';
  metadata: Record<string, any>;
  created_at: string;
}

export const useRenewalNotifications = (contractId: string | null) => {
  return useQuery({
    queryKey: ['renewal-notifications', contractId],
    queryFn: async (): Promise<RenewalNotification[]> => {
      if (!contractId) return [];

      const { data, error } = await supabase
        .from('renewal_notifications')
        .select('*')
        .eq('contract_id', contractId)
        .order('sent_at', { ascending: false });

      if (error) throw error;
      return (data || []) as RenewalNotification[];
    },
    enabled: !!contractId
  });
};

export const useCreateRenewalNotification = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      contract_id: string;
      renewal_id?: string;
      channel: 'email' | 'whatsapp' | 'both';
      recipient_name: string;
      recipient_email?: string;
      recipient_phone?: string;
      message_preview: string;
    }) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data: notification, error } = await supabase
        .from('renewal_notifications')
        .insert({
          contract_id: data.contract_id,
          renewal_id: data.renewal_id || null,
          channel: data.channel,
          sent_by: user.id,
          recipient_name: data.recipient_name,
          recipient_email: data.recipient_email,
          recipient_phone: data.recipient_phone,
          message_preview: data.message_preview,
          status: 'sent'
        })
        .select()
        .single();

      if (error) throw error;
      return notification;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['renewal-notifications', variables.contract_id] });
    },
    onError: (error) => {
      console.error('Error creating renewal notification:', error);
    }
  });
};
