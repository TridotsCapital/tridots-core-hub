import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface AgencyProfileData {
  id: string;
  cnpj: string;
  razao_social: string;
  nome_fantasia: string | null;
  email: string;
  telefone: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  responsavel_nome: string;
  responsavel_email: string | null;
  responsavel_telefone: string | null;
  logo_url: string | null;
  creci_numero: string | null;
  active: boolean;
  onboarding_completed: boolean | null;
  terms_accepted_at: string | null;
}

export interface UpdateAgencyProfileData {
  nome_fantasia?: string | null;
  email?: string;
  telefone?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  responsavel_nome?: string;
  responsavel_email?: string | null;
  responsavel_telefone?: string | null;
}

export function useAgencyProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["agency-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      // First get the agency_id from agency_users
      const { data: agencyUser, error: auError } = await supabase
        .from("agency_users")
        .select("agency_id")
        .eq("user_id", user.id)
        .single();

      if (auError) throw auError;
      if (!agencyUser?.agency_id) throw new Error("Agency not found");

      // Then get the agency data
      const { data: agency, error: agencyError } = await supabase
        .from("agencies")
        .select(`
          id,
          cnpj,
          razao_social,
          nome_fantasia,
          email,
          telefone,
          endereco,
          cidade,
          estado,
          cep,
          responsavel_nome,
          responsavel_email,
          responsavel_telefone,
          logo_url,
          creci_numero,
          active,
          onboarding_completed,
          terms_accepted_at
        `)
        .eq("id", agencyUser.agency_id)
        .single();

      if (agencyError) throw agencyError;
      return agency as AgencyProfileData;
    },
    enabled: !!user?.id,
  });
}

export function useUpdateAgencyProfile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ agencyId, data }: { agencyId: string; data: UpdateAgencyProfileData }) => {
      const { error } = await supabase
        .from("agencies")
        .update(data)
        .eq("id", agencyId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Dados atualizados",
        description: "Os dados da imobiliária foram atualizados com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["agency-profile", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["agency-user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
