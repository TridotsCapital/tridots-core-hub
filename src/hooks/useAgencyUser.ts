import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useAgencyUser() {
  const { user } = useAuth();

  return useQuery({
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

      return data;
    },
    enabled: !!user?.id,
  });
}
