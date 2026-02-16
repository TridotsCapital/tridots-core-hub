import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ChatMessage } from '@/types/database';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface UseChatOptions {
  onNewMessage?: (senderId: string) => void;
}

export function useChat(analysisId: string | undefined, options?: UseChatOptions) {
  const queryClient = useQueryClient();

  // Fetch messages
  const query = useQuery({
    queryKey: ['chat', analysisId],
    queryFn: async () => {
      if (!analysisId) return [];
      
      const { data, error } = await supabase
        .from('internal_chat')
        .select('*')
        .eq('analysis_id', analysisId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as ChatMessage[];
    },
    enabled: !!analysisId,
  });

  // Real-time subscription
  useEffect(() => {
    if (!analysisId) return;

    const channel = supabase
      .channel(`chat-${analysisId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'internal_chat',
          filter: `analysis_id=eq.${analysisId}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['chat', analysisId] });
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
  }, [analysisId, queryClient, options?.onNewMessage]);

  return query;
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ analysisId, message, attachment }: {
      analysisId: string;
      message: string;
      attachment?: File;
    }) => {
      let attachmentUrl: string | null = null;
      let attachmentName: string | null = null;
      let attachmentSize: number | null = null;

      // Upload attachment if provided
      if (attachment) {
        const { buildStoragePath } = await import('@/lib/utils');
        const filePath = `${analysisId}/${buildStoragePath(attachment.name)}`;
        const { error: uploadError } = await supabase.storage
          .from('chat-attachments')
          .upload(filePath, attachment);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('chat-attachments')
          .getPublicUrl(filePath);

        attachmentUrl = publicUrl;
        attachmentName = attachment.name;
        attachmentSize = attachment.size;
      }

      const { data, error } = await supabase
        .from('internal_chat')
        .insert({
          analysis_id: analysisId,
          sender_id: user?.id,
          message,
          attachment_url: attachmentUrl,
          attachment_name: attachmentName,
          attachment_size: attachmentSize,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat', variables.analysisId] });
    },
    onError: (error: Error) => {
      toast.error('Erro ao enviar mensagem: ' + error.message);
    },
  });
}
