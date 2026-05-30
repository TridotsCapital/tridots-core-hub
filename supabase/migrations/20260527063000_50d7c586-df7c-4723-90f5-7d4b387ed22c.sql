-- Migration: criar tabela short_urls para receber dados de url_curtas (legado GarantFacil)
-- Data: 2026-05-27
-- Autor: Migração GarantFacil → Tridots
-- Necessidade: P0 — preservar links de aceite ativos em circulação no cutover

-- ============================================================================
-- 1. Tabela
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.short_urls (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT NOT NULL UNIQUE,
  target_url   TEXT NOT NULL,
  legacy_id    INTEGER UNIQUE,                              -- rastreabilidade pós-migração
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  agency_id    UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
  expires_at   TIMESTAMPTZ,                                 -- NULL = nunca expira
  click_count  INTEGER NOT NULL DEFAULT 0,
  metadata     JSONB DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_short_urls_slug ON public.short_urls(slug);
CREATE INDEX IF NOT EXISTS idx_short_urls_legacy_id ON public.short_urls(legacy_id) WHERE legacy_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_short_urls_agency_id ON public.short_urls(agency_id) WHERE agency_id IS NOT NULL;

-- ============================================================================
-- 2. RLS
-- ============================================================================

ALTER TABLE public.short_urls ENABLE ROW LEVEL SECURITY;

-- Slugs são públicos (precisam resolver sem auth — caso do inquilino abrindo link)
CREATE POLICY "Public can resolve slugs"
  ON public.short_urls
  FOR SELECT
  USING (true);

-- Masters podem ver tudo, criar, atualizar, deletar
CREATE POLICY "Masters can manage short_urls"
  ON public.short_urls
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'master'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'master'
    )
  );

-- Agency users podem criar slugs da própria agência (uso normal)
CREATE POLICY "Agency users can create their own short_urls"
  ON public.short_urls
  FOR INSERT
  WITH CHECK (
    agency_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.agency_users
      WHERE user_id = auth.uid() AND agency_id = short_urls.agency_id
    )
  );

-- Agency users podem ver slugs da própria agência (administrar links próprios)
CREATE POLICY "Agency users can view their own short_urls"
  ON public.short_urls
  FOR SELECT
  USING (
    agency_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.agency_users
      WHERE user_id = auth.uid() AND agency_id = short_urls.agency_id
    )
  );

-- ============================================================================
-- 3. Trigger de updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_short_urls_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_short_urls_updated_at
  BEFORE UPDATE ON public.short_urls
  FOR EACH ROW
  EXECUTE FUNCTION public.update_short_urls_updated_at();

-- ============================================================================
-- 4. Função pra incrementar click_count atomicamente
-- ============================================================================

CREATE OR REPLACE FUNCTION public.increment_short_url_click(p_slug TEXT)
RETURNS TEXT AS $$
DECLARE
  v_target TEXT;
BEGIN
  UPDATE public.short_urls
    SET click_count = click_count + 1
    WHERE slug = p_slug
      AND (expires_at IS NULL OR expires_at > now())
    RETURNING target_url INTO v_target;
  RETURN v_target;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.increment_short_url_click(TEXT) TO anon, authenticated;

-- ============================================================================
-- 5. Comentários
-- ============================================================================

COMMENT ON TABLE public.short_urls IS
  'URL shortener — herdeiro de url_curtas do GarantFacil legado. Preserva links de aceite de inquilino em circulação.';
COMMENT ON COLUMN public.short_urls.slug IS
  'Slug curto (ex: ab12cd). UNIQUE. Para slugs migrados do legado, valor é o uuid original.';
COMMENT ON COLUMN public.short_urls.legacy_id IS
  'ID original em url_curtas.id do legado. NULL para slugs criados pós-migração.';
