-- Criar tabela de modelos de termos com versionamento
CREATE TABLE public.term_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_type TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    uploaded_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de aceites digitais
CREATE TABLE public.digital_acceptances (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
    term_template_id UUID NOT NULL REFERENCES public.term_templates(id),
    accepted_by_name TEXT NOT NULL,
    accepted_by_cpf TEXT NOT NULL,
    accepted_by_email TEXT,
    ip_address INET NOT NULL,
    user_agent TEXT NOT NULL,
    geolocation_city TEXT,
    geolocation_state TEXT,
    geolocation_country TEXT,
    document_hash TEXT NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.term_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_acceptances ENABLE ROW LEVEL SECURITY;

-- Policies for term_templates (Masters only can manage)
CREATE POLICY "Masters can manage term templates"
ON public.term_templates
FOR ALL
USING (public.is_master(auth.uid()));

CREATE POLICY "Team members can view term templates"
ON public.term_templates
FOR SELECT
USING (public.has_any_role(auth.uid()));

-- Policies for digital_acceptances
CREATE POLICY "Team members can view acceptances"
ON public.digital_acceptances
FOR SELECT
USING (public.has_any_role(auth.uid()));

CREATE POLICY "Anyone can create acceptance"
ON public.digital_acceptances
FOR INSERT
WITH CHECK (true);

-- Storage bucket for term templates
INSERT INTO storage.buckets (id, name, public) 
VALUES ('term-templates', 'term-templates', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for term templates
CREATE POLICY "Masters can upload term templates"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'term-templates' AND public.is_master(auth.uid()));

CREATE POLICY "Masters can delete term templates"
ON storage.objects
FOR DELETE
USING (bucket_id = 'term-templates' AND public.is_master(auth.uid()));

CREATE POLICY "Team members can view term templates"
ON storage.objects
FOR SELECT
USING (bucket_id = 'term-templates' AND public.has_any_role(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_term_templates_updated_at
BEFORE UPDATE ON public.term_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();