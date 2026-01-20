-- Create help_chapters table
CREATE TABLE public.help_chapters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_index INTEGER NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'BookOpen',
  is_new BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create help_sections table
CREATE TABLE public.help_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_id UUID NOT NULL REFERENCES public.help_chapters(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  tips JSONB DEFAULT '[]'::jsonb,
  warnings JSONB DEFAULT '[]'::jsonb,
  see_also JSONB DEFAULT '[]'::jsonb,
  portal_links JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(chapter_id, slug)
);

-- Create help_faqs table
CREATE TABLE public.help_faqs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_id UUID NOT NULL REFERENCES public.help_chapters(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create help_media table
CREATE TABLE public.help_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID NOT NULL REFERENCES public.help_sections(id) ON DELETE CASCADE,
  placeholder_id TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('screenshot', 'video')),
  file_path TEXT,
  caption TEXT,
  video_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(section_id, placeholder_id)
);

-- Create help_glossary table
CREATE TABLE public.help_glossary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  term TEXT NOT NULL UNIQUE,
  definition TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create help_feedback table
CREATE TABLE public.help_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID NOT NULL REFERENCES public.help_sections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(section_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.help_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_glossary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_feedback ENABLE ROW LEVEL SECURITY;

-- RLS: Authenticated users can read all help content
CREATE POLICY "Authenticated users can read help chapters"
ON public.help_chapters FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read help sections"
ON public.help_sections FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read help faqs"
ON public.help_faqs FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read help media"
ON public.help_media FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read help glossary"
ON public.help_glossary FOR SELECT
USING (auth.uid() IS NOT NULL);

-- RLS: Team members can manage all help content
CREATE POLICY "Team members can manage help chapters"
ON public.help_chapters FOR ALL
USING (public.has_any_role(auth.uid()));

CREATE POLICY "Team members can manage help sections"
ON public.help_sections FOR ALL
USING (public.has_any_role(auth.uid()));

CREATE POLICY "Team members can manage help faqs"
ON public.help_faqs FOR ALL
USING (public.has_any_role(auth.uid()));

CREATE POLICY "Team members can manage help media"
ON public.help_media FOR ALL
USING (public.has_any_role(auth.uid()));

CREATE POLICY "Team members can manage help glossary"
ON public.help_glossary FOR ALL
USING (public.has_any_role(auth.uid()));

-- RLS: Users can submit their own feedback (upsert)
CREATE POLICY "Users can insert feedback"
ON public.help_feedback FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own feedback"
ON public.help_feedback FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Team members can view all feedback"
ON public.help_feedback FOR SELECT
USING (public.has_any_role(auth.uid()) OR user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_help_sections_chapter ON public.help_sections(chapter_id);
CREATE INDEX idx_help_faqs_chapter ON public.help_faqs(chapter_id);
CREATE INDEX idx_help_media_section ON public.help_media(section_id);
CREATE INDEX idx_help_feedback_section ON public.help_feedback(section_id);

-- Create updated_at triggers
CREATE TRIGGER update_help_chapters_updated_at
  BEFORE UPDATE ON public.help_chapters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_help_sections_updated_at
  BEFORE UPDATE ON public.help_sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_help_faqs_updated_at
  BEFORE UPDATE ON public.help_faqs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_help_media_updated_at
  BEFORE UPDATE ON public.help_media
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_help_glossary_updated_at
  BEFORE UPDATE ON public.help_glossary
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for help assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('help-assets', 'help-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for help-assets bucket
CREATE POLICY "Help assets are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'help-assets');

CREATE POLICY "Team members can upload help assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'help-assets' AND public.has_any_role(auth.uid()));

CREATE POLICY "Team members can update help assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'help-assets' AND public.has_any_role(auth.uid()));

CREATE POLICY "Team members can delete help assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'help-assets' AND public.has_any_role(auth.uid()));