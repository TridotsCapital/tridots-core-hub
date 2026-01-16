import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Commission } from '@/types/database';

export function useContractCommissions(analysisId?: string) {
  return useQuery({
    queryKey: ['commissions', 'contract', analysisId],
    queryFn: async () => {
      if (!analysisId) return [];
      
      const { data, error } = await supabase
        .from('commissions')
        .select('*')
        .eq('analysis_id', analysisId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data as Commission[];
    },
    enabled: !!analysisId,
  });
}

export function useContractCommissionsSummary(analysisId?: string) {
  return useQuery({
    queryKey: ['commissions', 'contract-summary', analysisId],
    queryFn: async () => {
      if (!analysisId) return null;
      
      const { data, error } = await supabase
        .from('commissions')
        .select('status, valor, type')
        .eq('analysis_id', analysisId);

      if (error) throw error;
      
      const summary = {
        total: 0,
        pendente: 0,
        a_pagar: 0,
        paga: 0,
        setup: 0,
        recorrente: 0,
        count: data.length,
      };
      
      data.forEach(c => {
        summary.total += c.valor;
        if (c.status === 'pendente') summary.pendente += c.valor;
        else if (c.status === 'a_pagar') summary.a_pagar += c.valor;
        else if (c.status === 'paga') summary.paga += c.valor;
        
        if (c.type === 'setup') summary.setup += c.valor;
        else if (c.type === 'recorrente') summary.recorrente += c.valor;
      });
      
      return summary;
    },
    enabled: !!analysisId,
  });
}
