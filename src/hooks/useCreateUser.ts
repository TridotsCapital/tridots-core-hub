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

// Traduz mensagens de erro comuns para português
function translateErrorMessage(message: string): string {
  const translations: Record<string, string> = {
    'A user with this email address has already been registered': 
      'Este email já está cadastrado no sistema',
    'User already registered':
      'Este email já está cadastrado no sistema',
    'Missing required fields': 
      'Campos obrigatórios não preenchidos',
    'Invalid role for team member': 
      'Permissão inválida para membro da equipe',
    'Only masters can create team members': 
      'Apenas administradores podem criar membros da equipe',
    'You can only add collaborators to your own agency':
      'Você só pode adicionar colaboradores à sua própria imobiliária',
    'Cannot add collaborators to inactive agency':
      'Não é possível adicionar colaboradores a uma imobiliária inativa',
    'Agency ID is required for collaborators':
      'ID da imobiliária é obrigatório para colaboradores',
    'Missing authorization header':
      'Sessão expirada. Faça login novamente.',
    'Invalid token':
      'Sessão inválida. Faça login novamente.',
    'Not authenticated':
      'Você precisa estar logado para realizar esta ação',
    'Failed to assign role':
      'Falha ao atribuir permissão ao usuário',
    'Failed to link user to agency':
      'Falha ao vincular usuário à imobiliária',
    'Internal server error':
      'Erro interno do servidor. Tente novamente.',
  };
  
  // Verifica correspondência exata
  if (translations[message]) {
    return translations[message];
  }
  
  // Verifica correspondência parcial para mensagens que podem variar
  for (const [key, value] of Object.entries(translations)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  
  return message;
}

export function useCreateUser() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateUserParams) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Você precisa estar logado para realizar esta ação');
      }

      const { data, error } = await supabase.functions.invoke('create-user', {
        body: params,
      });

      // IMPORTANTE: Priorizar mensagem específica do corpo da resposta
      // O supabase.functions.invoke retorna erro genérico em `error` 
      // mas a mensagem real está em `data.error`
      if (data?.error) {
        throw new Error(translateErrorMessage(data.error));
      }

      // Fallback para erros de rede/invocação
      if (error) {
        throw new Error(translateErrorMessage(error.message) || 'Falha ao criar usuário');
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
