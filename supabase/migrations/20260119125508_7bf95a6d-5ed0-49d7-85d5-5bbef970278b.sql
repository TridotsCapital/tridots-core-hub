-- Adicionar coluna de controle de visibilidade no Drive de Documentos
ALTER TABLE public.term_templates 
ADD COLUMN visible_in_agency_drive BOOLEAN NOT NULL DEFAULT true;

-- Comentário explicativo
COMMENT ON COLUMN public.term_templates.visible_in_agency_drive 
IS 'Controla se o template aparece no Drive de Documentos das imobiliárias. False para termos internos ou exclusivos do onboarding.';