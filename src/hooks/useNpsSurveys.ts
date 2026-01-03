import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PendingSurvey {
  id: string;
  ticket_id: string;
  analyst_id: string | null;
  created_at: string;
  ticket: {
    subject: string;
    resolved_at: string | null;
    closed_by_type: string | null;
  };
}

export function usePendingNpsSurveys(agencyId: string | undefined) {
  return useQuery({
    queryKey: ["pending-nps-surveys", agencyId],
    queryFn: async () => {
      if (!agencyId) return [];
      
      const { data, error } = await supabase
        .from("satisfaction_surveys")
        .select(`
          id,
          ticket_id,
          analyst_id,
          created_at,
          ticket:tickets(subject, resolved_at, closed_by_type)
        `)
        .eq("agency_id", agencyId)
        .is("rating", null);

      if (error) throw error;
      
      // Transform the data to match our interface
      return (data || []).map((survey: any) => ({
        ...survey,
        ticket: survey.ticket || { subject: "Chamado", resolved_at: null, closed_by_type: null },
      })) as PendingSurvey[];
    },
    enabled: !!agencyId,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}

export function useSubmitNpsSurvey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      surveyId,
      rating,
      comment,
      userId,
    }: {
      surveyId: string;
      rating: number;
      comment?: string;
      userId: string;
    }) => {
      const { error } = await supabase
        .from("satisfaction_surveys")
        .update({
          rating,
          comment: comment || null,
          created_by: userId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", surveyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-nps-surveys"] });
    },
  });
}
