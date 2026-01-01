import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ClaimFile, ClaimFileType, CreateClaimFileInput } from '@/types/claims';

// =====================================================
// QUERIES
// =====================================================

export function useClaimFiles(claimId: string | undefined) {
  return useQuery({
    queryKey: ['claim-files', claimId],
    queryFn: async () => {
      if (!claimId) return [];
      
      const { data, error } = await supabase
        .from('claim_files')
        .select(`
          *,
          uploader:profiles!claim_files_uploaded_by_fkey(full_name)
        `)
        .eq('claim_id', claimId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ClaimFile[];
    },
    enabled: !!claimId,
  });
}

// =====================================================
// MUTATIONS
// =====================================================

export function useUploadClaimFile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      claimId,
      file,
      fileType,
      description,
    }: {
      claimId: string;
      file: File;
      fileType: ClaimFileType;
      description?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Gerar path único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `${claimId}/${fileName}`;

      // Upload para o storage
      const { error: uploadError } = await supabase.storage
        .from('claim-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Registrar no banco
      const { data, error: insertError } = await supabase
        .from('claim_files')
        .insert({
          claim_id: claimId,
          file_path: filePath,
          file_name: file.name,
          file_size: file.size,
          file_type: fileType,
          description: description || null,
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (insertError) {
        // Rollback: deletar arquivo do storage
        await supabase.storage.from('claim-files').remove([filePath]);
        throw insertError;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['claim-files', variables.claimId] });
      toast({
        title: 'Arquivo enviado',
        description: 'O arquivo foi enviado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao enviar arquivo',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteClaimFile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      fileId, 
      filePath, 
      claimId 
    }: { 
      fileId: string; 
      filePath: string; 
      claimId: string;
    }) => {
      // Deletar do storage
      const { error: storageError } = await supabase.storage
        .from('claim-files')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Deletar do banco
      const { error: dbError } = await supabase
        .from('claim_files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;

      return { claimId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['claim-files', data.claimId] });
      toast({
        title: 'Arquivo removido',
        description: 'O arquivo foi removido com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao remover arquivo',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Helper para obter URL de download
export async function getClaimFileUrl(filePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('claim-files')
    .createSignedUrl(filePath, 3600); // 1 hora de validade

  if (error) return null;
  return data.signedUrl;
}
