import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { 
  ClaimItem, 
  CreateClaimItemInput, 
  UpdateClaimItemInput 
} from '@/types/claims';

// =====================================================
// QUERIES
// =====================================================

export function useClaimItems(claimId: string | undefined) {
  return useQuery({
    queryKey: ['claim-items', claimId],
    queryFn: async () => {
      if (!claimId) return [];
      
      const { data, error } = await supabase
        .from('claim_items')
        .select('*')
        .eq('claim_id', claimId)
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      return data as ClaimItem[];
    },
    enabled: !!claimId,
  });
}

// =====================================================
// MUTATIONS
// =====================================================

export function useCreateClaimItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateClaimItemInput) => {
      const { data, error } = await supabase
        .from('claim_items')
        .insert({
          claim_id: input.claim_id,
          category: input.category,
          description: input.description || null,
          reference_period: input.reference_period,
          due_date: input.due_date,
          amount: input.amount,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['claim-items', variables.claim_id] });
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      toast({
        title: 'Item adicionado',
        description: 'O item foi adicionado ao sinistro.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao adicionar item',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateClaimItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: UpdateClaimItemInput) => {
      const { id, ...updates } = input;
      
      const { data, error } = await supabase
        .from('claim_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['claim-items', data.claim_id] });
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      toast({
        title: 'Item atualizado',
        description: 'O item foi atualizado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar item',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteClaimItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ itemId, claimId }: { itemId: string; claimId: string }) => {
      const { error } = await supabase
        .from('claim_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      return { claimId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['claim-items', data.claimId] });
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      toast({
        title: 'Item removido',
        description: 'O item foi removido do sinistro.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao remover item',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
