import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export type AgencyPosition = "dono" | "gerente" | "auxiliar";

export interface UserProfileData {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  position: AgencyPosition | null;
  agency_user_id: string | null;
}

export function useUserProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async (): Promise<UserProfileData | null> => {
      if (!user?.id) return null;

      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, avatar_url')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Fetch agency_user and position
      const { data: agencyUser } = await supabase
        .from('agency_users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      let position: AgencyPosition | null = null;
      if (agencyUser) {
        const { data: positionData } = await supabase
          .from('agency_user_positions')
          .select('position')
          .eq('agency_user_id', agencyUser.id)
          .single();
        
        position = positionData?.position as AgencyPosition | null;
      }

      return {
        ...profile,
        position,
        agency_user_id: agencyUser?.id || null,
      };
    },
    enabled: !!user?.id,
  });
}

export function useUpdateUserProfile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      full_name, 
      phone, 
      position,
      agency_user_id 
    }: { 
      full_name: string; 
      phone: string | null; 
      position: AgencyPosition;
      agency_user_id: string | null;
    }) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name, phone })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update or insert position
      if (agency_user_id) {
        const { error: positionError } = await supabase
          .from('agency_user_positions')
          .upsert({ 
            agency_user_id, 
            position 
          }, { 
            onConflict: 'agency_user_id' 
          });

        if (positionError) throw positionError;
      }
    },
    onSuccess: () => {
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['agency-collaborators'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUploadUserAvatar() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('user-avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(filePath);

      // Add timestamp to bust cache
      const avatarUrl = `${publicUrl}?t=${Date.now()}`;

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      return avatarUrl;
    },
    onSuccess: () => {
      toast({
        title: "Foto atualizada",
        description: "Sua foto de perfil foi salva com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['agency-collaborators'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error: Error) => {
      console.error('Avatar upload error:', error);
      
      let errorMessage = error.message;
      if (error.message.includes('Bucket not found')) {
        errorMessage = 'Bucket de armazenamento não encontrado. Contate o suporte.';
      } else if (error.message.includes('Permission denied') || error.message.includes('policy')) {
        errorMessage = 'Sem permissão para fazer upload. Verifique se está logado corretamente.';
      } else if (error.message.includes('File too large') || error.message.includes('size')) {
        errorMessage = 'Arquivo muito grande. Máximo permitido: 5MB.';
      } else if (error.message.includes('Invalid file type') || error.message.includes('type')) {
        errorMessage = 'Formato de arquivo não suportado. Use JPG, PNG ou WebP.';
      }
      
      toast({
        title: "Erro ao enviar foto",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteUserAvatar() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      // List files in user folder
      const { data: files } = await supabase.storage
        .from('user-avatars')
        .list(user.id);

      if (files && files.length > 0) {
        const filePaths = files.map(f => `${user.id}/${f.name}`);
        await supabase.storage
          .from('user-avatars')
          .remove(filePaths);
      }

      // Clear avatar_url in profile
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Foto removida",
        description: "Sua foto de perfil foi removida.",
      });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['agency-collaborators'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover foto",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
