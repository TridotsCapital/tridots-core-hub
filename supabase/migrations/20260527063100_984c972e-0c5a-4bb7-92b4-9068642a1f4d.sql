-- Migration: adicionar legacy_id em 8 tabelas para rastreabilidade pós-migração
-- Data: 2026-05-27
-- Autor: Migração GarantFacil → Tridots
-- Necessidade: rastreabilidade + idempotência do ETL (UPSERT por legacy_id)

-- ============================================================================
-- profiles: rastreia users.id do legado
-- ============================================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS legacy_id BIGINT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_legacy_id
  ON public.profiles(legacy_id) WHERE legacy_id IS NOT NULL;

COMMENT ON COLUMN public.profiles.legacy_id IS
  'users.id no MySQL legado GarantFacil. NULL para usuários criados pós-migração.';

-- ============================================================================
-- agencies: rastreia master_user_id distinct do legado (quando virou agency)
-- ============================================================================
ALTER TABLE public.agencies
  ADD COLUMN IF NOT EXISTS legacy_master_user_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_agencies_legacy_master_user_id
  ON public.agencies(legacy_master_user_id) WHERE legacy_master_user_id IS NOT NULL;

COMMENT ON COLUMN public.agencies.legacy_master_user_id IS
  'users.master_user_id no legado que originou esta agency. NULL para agencies criadas pós-migração.';

-- ============================================================================
-- analyses: rastreia analises.id do legado
-- ============================================================================
ALTER TABLE public.analyses
  ADD COLUMN IF NOT EXISTS legacy_id BIGINT,
  ADD COLUMN IF NOT EXISTS legacy_metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS imovel_tag TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_analyses_legacy_id
  ON public.analyses(legacy_id) WHERE legacy_id IS NOT NULL;

COMMENT ON COLUMN public.analyses.legacy_id IS
  'analises.id no MySQL legado GarantFacil.';
COMMENT ON COLUMN public.analyses.legacy_metadata IS
  'Dados livres do legado que não têm coluna dedicada (ex: inquilinos.dados_adicionais, flags raras). Não é fonte de verdade pós-migração.';
COMMENT ON COLUMN public.analyses.imovel_tag IS
  'imoveis.tag do legado (campo livre pouco usado).';

-- ============================================================================
-- contracts: rastreia analises.id do legado (porque contracts deriva de analise aprovada)
-- ============================================================================
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS legacy_analise_id BIGINT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_contracts_legacy_analise_id
  ON public.contracts(legacy_analise_id) WHERE legacy_analise_id IS NOT NULL;

COMMENT ON COLUMN public.contracts.legacy_analise_id IS
  'analises.id no legado. Cada contrato pós-migração corresponde a uma analise aprovada/ativa do legado.';

-- ============================================================================
-- digital_acceptances: rastreia analises.id do legado (aceites históricos)
-- ============================================================================
ALTER TABLE public.digital_acceptances
  ADD COLUMN IF NOT EXISTS legacy_analise_id BIGINT;

CREATE INDEX IF NOT EXISTS idx_digital_acceptances_legacy_analise_id
  ON public.digital_acceptances(legacy_analise_id) WHERE legacy_analise_id IS NOT NULL;

COMMENT ON COLUMN public.digital_acceptances.legacy_analise_id IS
  'analises.id no legado quando termosAceitos=true.';

-- ============================================================================
-- analysis_documents: rastreia files.id do legado
-- ============================================================================
ALTER TABLE public.analysis_documents
  ADD COLUMN IF NOT EXISTS legacy_id BIGINT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_analysis_documents_legacy_id
  ON public.analysis_documents(legacy_id) WHERE legacy_id IS NOT NULL;

COMMENT ON COLUMN public.analysis_documents.legacy_id IS
  'files.id no legado.';

-- ============================================================================
-- analysis_timeline: rastreia historicos.id do legado (eventos públicos)
-- ============================================================================
ALTER TABLE public.analysis_timeline
  ADD COLUMN IF NOT EXISTS legacy_id BIGINT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_analysis_timeline_legacy_id
  ON public.analysis_timeline(legacy_id) WHERE legacy_id IS NOT NULL;

COMMENT ON COLUMN public.analysis_timeline.legacy_id IS
  'historicos.id no legado (subset particionado em "público").';

-- ============================================================================
-- audit_logs: rastreia historicos.id do legado (eventos sensíveis)
-- ============================================================================
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS legacy_id BIGINT;

CREATE INDEX IF NOT EXISTS idx_audit_logs_legacy_id
  ON public.audit_logs(legacy_id) WHERE legacy_id IS NOT NULL;

COMMENT ON COLUMN public.audit_logs.legacy_id IS
  'historicos.id no legado (subset particionado em "sensível"). Não-único: pode ter retenção parcial.';

-- ============================================================================
-- guarantee_installments: rastreia parcelas.id do legado
-- ============================================================================
ALTER TABLE public.guarantee_installments
  ADD COLUMN IF NOT EXISTS legacy_id BIGINT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_guarantee_installments_legacy_id
  ON public.guarantee_installments(legacy_id) WHERE legacy_id IS NOT NULL;

COMMENT ON COLUMN public.guarantee_installments.legacy_id IS
  'parcelas.id no legado.';

-- ============================================================================
-- Tabela de tracking centralizada (substitui múltiplos legacy_id se preferir)
-- (opcional — mantém os legacy_id distribuídos acima como source-of-truth)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.migration_tracking (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_table  TEXT NOT NULL,
  legacy_id     BIGINT NOT NULL,
  new_table     TEXT NOT NULL,
  new_id        UUID NOT NULL,
  migrated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  checksum      TEXT,
  metadata      JSONB DEFAULT '{}'::jsonb,
  UNIQUE(legacy_table, legacy_id)
);

CREATE INDEX IF NOT EXISTS idx_migration_tracking_lookup
  ON public.migration_tracking(legacy_table, legacy_id);
CREATE INDEX IF NOT EXISTS idx_migration_tracking_new
  ON public.migration_tracking(new_table, new_id);

ALTER TABLE public.migration_tracking ENABLE ROW LEVEL SECURITY;

-- Só masters veem essa tabela (é interna do ETL)
CREATE POLICY "Only masters can view migration_tracking"
  ON public.migration_tracking
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'master'
    )
  );

COMMENT ON TABLE public.migration_tracking IS
  'Tracking centralizado da migração GarantFacil → Tridots. Permite idempotência do ETL e reconciliação. Pode ser arquivado 1 ano pós-cutover.';
