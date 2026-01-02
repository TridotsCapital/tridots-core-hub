import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useUploadAgencyLogo() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ agencyId, file }: { agencyId: string; file: File }) => {
      // Validate file type
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        throw new Error("Formato não permitido. Use JPG, PNG ou WebP.");
      }

      // Validate file size (max 2MB)
      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error("Arquivo muito grande. Máximo 2MB.");
      }

      // Get file extension
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `${agencyId}/logo.${ext}`;

      // Delete existing logo if any
      const { data: existingFiles } = await supabase.storage
        .from("agency-logos")
        .list(agencyId);

      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map((f) => `${agencyId}/${f.name}`);
        await supabase.storage.from("agency-logos").remove(filesToDelete);
      }

      // Upload new logo
      const { error: uploadError } = await supabase.storage
        .from("agency-logos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL with cache busting
      const { data: urlData } = supabase.storage
        .from("agency-logos")
        .getPublicUrl(filePath);

      // Add timestamp to bust cache
      const logoUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Update agency record
      const { error: updateError } = await supabase
        .from("agencies")
        .update({ logo_url: logoUrl })
        .eq("id", agencyId);

      if (updateError) throw updateError;

      return logoUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency-user"] });
      queryClient.invalidateQueries({ queryKey: ["agencies"] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      toast({
        title: "Logo atualizada",
        description: "A logo da imobiliária foi atualizada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar logo",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteAgencyLogo() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (agencyId: string) => {
      // List and delete all files in agency folder
      const { data: files } = await supabase.storage
        .from("agency-logos")
        .list(agencyId);

      if (files && files.length > 0) {
        const filesToDelete = files.map((f) => `${agencyId}/${f.name}`);
        await supabase.storage.from("agency-logos").remove(filesToDelete);
      }

      // Clear logo_url in agency record
      const { error } = await supabase
        .from("agencies")
        .update({ logo_url: null })
        .eq("id", agencyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency-user"] });
      queryClient.invalidateQueries({ queryKey: ["agencies"] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      toast({
        title: "Logo removida",
        description: "A logo da imobiliária foi removida.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover logo",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
