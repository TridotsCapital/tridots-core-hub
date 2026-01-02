import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ClaimNote {
  id: string;
  claim_id: string;
  created_by: string;
  note_type: string;
  content: string;
  created_at: string;
  creator?: {
    full_name: string;
  };
}

export const noteTypeLabels: Record<string, string> = {
  observacao: 'Observação',
  ligacao: 'Ligação',
  email: 'E-mail Enviado',
  carta: 'Carta/Correspondência',
  visita: 'Visita',
  acordo: 'Proposta de Acordo',
  cobranca: 'Ação de Cobrança',
  outro: 'Outro',
};

export function useClaimNotes(claimId: string | undefined) {
  return useQuery({
    queryKey: ['claim-notes', claimId],
    queryFn: async () => {
      if (!claimId) return [];
      
      const { data, error } = await supabase
        .from('claim_notes')
        .select(`
          *,
          creator:profiles!claim_notes_created_by_fkey(full_name)
        `)
        .eq('claim_id', claimId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ClaimNote[];
    },
    enabled: !!claimId,
  });
}

export function useCreateClaimNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: { 
      claim_id: string; 
      note_type: string; 
      content: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('claim_notes')
        .insert({
          claim_id: input.claim_id,
          created_by: user.id,
          note_type: input.note_type,
          content: input.content,
        })
        .select(`
          *,
          creator:profiles!claim_notes_created_by_fkey(full_name)
        `)
        .single();

      if (error) throw error;
      return data as ClaimNote;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['claim-notes', variables.claim_id] });
      toast({
        title: 'Nota adicionada',
        description: 'A nota foi registrada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao adicionar nota',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteClaimNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ noteId, claimId }: { noteId: string; claimId: string }) => {
      const { error } = await supabase
        .from('claim_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
      return claimId;
    },
    onSuccess: (claimId) => {
      queryClient.invalidateQueries({ queryKey: ['claim-notes', claimId] });
      toast({
        title: 'Nota excluída',
        description: 'A nota foi removida com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao excluir nota',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
