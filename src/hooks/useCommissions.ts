import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Commission, CommissionStatus } from '@/types/database';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';

export function useCommissions(filters?: { status?: CommissionStatus; agency_id?: string }) {
  return useQuery({
    queryKey: ['commissions', filters],
    queryFn: async () => {
      let query = supabase
        .from('commissions')
        .select(`
          *,
          analysis:analyses(*),
          agency:agencies(*)
        `)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.agency_id) {
        query = query.eq('agency_id', filters.agency_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Commission[];
    },
  });
}

export function useCreateCommission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TablesInsert<'commissions'>) => {
      const { data: result, error } = await supabase
        .from('commissions')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      toast.success('Comissão registrada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao registrar comissão: ' + error.message);
    },
  });
}

export function useUpdateCommissionStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CommissionStatus }) => {
      const updates: TablesUpdate<'commissions'> = { status };
      
      if (status === 'paga') {
        updates.data_pagamento = new Date().toISOString();
      }
      if (status === 'estornada') {
        updates.data_estorno = new Date().toISOString();
      }

      const { data: result, error } = await supabase
        .from('commissions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      toast.success('Status da comissão atualizado!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar comissão: ' + error.message);
    },
  });
}
