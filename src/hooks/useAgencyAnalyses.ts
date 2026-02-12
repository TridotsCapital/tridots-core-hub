import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAgencyUser } from "./useAgencyUser";
import { useEffect } from "react";
import { Analysis, AnalysisStatus } from "@/types/database";

interface UseAgencyAnalysesOptions {
  status?: AnalysisStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

export function useAgencyAnalyses(options: UseAgencyAnalysesOptions = {}) {
  const { data: agencyUser } = useAgencyUser();
  const queryClient = useQueryClient();
  const agencyId = agencyUser?.agency_id;

  const query = useQuery({
    queryKey: ["agency-analyses", agencyId, options.status, options.search, options.page, options.pageSize],
    queryFn: async () => {
      if (!agencyId) return [];

      const page = options.page || 1;
      const pageSize = options.pageSize || 50;
      const offset = (page - 1) * pageSize;

      let queryBuilder = supabase
        .from("analyses")
        .select(`
          *,
          agency:agencies(*)
        `)
        .eq("agency_id", agencyId)
        .order("created_at", { ascending: false })
        .limit(pageSize)
        .range(offset, offset + pageSize - 1);

      if (options.status) {
        queryBuilder = queryBuilder.eq("status", options.status);
      }

      if (options.search) {
        const searchTerm = `%${options.search}%`;
        queryBuilder = queryBuilder.or(
          `inquilino_nome.ilike.${searchTerm},inquilino_cpf.ilike.${searchTerm},imovel_endereco.ilike.${searchTerm}`
        );
      }

      const { data, error } = await queryBuilder;

      if (error) {
        console.error("Error fetching agency analyses:", error);
        throw error;
      }

      return data as Analysis[];
    },
    enabled: !!agencyId,
  });

  // Realtime subscription for updates
  useEffect(() => {
    if (!agencyId) return;

    const channel = supabase
      .channel(`agency-analyses-${agencyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "analyses",
          filter: `agency_id=eq.${agencyId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["agency-analyses", agencyId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agencyId, queryClient]);

  return query;
}
