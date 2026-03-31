import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface DeletionSummary {
  summary: Record<string, number>;
  entity_type: string;
  entity_id: string;
  tenant_name: string;
  blocked?: boolean;
  blocked_by?: { type: string; id: string; label: string };
}

export function useCascadeDelete() {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const fetchDeletionSummary = async (
    entityType: 'analysis' | 'contract' | 'claim',
    entityId: string
  ): Promise<DeletionSummary | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cascade-delete', {
        body: { entity_type: entityType, entity_id: entityId, dry_run: true },
      });

      if (error) {
        const errorMsg = (data as any)?.error || error.message;
        toast.error(errorMsg);
        return null;
      }

      return data as DeletionSummary;
    } catch (err: any) {
      toast.error(err.message || 'Erro ao verificar exclusão');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const executeDeletion = async (
    entityType: 'analysis' | 'contract' | 'claim',
    entityId: string
  ): Promise<{ success: boolean; errorMessage?: string }> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cascade-delete', {
        body: { entity_type: entityType, entity_id: entityId, dry_run: false },
      });

      if (error) {
        const errorMsg = (data as any)?.error || error.message;
        toast.error(errorMsg);
        return { success: false, errorMessage: errorMsg };
      }

      if (data?.error) {
        toast.error(data.error);
        return { success: false, errorMessage: data.error };
      }

      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['analyses'] });
      queryClient.invalidateQueries({ queryKey: ['analyses-kanban'] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      queryClient.invalidateQueries({ queryKey: ['agency-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });

      toast.success('Exclusão realizada com sucesso!');
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Erro ao executar exclusão');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { fetchDeletionSummary, executeDeletion, isLoading };
}
