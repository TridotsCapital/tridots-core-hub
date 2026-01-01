import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { 
  Claim, 
  ClaimPublicStatus, 
  ClaimInternalStatus,
  CreateClaimInput,
  UpdateClaimStatusInput 
} from '@/types/claims';

// =====================================================
// QUERIES
// =====================================================

export function useClaims(filters?: {
  agencyId?: string;
  analysisId?: string;
  publicStatus?: ClaimPublicStatus;
  internalStatus?: ClaimInternalStatus;
}) {
  return useQuery({
    queryKey: ['claims', filters],
    queryFn: async () => {
      let query = supabase
        .from('claims')
        .select(`
          *,
          analysis:analyses(
            inquilino_nome,
            inquilino_cpf,
            imovel_endereco,
            imovel_cidade,
            imovel_estado,
            valor_aluguel
          ),
          agency:agencies(
            nome_fantasia,
            razao_social
          ),
          creator:profiles!claims_created_by_fkey(
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (filters?.agencyId) {
        query = query.eq('agency_id', filters.agencyId);
      }
      if (filters?.analysisId) {
        query = query.eq('analysis_id', filters.analysisId);
      }
      if (filters?.publicStatus) {
        query = query.eq('public_status', filters.publicStatus);
      }
      if (filters?.internalStatus) {
        query = query.eq('internal_status', filters.internalStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Claim[];
    },
  });
}

export function useClaimDetail(claimId: string | undefined) {
  return useQuery({
    queryKey: ['claims', claimId],
    queryFn: async () => {
      if (!claimId) return null;
      
      const { data, error } = await supabase
        .from('claims')
        .select(`
          *,
          analysis:analyses(
            inquilino_nome,
            inquilino_cpf,
            imovel_endereco,
            imovel_cidade,
            imovel_estado,
            valor_aluguel
          ),
          agency:agencies(
            nome_fantasia,
            razao_social
          ),
          creator:profiles!claims_created_by_fkey(
            full_name,
            email
          )
        `)
        .eq('id', claimId)
        .maybeSingle();
      
      if (error) throw error;
      return data as Claim | null;
    },
    enabled: !!claimId,
  });
}

// Hook para buscar sinistros de um contrato específico (para timeline)
export function useClaimsByAnalysis(analysisId: string | undefined) {
  return useQuery({
    queryKey: ['claims', 'by-analysis', analysisId],
    queryFn: async () => {
      if (!analysisId) return [];
      
      const { data, error } = await supabase
        .from('claims')
        .select(`
          id,
          public_status,
          internal_status,
          total_claimed_value,
          created_at,
          updated_at,
          creator:profiles!claims_created_by_fkey(full_name)
        `)
        .eq('analysis_id', analysisId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!analysisId,
  });
}

// =====================================================
// MUTATIONS
// =====================================================

export function useCreateClaim() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateClaimInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('claims')
        .insert({
          analysis_id: input.analysis_id,
          agency_id: input.agency_id,
          created_by: user.id,
          observations: input.observations || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      toast({
        title: 'Sinistro criado',
        description: 'O sinistro foi criado com sucesso. Adicione os itens e arquivos.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar sinistro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateClaimStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: UpdateClaimStatusInput) => {
      const updates: Record<string, unknown> = {};
      
      if (input.public_status) {
        updates.public_status = input.public_status;
      }
      if (input.internal_status) {
        updates.internal_status = input.internal_status;
      }
      if (input.observations !== undefined) {
        updates.observations = input.observations;
      }

      const { data, error } = await supabase
        .from('claims')
        .update(updates)
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      toast({
        title: 'Status atualizado',
        description: 'O status do sinistro foi atualizado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useCancelClaim() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (claimId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('claims')
        .update({
          canceled_at: new Date().toISOString(),
          canceled_by: user.id,
        })
        .eq('id', claimId)
        .eq('public_status', 'solicitado') // Só pode cancelar em 'solicitado'
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      toast({
        title: 'Sinistro cancelado',
        description: 'O sinistro foi cancelado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao cancelar sinistro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteClaim() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (claimId: string) => {
      const { error } = await supabase
        .from('claims')
        .delete()
        .eq('id', claimId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      toast({
        title: 'Sinistro excluído',
        description: 'O sinistro foi excluído permanentemente.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao excluir sinistro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
