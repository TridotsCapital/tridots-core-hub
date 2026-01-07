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

      // 1. Fetch agency_users for this agency
      const { data: agencyUsers, error: auError } = await supabase
        .from('agency_users')
        .select('id, user_id, is_primary_contact, created_at')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: true });

      if (auError) throw auError;
      if (!agencyUsers?.length) return [];

      const userIds = agencyUsers.map(au => au.user_id);
      const agencyUserIds = agencyUsers.map(au => au.id);

      // 2. Fetch profiles separately using user_ids
      const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('id, full_name, email, active, avatar_url, phone')
        .in('id', userIds);

      if (pError) throw pError;

      // 3. Fetch positions for all agency_user ids
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

      // 4. Combine data in JavaScript
      return agencyUsers.map(au => {
        const profile = profiles?.find(p => p.id === au.user_id);
        return {
          id: au.id,
          user_id: au.user_id,
          is_primary_contact: au.is_primary_contact,
          created_at: au.created_at,
          profile: profile || null,
          position: positionsMap[au.id] || null,
        };
      }) as AgencyCollaborator[];
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
