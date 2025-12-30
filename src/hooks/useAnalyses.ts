import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Analysis, AnalysisStatus } from '@/types/database';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';

export function useAnalyses(filters?: { status?: AnalysisStatus; agency_id?: string }) {
  return useQuery({
    queryKey: ['analyses', filters],
    queryFn: async () => {
      let query = supabase
        .from('analyses')
        .select(`*, agency:agencies(*)`)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.agency_id) {
        query = query.eq('agency_id', filters.agency_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Analysis[];
    },
  });
}

export function useAnalysis(id: string | undefined) {
  return useQuery({
    queryKey: ['analysis', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('analyses')
        .select(`*, agency:agencies(*)`)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Analysis | null;
    },
    enabled: !!id,
  });
}

export function useCreateAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TablesInsert<'analyses'>) => {
      const { data: result, error } = await supabase
        .from('analyses')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analyses'] });
      toast.success('Análise criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar análise: ' + error.message);
    },
  });
}

export function useUpdateAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & TablesUpdate<'analyses'>) => {
      const { data: result, error } = await supabase
        .from('analyses')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['analyses'] });
      queryClient.invalidateQueries({ queryKey: ['analysis', variables.id] });
      toast.success('Análise atualizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar análise: ' + error.message);
    },
  });
}

export function useUpdateAnalysisStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AnalysisStatus }) => {
      const updates: TablesUpdate<'analyses'> = { status };
      
      // Set timestamp based on status
      if (status === 'aprovada') updates.approved_at = new Date().toISOString();
      if (status === 'reprovada') updates.rejected_at = new Date().toISOString();
      if (status === 'cancelada') updates.canceled_at = new Date().toISOString();

      const { data: result, error } = await supabase
        .from('analyses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['analyses'] });
      queryClient.invalidateQueries({ queryKey: ['analysis', variables.id] });
      toast.success('Status atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar status: ' + error.message);
    },
  });
}
