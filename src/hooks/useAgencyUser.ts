import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface AgencyUserData {
  id: string;
  user_id: string;
  agency_id: string;
  is_primary_contact: boolean;
  created_at: string;
  updated_at: string;
  agency: {
    id: string;
    razao_social: string;
    nome_fantasia: string | null;
    cnpj: string;
    email: string;
    active: boolean;
    percentual_comissao_setup: number;
    desconto_pix_percentual: number | null;
    responsavel_nome: string;
    responsavel_email: string | null;
    responsavel_telefone: string | null;
    telefone: string | null;
    endereco: string | null;
    cidade: string | null;
    estado: string | null;
    cep: string | null;
    logo_url: string | null;
    created_at: string;
    updated_at: string;
  } | null;
}

export function useAgencyUser() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["agency-user", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("agency_users")
        .select(`
          *,
          agency:agencies(*)
        `)
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching agency user:", error);
        return null;
      }

      return data as AgencyUserData;
    },
    enabled: !!user?.id,
  });

  // Derived state for easy access
  const isAgencyActive = query.data?.agency?.active ?? false;

  return {
    ...query,
    isAgencyActive,
  };
}
