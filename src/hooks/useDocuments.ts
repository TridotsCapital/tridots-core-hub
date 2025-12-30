import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { AnalysisDocument } from '@/types/database';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export function useDocuments(analysisId: string | undefined) {
  return useQuery({
    queryKey: ['documents', analysisId],
    queryFn: async () => {
      if (!analysisId) return [];
      
      const { data, error } = await supabase
        .from('analysis_documents')
        .select('*')
        .eq('analysis_id', analysisId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AnalysisDocument[];
    },
    enabled: !!analysisId,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ analysisId, file }: { analysisId: string; file: File }) => {
      const filePath = `${analysisId}/${Date.now()}-${file.name}`;
      
      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('analysis-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { data, error } = await supabase
        .from('analysis_documents')
        .insert({
          analysis_id: analysisId,
          uploaded_by: user?.id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents', variables.analysisId] });
      toast.success('Documento enviado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao enviar documento: ' + error.message);
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, filePath, analysisId }: { id: string; filePath: string; analysisId: string }) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('analysis-documents')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete record
      const { error } = await supabase
        .from('analysis_documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { analysisId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['documents', data.analysisId] });
      toast.success('Documento excluído com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao excluir documento: ' + error.message);
    },
  });
}

export function useDownloadDocument() {
  return useMutation({
    mutationFn: async ({ filePath, fileName }: { filePath: string; fileName: string }) => {
      const { data, error } = await supabase.storage
        .from('analysis-documents')
        .download(filePath);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    onError: (error: Error) => {
      toast.error('Erro ao baixar documento: ' + error.message);
    },
  });
}
