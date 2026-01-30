import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Remove acentos e caracteres especiais, substitui espaços por underscores
const sanitizeFileName = (fileName: string): string => {
  return fileName
    .normalize("NFD")                    // Decompõe acentos
    .replace(/[\u0300-\u036f]/g, "")    // Remove marcas diacríticas
    .replace(/[^a-zA-Z0-9._-]/g, "_")   // Substitui caracteres especiais por _
    .replace(/_+/g, "_");               // Remove underscores duplicados
};

export interface TermTemplate {
  id: string;
  name: string;
  description: string | null;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string | null;
  version: number;
  is_active: boolean;
  visible_in_agency_drive: boolean;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export const useTermTemplates = () => {
  return useQuery({
    queryKey: ["term-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("term_templates")
        .select("*")
        .order("name", { ascending: true })
        .order("version", { ascending: false });

      if (error) throw error;
      return data as TermTemplate[];
    },
  });
};

// Hook para listar templates ativos visíveis no Drive de Documentos das imobiliárias
export const useActiveTermTemplates = () => {
  return useQuery({
    queryKey: ["term-templates", "active", "agency-drive"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("term_templates")
        .select("*")
        .eq("is_active", true)
        .eq("visible_in_agency_drive", true)
        .order("name", { ascending: true });

      if (error) throw error;
      return data as TermTemplate[];
    },
  });
};

export const useUploadTermTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      file,
      name,
      description,
      userId,
    }: {
      file: File;
      name: string;
      description?: string;
      userId: string;
    }) => {
      const fileExt = file.name.split(".").pop();
      const sanitizedName = sanitizeFileName(file.name);
      const fileName = `${Date.now()}_${sanitizedName}`;
      const filePath = `templates/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("term-templates")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data, error } = await supabase
        .from("term_templates")
        .insert({
          name,
          description,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
          uploaded_by: userId,
          visible_in_agency_drive: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["term-templates"] });
      toast({
        title: "Modelo enviado",
        description: "O modelo de termo foi enviado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao enviar",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUploadNewVersion = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      file,
      originalTemplate,
      userId,
    }: {
      file: File;
      originalTemplate: TermTemplate;
      userId: string;
    }) => {
      const sanitizedName = sanitizeFileName(file.name);
      const fileName = `${Date.now()}_${sanitizedName}`;
      const filePath = `templates/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("term-templates")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Deactivate old version
      await supabase
        .from("term_templates")
        .update({ is_active: false })
        .eq("id", originalTemplate.id);

      // Create new version - mantém a visibilidade do template original
      const { data, error } = await supabase
        .from("term_templates")
        .insert({
          name: originalTemplate.name,
          description: originalTemplate.description,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
          version: originalTemplate.version + 1,
          uploaded_by: userId,
          visible_in_agency_drive: originalTemplate.visible_in_agency_drive,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["term-templates"] });
      toast({
        title: "Nova versão enviada",
        description: "A nova versão do termo foi enviada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao enviar",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateTermTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      name,
      description,
    }: {
      id: string;
      name: string;
      description?: string;
    }) => {
      const { data, error } = await supabase
        .from("term_templates")
        .update({ name, description })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["term-templates"] });
      toast({
        title: "Modelo atualizado",
        description: "O modelo de termo foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteTermTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (template: TermTemplate) => {
      await supabase.storage.from("term-templates").remove([template.file_path]);

      const { error } = await supabase
        .from("term_templates")
        .delete()
        .eq("id", template.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["term-templates"] });
      toast({
        title: "Modelo excluído",
        description: "O modelo de termo foi excluído com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDownloadTermTemplate = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (template: TermTemplate) => {
      const { data, error } = await supabase.storage
        .from("term-templates")
        .download(template.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = template.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    onError: (error) => {
      toast({
        title: "Erro ao baixar",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
