import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  tips: string[];
  warnings: string[];
  see_also: Array<{ title: string; slug: string }>;
  portal_links: Array<{ label: string; path: string; icon?: string }>;
  created_at: string;
  updated_at: string;
}

export interface HelpFaq {
  id: string;
  chapter_id: string;
  order_index: number;
  question: string;
  answer: string;
}

export interface HelpMedia {
  id: string;
  section_id: string;
  placeholder_id: string;
  media_type: 'screenshot' | 'video';
  file_path: string | null;
  caption: string | null;
  video_url: string | null;
  order_index: number;
}

export interface HelpGlossaryTerm {
  id: string;
  term: string;
  definition: string;
}

export interface HelpChapterWithSections extends HelpChapter {
  sections: HelpSection[];
  faqs: HelpFaq[];
}

export function useHelpChapters() {
  return useQuery({
    queryKey: ["help-chapters"],
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

export function useHelpSections(chapterId?: string) {
  return useQuery({
    queryKey: ["help-sections", chapterId],
    queryFn: async () => {
      let query = supabase
        .from("help_sections")
        .select("*")
        .order("order_index");

      if (chapterId) {
        query = query.eq("chapter_id", chapterId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as HelpSection[];
    },
    enabled: !chapterId || !!chapterId,
  });
}

export function useHelpFaqs(chapterId?: string) {
  return useQuery({
    queryKey: ["help-faqs", chapterId],
    queryFn: async () => {
      let query = supabase
        .from("help_faqs")
        .select("*")
        .order("order_index");

      if (chapterId) {
        query = query.eq("chapter_id", chapterId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as HelpFaq[];
    },
  });
}

export function useHelpMedia(sectionId?: string) {
  return useQuery({
    queryKey: ["help-media", sectionId],
    queryFn: async () => {
      let query = supabase
        .from("help_media")
        .select("*")
        .order("order_index");

      if (sectionId) {
        query = query.eq("section_id", sectionId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as HelpMedia[];
    },
  });
}

export function useHelpGlossary() {
  return useQuery({
    queryKey: ["help-glossary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("help_glossary")
        .select("*")
        .order("term");

      if (error) throw error;
      return data as HelpGlossaryTerm[];
    },
  });
}

export function useHelpFullContent() {
  return useQuery({
    queryKey: ["help-full-content"],
    queryFn: async () => {
      const [chaptersRes, sectionsRes, faqsRes] = await Promise.all([
        supabase.from("help_chapters").select("*").order("order_index"),
        supabase.from("help_sections").select("*").order("order_index"),
        supabase.from("help_faqs").select("*").order("order_index"),
      ]);

      if (chaptersRes.error) throw chaptersRes.error;
      if (sectionsRes.error) throw sectionsRes.error;
      if (faqsRes.error) throw faqsRes.error;

      const chapters = chaptersRes.data as HelpChapter[];
      const sections = sectionsRes.data as HelpSection[];
      const faqs = faqsRes.data as HelpFaq[];

      return chapters.map((chapter) => ({
        ...chapter,
        sections: sections.filter((s) => s.chapter_id === chapter.id),
        faqs: faqs.filter((f) => f.chapter_id === chapter.id),
      })) as HelpChapterWithSections[];
    },
  });
}

export function useHelpFeedback() {
  const queryClient = useQueryClient();

  const submitFeedback = useMutation({
    mutationFn: async ({
      sectionId,
      isHelpful,
    }: {
      sectionId: string;
      isHelpful: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("help_feedback")
        .upsert(
          {
            section_id: sectionId,
            user_id: user.id,
            is_helpful: isHelpful,
          },
          { onConflict: "section_id,user_id" }
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["help-feedback"] });
    },
  });

  return { submitFeedback };
}

export function useHelpSearch(searchTerm: string) {
  return useQuery({
    queryKey: ["help-search", searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];

      const [chaptersRes, sectionsRes, faqsRes] = await Promise.all([
        supabase
          .from("help_chapters")
          .select("*")
          .ilike("title", `%${searchTerm}%`),
        supabase
          .from("help_sections")
          .select("*, help_chapters!inner(slug, title)")
          .or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`),
        supabase
          .from("help_faqs")
          .select("*, help_chapters!inner(slug, title)")
          .or(`question.ilike.%${searchTerm}%,answer.ilike.%${searchTerm}%`),
      ]);

      type SectionWithChapter = HelpSection & { help_chapters: { slug: string; title: string } };
      type FaqWithChapter = HelpFaq & { help_chapters: { slug: string; title: string } };

      const results: Array<{
        type: 'chapter' | 'section' | 'faq';
        title: string;
        preview: string;
        chapterSlug: string;
        sectionSlug?: string;
      }> = [];

      // Add chapter results
      (chaptersRes.data || []).forEach((chapter: HelpChapter) => {
        results.push({
          type: 'chapter',
          title: chapter.title,
          preview: `Capítulo ${chapter.order_index}`,
          chapterSlug: chapter.slug,
        });
      });

      // Add section results
      (sectionsRes.data || []).forEach((section: SectionWithChapter) => {
        const preview = section.content
          .replace(/[#*`]/g, '')
          .substring(0, 100) + '...';
        results.push({
          type: 'section',
          title: section.title,
          preview,
          chapterSlug: section.help_chapters.slug,
          sectionSlug: section.slug,
        });
      });

      // Add FAQ results
      (faqsRes.data || []).forEach((faq: FaqWithChapter) => {
        results.push({
          type: 'faq',
          title: faq.question,
          preview: faq.answer.substring(0, 100) + '...',
          chapterSlug: faq.help_chapters.slug,
          sectionSlug: 'faq',
        });
      });

      return results.slice(0, 10);
    },
    enabled: searchTerm.length >= 2,
  });
}
