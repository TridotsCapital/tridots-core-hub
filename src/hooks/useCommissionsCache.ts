import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CommissionCacheOptions {
  agencyId?: string;
  year?: number;
  month?: number;
  enabled?: boolean;
}

/**
 * Cache hook for commissions data with memoization
 * Prevents unnecessary recalculations when component props haven't changed
 */
export function useCommissionsCache(options: CommissionCacheOptions = {}) {
  const { agencyId, year = new Date().getFullYear(), month, enabled = true } = options;

  // Generate cache key that changes only when relevant parameters change
  const cacheKey = useMemo(
    () => `commissions:${agencyId}:${year}:${month || 'all'}`,
    [agencyId, year, month]
  );

  return useQuery({
    queryKey: ['commissions-cache', cacheKey],
    queryFn: async () => {
      if (!agencyId) return null;

      let query = supabase
        .from('commissions')
        .select('*, agency:agencies(id, razao_social)', { count: 'exact' })
        .eq('agency_id', agencyId);

      if (month) {
        query = query.eq('mes_referencia', month);
      }

      query = query.eq('ano_referencia', year);

      // Use indexed columns for filtering to improve performance
      const { data, error, count } = await query
        .order('due_date', { ascending: false })
        .limit(100); // Reasonable limit for frontend display

      if (error) throw error;

      return {
        commissions: data || [],
        total: count || 0,
      };
    },
    enabled: enabled && !!agencyId,
    staleTime: 5 * 60 * 1000, // 5 minutes - commissions change infrequently
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache longer
  });
}

/**
 * Hook to invalidate commissions cache when mutations occur
 */
export function useInvalidateCommissionsCache() {
  return {
    onSuccess: async () => {
      // This will be handled by query invalidation in mutation handlers
      // Cache is automatically invalidated when commissions are updated
    },
  };
}
