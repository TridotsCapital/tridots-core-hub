import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreateUserParams {
  email: string;
  password: string;
  full_name: string;
  type: 'team' | 'agency_collaborator';
  role?: 'master' | 'analyst';
  agency_id?: string;
}

export function useCreateUser() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateUserParams) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('create-user', {
        body: params,
      });

      if (error) {
        throw new Error(error.message || 'Failed to create user');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Usuário criado",
        description: `${variables.full_name} foi adicionado com sucesso.`,
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      queryClient.invalidateQueries({ queryKey: ['agency-collaborators'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
