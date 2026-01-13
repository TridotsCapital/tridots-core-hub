import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Analysis, AnalysisStatus } from '@/types/database';
import { toast } from 'sonner';

interface KanbanFilters {
  agency_id?: string;
  analyst_id?: string;
  dateRange?: { from: Date; to: Date };
}

export function useAnalysesKanban(filters?: KanbanFilters) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['analyses-kanban', filters],
    queryFn: async () => {
      let q = supabase
        .from('analyses')
        .select(`*, agency:agencies(*), analyst:profiles!analyses_analyst_id_fkey(id, full_name)`)
        .order('created_at', { ascending: true }); // Oldest first for urgency

      if (filters?.agency_id) {
        q = q.eq('agency_id', filters.agency_id);
      }
      if (filters?.analyst_id) {
        q = q.eq('analyst_id', filters.analyst_id);
      }
      if (filters?.dateRange?.from) {
        q = q.gte('created_at', filters.dateRange.from.toISOString());
      }
      if (filters?.dateRange?.to) {
        q = q.lte('created_at', filters.dateRange.to.toISOString());
      }

      const { data, error } = await q;
      if (error) throw error;
      // Type cast through unknown since analyst is a join that doesn't match the base type
      return data as unknown as Analysis[];
    },
  });

  // Real-time subscription for analyses updates
  useEffect(() => {
    const channel = supabase
      .channel('analyses-kanban-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'analyses',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['analyses-kanban'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

export function useMoveAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      newStatus,
      additionalData 
    }: { 
      id: string; 
      newStatus: AnalysisStatus;
      additionalData?: Record<string, unknown>;
    }) => {
      const updates: Record<string, unknown> = { 
        status: newStatus,
        ...additionalData,
      };
      
      // Set timestamp based on status
      if (newStatus === 'aprovada') updates.approved_at = new Date().toISOString();
      if (newStatus === 'reprovada') updates.rejected_at = new Date().toISOString();
      if (newStatus === 'cancelada') updates.canceled_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('analyses')
        .update(updates)
        .eq('id', id)
        .select(`*, agency:agencies(*)`)
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, newStatus }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['analyses-kanban'] });

      // Snapshot the previous value
      const previousAnalyses = queryClient.getQueryData(['analyses-kanban']);

      // Optimistically update
      queryClient.setQueryData(['analyses-kanban'], (old: Analysis[] | undefined) => {
        if (!old) return old;
        return old.map(a => a.id === id ? { ...a, status: newStatus } : a);
      });

      return { previousAnalyses };
    },
    onError: (err, _, context) => {
      // Rollback on error
      if (context?.previousAnalyses) {
        queryClient.setQueryData(['analyses-kanban'], context.previousAnalyses);
      }
      toast.error('Erro ao mover análise: ' + (err as Error).message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['analyses-kanban'] });
      queryClient.invalidateQueries({ queryKey: ['analyses'] });
    },
  });
}

export function useAssignAnalyst() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ analysisId, analystId }: { analysisId: string; analystId: string | null }) => {
      const { data, error } = await supabase
        .from('analyses')
        .update({ analyst_id: analystId })
        .eq('id', analysisId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analyses-kanban'] });
      queryClient.invalidateQueries({ queryKey: ['analyses'] });
      toast.success('Analista atribuído com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atribuir analista: ' + error.message);
    },
  });
}

// Hook to get team members for analyst assignment
export function useTeamMembers() {
  return useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          avatar_url
        `)
        .eq('active', true)
        .order('full_name');

      if (error) throw error;
      return data;
    },
  });
}
