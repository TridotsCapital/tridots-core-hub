-- Tabela para metrificar cliques na opção bloqueada
CREATE TABLE public.payment_option_interest_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
  user_id UUID,
  option_key TEXT NOT NULL DEFAULT 'boleto_imobiliaria',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.payment_option_interest_clicks ENABLE ROW LEVEL SECURITY;

-- Política: qualquer usuário autenticado pode inserir
CREATE POLICY "Authenticated users can insert interest clicks"
ON public.payment_option_interest_clicks
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política: masters podem visualizar todos os cliques
CREATE POLICY "Masters can view all interest clicks"
ON public.payment_option_interest_clicks
FOR SELECT
USING (public.has_role(auth.uid(), 'master'));

-- Adicionar novo valor ao enum de status público
ALTER TYPE public.claim_public_status ADD VALUE IF NOT EXISTS 'exoneracao_despejo';

-- Adicionar novo valor ao enum de status interno
ALTER TYPE public.claim_internal_status ADD VALUE IF NOT EXISTS 'exoneracao_despejo_interno';