import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface DigitalAcceptance {
  id: string;
  analysis_id: string;
  term_template_id: string;
  accepted_by_name: string;
  accepted_by_cpf: string;
  accepted_by_email: string | null;
  ip_address: string;
  user_agent: string;
  geolocation_city: string | null;
  geolocation_state: string | null;
  geolocation_country: string | null;
  document_hash: string;
  accepted_at: string;
  created_at: string;
}

export const useDigitalAcceptances = (analysisId?: string) => {
  return useQuery({
    queryKey: ["digital-acceptances", analysisId],
    queryFn: async () => {
      let query = supabase
        .from("digital_acceptances")
        .select("*")
        .order("accepted_at", { ascending: false });

      if (analysisId) {
        query = query.eq("analysis_id", analysisId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as DigitalAcceptance[];
    },
  });
};

export const useCreateDigitalAcceptance = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (acceptance: {
      analysis_id: string;
      term_template_id: string;
      accepted_by_name: string;
      accepted_by_cpf: string;
      accepted_by_email?: string;
      ip_address: string;
      user_agent: string;
      geolocation_city?: string;
      geolocation_state?: string;
      geolocation_country?: string;
      document_hash: string;
    }) => {
      const { data, error } = await supabase
        .from("digital_acceptances")
        .insert(acceptance)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["digital-acceptances"] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao registrar aceite",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
