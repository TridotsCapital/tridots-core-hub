import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Types
export interface HelpChapter {
  id: string;
  order_index: number;
  slug: string;
  title: string;
  icon: string;
  is_new: boolean;
  created_at: string;
  updated_at: string;
}

export interface HelpSection {
  id: string;
  chapter_id: string;
  order_index: number;
  slug: string;
  title: string;
  content: string;
  tips: string[] | null;
  warnings: string[] | null;
  portal_links: Array<{ label: string; path: string; icon?: string }> | null;
  see_also: Array<{ title: string; slug: string }> | null;
  created_at: string;
  updated_at: string;
}

export interface HelpMedia {
  id: string;
  section_id: string;
  placeholder_id: string;
  media_type: "screenshot" | "video";
  file_path: string | null;
  video_url: string | null;
  caption: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface HelpFeedback {
  id: string;
  section_id: string;
  user_id: string;
  is_helpful: boolean;
  created_at: string;
  section?: { id: string; title: string; slug: string } | null;
  profile?: { full_name: string; email: string } | null;
}

// Fetch all chapters
export function useHelpAdminChapters() {
  return useQuery({
    queryKey: ["help-admin-chapters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("help_chapters")
        .select("*")
        .order("order_index");
      if (error) throw error;
      return data as HelpChapter[];
    },
  });
}

// Fetch sections for a chapter
export function useHelpAdminSections(chapterId?: string) {
  return useQuery({
    queryKey: ["help-admin-sections", chapterId],
    queryFn: async () => {
      let query = supabase.from("help_sections").select("*").order("order_index");
      if (chapterId) {
        query = query.eq("chapter_id", chapterId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as HelpSection[];
    },
    enabled: !!chapterId,
  });
}

// Fetch media for a section
export function useHelpAdminMedia(sectionId?: string) {
  return useQuery({
    queryKey: ["help-admin-media", sectionId],
    queryFn: async () => {
      let query = supabase.from("help_media").select("*").order("order_index");
      if (sectionId) {
        query = query.eq("section_id", sectionId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as HelpMedia[];
    },
  });
}

// Fetch all feedback with section info
export function useHelpAdminFeedback() {
  return useQuery({
    queryKey: ["help-admin-feedback"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("help_feedback")
        .select(`
          *,
          section:help_sections(id, title, slug)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      
      // Fetch profiles separately to avoid FK issues
      const userIds = [...new Set(data.map(f => f.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      return data.map(item => ({
        ...item,
        profile: profileMap.get(item.user_id) || null,
      })) as HelpFeedback[];
    },
  });
}

// Update chapter
export function useUpdateHelpChapter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (chapter: Partial<HelpChapter> & { id: string }) => {
      const { data, error } = await supabase
        .from("help_chapters")
        .update({
          title: chapter.title,
          slug: chapter.slug,
          icon: chapter.icon,
          is_new: chapter.is_new,
          order_index: chapter.order_index,
          updated_at: new Date().toISOString(),
        })
        .eq("id", chapter.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["help-admin-chapters"] });
      toast.success("Capítulo atualizado com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar capítulo: " + error.message);
    },
  });
}

// Update section
export function useUpdateHelpSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (section: Partial<HelpSection> & { id: string }) => {
      const { data, error } = await supabase
        .from("help_sections")
        .update({
          title: section.title,
          slug: section.slug,
          content: section.content,
          tips: section.tips,
          warnings: section.warnings,
          portal_links: section.portal_links,
          see_also: section.see_also,
          order_index: section.order_index,
          updated_at: new Date().toISOString(),
        })
        .eq("id", section.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["help-admin-sections"] });
      toast.success("Seção atualizada com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar seção: " + error.message);
    },
  });
}

// Upload media (screenshot)
export function useUploadHelpMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sectionId,
      placeholderId,
      file,
      caption,
    }: {
      sectionId: string;
      placeholderId: string;
      file: File;
      caption?: string;
    }) => {
      const fileExt = file.name.split(".").pop();
      const fileName = `${sectionId}/${placeholderId}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("help-assets")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage.from("help-assets").getPublicUrl(fileName);

      // Upsert media record
      const { data, error } = await supabase
        .from("help_media")
        .upsert(
          {
            section_id: sectionId,
            placeholder_id: placeholderId,
            media_type: "screenshot",
            file_path: urlData.publicUrl,
            caption,
          },
          { onConflict: "section_id,placeholder_id" }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["help-admin-media"] });
      toast.success("Screenshot enviado com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao enviar screenshot: " + error.message);
    },
  });
}

// Add video link
export function useAddHelpVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sectionId,
      placeholderId,
      videoUrl,
      caption,
    }: {
      sectionId: string;
      placeholderId: string;
      videoUrl: string;
      caption?: string;
    }) => {
      const { data, error } = await supabase
        .from("help_media")
        .upsert(
          {
            section_id: sectionId,
            placeholder_id: placeholderId,
            media_type: "video",
            video_url: videoUrl,
            caption,
          },
          { onConflict: "section_id,placeholder_id" }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["help-admin-media"] });
      toast.success("Vídeo adicionado com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao adicionar vídeo: " + error.message);
    },
  });
}

