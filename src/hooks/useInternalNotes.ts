import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type ReferenceType = 'analysis' | 'contract' | 'claim';

interface InternalNote {
  id: string;
  reference_type: ReferenceType;
  reference_id: string;
  content: string;
  created_by: string;
  created_at: string;
  profile?: {
    full_name: string;
    avatar_url: string | null;
  };
}

export function useInternalNotes(referenceType: ReferenceType, referenceId: string | undefined) {
  return useQuery({
    queryKey: ['internal-notes', referenceType, referenceId],
    queryFn: async () => {
      if (!referenceId) return [];
      
      const { data, error } = await supabase
        .from('internal_notes')
        .select(`
          *,
          profile:created_by (
            full_name,
            avatar_url
          )
        `)
        .eq('reference_type', referenceType)
        .eq('reference_id', referenceId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as InternalNote[];
    },
    enabled: !!referenceId,
  });
}

export function useAddInternalNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      referenceType,
      referenceId,
      content,
    }: {
      referenceType: ReferenceType;
      referenceId: string;
      content: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('internal_notes')
        .insert({
          reference_type: referenceType,
          reference_id: referenceId,
          content,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['internal-notes', variables.referenceType, variables.referenceId] 
      });
      toast.success('Nota adicionada com sucesso');
    },
    onError: (error: Error) => {
      console.error('Error adding note:', error);
      toast.error('Erro ao adicionar nota');
    },
  });
}
