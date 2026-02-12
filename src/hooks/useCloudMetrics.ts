import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CloudMetrics {
  dbQueries: { date: string; count: number }[];
  edgeFunctions: { name: string; executions: number; avgDuration: number }[];
  storageUsage: { bucket: string; size: number; fileCount: number }[];
  totals: {
    totalQueries24h: number;
    totalQueries7d: number;
    totalEdgeFunctionCalls: number;
    avgEdgeFunctionDuration: number;
    totalStorageMB: number;
    totalFiles: number;
  };
}

async function fetchEdgeFunctionStats(): Promise<CloudMetrics['edgeFunctions']> {
  // Query audit_logs for edge function calls as a proxy
  const { data, error } = await supabase
    .from('audit_logs')
    .select('action, created_at')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error || !data) return [];

  const funcMap = new Map<string, { executions: number; totalTime: number }>();
  data.forEach((log) => {
    const action = log.action || 'unknown';
    const entry = funcMap.get(action) || { executions: 0, totalTime: 0 };
    entry.executions += 1;
    entry.totalTime += 50; // estimated avg ms
    funcMap.set(action, entry);
  });

  return Array.from(funcMap.entries())
    .map(([name, stats]) => ({
      name,
      executions: stats.executions,
      avgDuration: Math.round(stats.totalTime / stats.executions),
    }))
    .sort((a, b) => b.executions - a.executions)
    .slice(0, 10);
}

async function fetchDbQueryMetrics(days: number): Promise<{ date: string; count: number }[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from('audit_logs')
    .select('created_at')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true })
    .limit(1000);

  if (error || !data) return [];

  const dayMap = new Map<string, number>();
  data.forEach((log) => {
    const day = log.created_at.slice(0, 10);
    dayMap.set(day, (dayMap.get(day) || 0) + 1);
  });

  return Array.from(dayMap.entries()).map(([date, count]) => ({ date, count }));
}

async function fetchStorageMetrics(): Promise<CloudMetrics['storageUsage']> {
  // Approximate storage by counting analysis_documents
  const { count: docCount } = await supabase
    .from('analysis_documents')
    .select('*', { count: 'exact', head: true });

  const { count: claimFileCount } = await supabase
    .from('claim_files')
    .select('*', { count: 'exact', head: true });

  const { count: agencyDocCount } = await supabase
    .from('agency_documents')
    .select('*', { count: 'exact', head: true });

  return [
    { bucket: 'Documentos de Análise', size: (docCount || 0) * 0.5, fileCount: docCount || 0 },
    { bucket: 'Arquivos de Garantia', size: (claimFileCount || 0) * 0.8, fileCount: claimFileCount || 0 },
    { bucket: 'Documentos de Imobiliária', size: (agencyDocCount || 0) * 0.3, fileCount: agencyDocCount || 0 },
  ];
}

export function useCloudMetrics() {
  return useQuery({
    queryKey: ['cloud-metrics'],
    queryFn: async (): Promise<CloudMetrics> => {
      const [dbQueries7d, dbQueries1d, edgeFunctions, storageUsage] = await Promise.all([
        fetchDbQueryMetrics(7),
        fetchDbQueryMetrics(1),
        fetchEdgeFunctionStats(),
        fetchStorageMetrics(),
      ]);

      const totalQueries24h = dbQueries1d.reduce((sum, d) => sum + d.count, 0);
      const totalQueries7d = dbQueries7d.reduce((sum, d) => sum + d.count, 0);
      const totalEdgeFunctionCalls = edgeFunctions.reduce((sum, f) => sum + f.executions, 0);
      const avgEdgeFunctionDuration = edgeFunctions.length > 0
        ? Math.round(edgeFunctions.reduce((sum, f) => sum + f.avgDuration, 0) / edgeFunctions.length)
        : 0;
      const totalStorageMB = storageUsage.reduce((sum, s) => sum + s.size, 0);
      const totalFiles = storageUsage.reduce((sum, s) => sum + s.fileCount, 0);

      return {
        dbQueries: dbQueries7d,
        edgeFunctions,
        storageUsage,
        totals: {
          totalQueries24h,
          totalQueries7d,
          totalEdgeFunctionCalls,
          avgEdgeFunctionDuration,
          totalStorageMB,
          totalFiles,
        },
      };
    },
    staleTime: 60_000,
  });
}
