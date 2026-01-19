import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Agency } from '@/types/database';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';

export function useAgencies(activeOnly = true) {
  return useQuery({
    queryKey: ['agencies', activeOnly],
    queryFn: async () => {
      let query = supabase
        .from('agencies')
        .select('*')
        .order('razao_social', { ascending: true });

      if (activeOnly) {
        query = query.eq('active', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Agency[];
    },
  });
}

export function useAgency(id: string | undefined) {
  return useQuery({
    queryKey: ['agency', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('agencies')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Agency | null;
    },
    enabled: !!id,
  });
}

export function useCreateAgency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TablesInsert<'agencies'>) => {
      const { data: result, error } = await supabase
        .from('agencies')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencies'] });
      toast.success('Imobiliária cadastrada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao cadastrar imobiliária: ' + error.message);
    },
  });
}

export function useUpdateAgency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & TablesUpdate<'agencies'>) => {
      const { data: result, error } = await supabase
        .from('agencies')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agencies'] });
      queryClient.invalidateQueries({ queryKey: ['agency', variables.id] });
      toast.success('Imobiliária atualizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar imobiliária: ' + error.message);
    },
  });
}

export function useDeleteAgency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // First, delete related agency_users records
      const { error: agencyUsersError } = await supabase
        .from('agency_users')
        .delete()
        .eq('agency_id', id);

      if (agencyUsersError) throw agencyUsersError;

      // Delete agency_documents
      const { error: docsError } = await supabase
        .from('agency_documents')
        .delete()
        .eq('agency_id', id);

      if (docsError) throw docsError;

      // Finally, delete the agency
      const { error } = await supabase
        .from('agencies')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencies'] });
      toast.success('Imobiliária excluída com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao excluir imobiliária: ' + error.message);
    },
  });
}
