import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Analysis, AnalysisStatus } from '@/types/database';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';

export function useAnalyses(filters?: { status?: AnalysisStatus; agency_id?: string; analyst_id?: string }) {
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
      if (filters?.analyst_id) {
        query = query.eq('analyst_id', filters.analyst_id);
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

export function useDeleteAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (analysisId: string) => {
      // 1. Check if a contract is linked (cannot delete if contract exists)
      const { data: contract } = await supabase
        .from('contracts')
        .select('id')
        .eq('analysis_id', analysisId)
        .maybeSingle();

      if (contract) {
        throw new Error('Não é possível excluir uma análise que já possui contrato vinculado.');
      }

      // 2. Get documents to clean storage
      const { data: docs } = await supabase
        .from('analysis_documents')
        .select('file_path')
        .eq('analysis_id', analysisId);

      // 3. Delete storage files
      if (docs && docs.length > 0) {
        const paths = docs.map(d => d.file_path);
        await supabase.storage.from('analysis-documents').remove(paths);
      }

      // 4. Get tickets to delete their messages first
      const { data: tickets } = await supabase
        .from('tickets')
        .select('id')
        .eq('analysis_id', analysisId);

      if (tickets && tickets.length > 0) {
        const ticketIds = tickets.map(t => t.id);
        // Delete ticket messages
        for (const ticketId of ticketIds) {
          await supabase.from('ticket_messages').delete().eq('ticket_id', ticketId);
        }
        // Delete ticket notifications
        for (const ticketId of ticketIds) {
          await supabase.from('ticket_notifications').delete().eq('ticket_id', ticketId);
        }
        // Delete tickets
        await supabase.from('tickets').delete().eq('analysis_id', analysisId);
      }

      // 5. Delete child records in order
      await supabase.from('analysis_documents').delete().eq('analysis_id', analysisId);
      await supabase.from('analysis_timeline').delete().eq('analysis_id', analysisId);
      await supabase.from('commissions').delete().eq('analysis_id', analysisId);
      await supabase.from('digital_acceptances').delete().eq('analysis_id', analysisId);
      await supabase.from('internal_notes').delete().eq('reference_id', analysisId);

      // 6. Delete the analysis itself
      const { error } = await supabase
        .from('analyses')
        .delete()
        .eq('id', analysisId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analyses'] });
      queryClient.invalidateQueries({ queryKey: ['analyses-kanban'] });
      toast.success('Análise excluída com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao excluir análise');
    },
  });
}