// Delete media
export function useDeleteHelpMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mediaId: string) => {
      const { error } = await supabase.from("help_media").delete().eq("id", mediaId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["help-admin-media"] });
      toast.success("Mídia removida com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao remover mídia: " + error.message);
    },
  });
}

// Get feedback stats
export function useHelpFeedbackStats() {
  return useQuery({
    queryKey: ["help-feedback-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.from("help_feedback").select("is_helpful");
      if (error) throw error;

      const total = data.length;
      const helpful = data.filter((f) => f.is_helpful).length;
      const notHelpful = total - helpful;
      const rate = total > 0 ? Math.round((helpful / total) * 100) : 0;

      return { total, helpful, notHelpful, rate };
    },
  });
}

// Extract placeholders from content
export function extractPlaceholders(content: string): string[] {
  const regex = /\[\[screenshot:([^\]]+)\]\]/g;
  const matches = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    matches.push(match[1]);
  }
  return matches;
}

// Utility: Generate slug from title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9]+/g, "-") // Substitui caracteres especiais por hífen
    .replace(/^-|-$/g, ""); // Remove hífens do início/fim
}

// Create new chapter
export function useCreateHelpChapter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ title, icon, is_new = false }: { title: string; icon: string; is_new?: boolean }) => {
      // Get max order_index
      const { data: chapters } = await supabase
        .from("help_chapters")
        .select("order_index")
        .order("order_index", { ascending: false })
        .limit(1);

      const maxOrder = chapters?.[0]?.order_index || 0;

      const { data, error } = await supabase
        .from("help_chapters")
        .insert({
          title,
          slug: generateSlug(title),
          icon,
          is_new,
          order_index: maxOrder + 1,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["help-admin-chapters"] });
      toast.success("Capítulo criado com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao criar capítulo: " + error.message);
    },
  });
}

// Delete chapter (only if no sections)
export function useDeleteHelpChapter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (chapterId: string) => {
      // Check if chapter has sections
      const { count, error: countError } = await supabase
        .from("help_sections")
        .select("*", { count: "exact", head: true })
        .eq("chapter_id", chapterId);

      if (countError) throw countError;
      if (count && count > 0) {
        throw new Error("Não é possível excluir um capítulo com seções. Exclua as seções primeiro.");
      }

      const { error } = await supabase.from("help_chapters").delete().eq("id", chapterId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["help-admin-chapters"] });
      toast.success("Capítulo excluído com sucesso");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

// Reorder chapters
export function useReorderHelpChapters() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (chapters: { id: string; order_index: number }[]) => {
      const updates = chapters.map((ch) =>
        supabase
          .from("help_chapters")
          .update({ order_index: ch.order_index, updated_at: new Date().toISOString() })
          .eq("id", ch.id)
      );
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["help-admin-chapters"] });
      toast.success("Ordem dos capítulos atualizada");
    },
    onError: (error) => {
      toast.error("Erro ao reordenar: " + error.message);
    },
  });
}

// Create new section
export function useCreateHelpSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      chapter_id,
      title,
      content = "",
    }: {
      chapter_id: string;
      title: string;
      content?: string;
    }) => {
      // Get max order_index for this chapter
      const { data: sections } = await supabase
        .from("help_sections")
        .select("order_index")
        .eq("chapter_id", chapter_id)
        .order("order_index", { ascending: false })
        .limit(1);

      const maxOrder = sections?.[0]?.order_index || 0;

      const { data, error } = await supabase
        .from("help_sections")
        .insert({
          chapter_id,
          title,
          slug: generateSlug(title),
          content,
          order_index: maxOrder + 1,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["help-admin-sections"] });
      toast.success("Seção criada com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao criar seção: " + error.message);
    },
  });
}

// Delete section (and associated media)
export function useDeleteHelpSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sectionId: string) => {
      // Delete associated media first
      const { error: mediaError } = await supabase.from("help_media").delete().eq("section_id", sectionId);
      if (mediaError) throw mediaError;

      // Delete section
      const { error } = await supabase.from("help_sections").delete().eq("id", sectionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["help-admin-sections"] });
      queryClient.invalidateQueries({ queryKey: ["help-admin-media"] });
      toast.success("Seção excluída com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao excluir seção: " + error.message);
    },
  });
}

// Reorder sections
export function useReorderHelpSections() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sections: { id: string; order_index: number }[]) => {
      const updates = sections.map((sec) =>
        supabase
          .from("help_sections")
          .update({ order_index: sec.order_index, updated_at: new Date().toISOString() })
          .eq("id", sec.id)
      );
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["help-admin-sections"] });
      toast.success("Ordem das seções atualizada");
    },
    onError: (error) => {
      toast.error("Erro ao reordenar: " + error.message);
    },
  });
}
