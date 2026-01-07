import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type AgencyPosition = "dono" | "gerente" | "auxiliar";

export interface AgencyCollaborator {
  id: string;
  user_id: string;
  is_primary_contact: boolean;
  created_at: string;
  profile: {
    id: string;
    full_name: string;
    email: string;
    active: boolean;
    avatar_url: string | null;
    phone: string | null;
  };
  position: AgencyPosition | null;
}

export function useAgencyCollaborators(agencyId: string | null) {
  return useQuery({
    queryKey: ['agency-collaborators', agencyId],
    queryFn: async () => {
      if (!agencyId) return [];

      // Fetch agency users with profiles
      const { data, error } = await supabase
        .from('agency_users')
        .select(`
          id,
          user_id,
          is_primary_contact,
          created_at,
          profile:profiles!agency_users_user_id_fkey (
            id,
            full_name,
            email,
            active,
            avatar_url,
            phone
          )
        `)
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch positions for all agency_user ids
      const agencyUserIds = (data || []).map(d => d.id);
      let positionsMap: Record<string, AgencyPosition> = {};
      
      if (agencyUserIds.length > 0) {
        const { data: positions } = await supabase
          .from('agency_user_positions')
          .select('agency_user_id, position')
          .in('agency_user_id', agencyUserIds);
        
        if (positions) {
          positionsMap = positions.reduce((acc, p) => {
            acc[p.agency_user_id] = p.position as AgencyPosition;
            return acc;
          }, {} as Record<string, AgencyPosition>);
        }
      }

      // Transform the data to flatten the profile and add position
      return (data || []).map(item => ({
        ...item,
        profile: Array.isArray(item.profile) ? item.profile[0] : item.profile,
        position: positionsMap[item.id] || null,
      })) as AgencyCollaborator[];
    },
    enabled: !!agencyId,
  });
}

export function useToggleCollaboratorActive() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, active }: { userId: string; active: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ active })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: (_, { active }) => {
      toast({
        title: active ? "Colaborador ativado" : "Colaborador desativado",
        description: `O status do colaborador foi alterado.`,
      });
      queryClient.invalidateQueries({ queryKey: ['agency-collaborators'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao alterar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
