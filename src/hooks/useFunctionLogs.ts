import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FunctionLog {
  id: string;
  function_name: string;
  level: string;
  message: string;
  duration_ms: number | null;
  error_details: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface FunctionLogSummary {
  function_name: string;
  total: number;
  errors: number;
  warnings: number;
  avgDuration: number;
}

export function useFunctionLogs(limit = 50) {
  return useQuery({
    queryKey: ['function-logs', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('function_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as unknown as FunctionLog[];
    },
    staleTime: 30_000,
  });
}

export function useFunctionLogsSummary() {
  return useQuery({
    queryKey: ['function-logs-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('function_logs')
        .select('function_name, level, duration_ms')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      const logs = (data || []) as unknown as Pick<FunctionLog, 'function_name' | 'level' | 'duration_ms'>[];

      const summaryMap = new Map<string, FunctionLogSummary>();
      logs.forEach((log) => {
        const entry = summaryMap.get(log.function_name) || {
          function_name: log.function_name,
          total: 0,
          errors: 0,
          warnings: 0,
          avgDuration: 0,
        };
        entry.total += 1;
        if (log.level === 'error') entry.errors += 1;
        if (log.level === 'warn') entry.warnings += 1;
        if (log.duration_ms) entry.avgDuration += log.duration_ms;
        summaryMap.set(log.function_name, entry);
      });

      return Array.from(summaryMap.values())
        .map((s) => ({
          ...s,
          avgDuration: s.total > 0 ? Math.round(s.avgDuration / s.total) : 0,
        }))
        .sort((a, b) => b.errors - a.errors || b.total - a.total);
    },
    staleTime: 30_000,
  });
}
