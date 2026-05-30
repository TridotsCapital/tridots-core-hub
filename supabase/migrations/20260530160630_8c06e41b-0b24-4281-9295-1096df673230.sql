-- Função get_inadimplentes — retorna contratos com parcelas vencidas e não pagas
-- (P0.1 do plano de unificação GarantFacil → Tridots)
--
-- Parâmetros:
--   p_agency_id     UUID nullable — se setado, filtra por essa agency
--   p_atraso_min    INT  — número mínimo de dias de atraso (default 1)
--   p_atraso_max    INT  — máximo de dias de atraso (default 9999)
--   p_valor_min     NUMERIC — valor mínimo total em atraso (default 0)
--
-- Saída: 1 row por contrato com parcelas vencidas (não por parcela).
-- Cobertura cross-tenant: master vê tudo; agency_user só vê próprias agencies
-- via RLS implícita das views/tabelas relacionadas.

CREATE OR REPLACE FUNCTION public.get_inadimplentes(
  p_agency_id   UUID DEFAULT NULL,
  p_atraso_min  INT  DEFAULT 1,
  p_atraso_max  INT  DEFAULT 9999,
  p_valor_min   NUMERIC DEFAULT 0
)
RETURNS TABLE (
  contract_id          UUID,
  analysis_id          UUID,
  agency_id            UUID,
  agency_nome          TEXT,
  inquilino_nome       TEXT,
  inquilino_cpf        TEXT,
  inquilino_email      TEXT,
  inquilino_telefone   TEXT,
  imovel_endereco      TEXT,
  valor_aluguel        NUMERIC,
  qtd_parcelas_atraso  INT,
  valor_total_atraso   NUMERIC,
  dias_atraso_max      INT,
  primeira_parcela_atraso DATE,
  ultima_parcela_atraso   DATE,
  ultima_cobranca_at   TIMESTAMPTZ
) LANGUAGE sql STABLE AS $$
  SELECT
    c.id            AS contract_id,
    a.id            AS analysis_id,
    a.agency_id,
    ag.razao_social AS agency_nome,
    a.inquilino_nome,
    a.inquilino_cpf,
    a.inquilino_email,
    a.inquilino_telefone,
    a.imovel_endereco,
    a.valor_aluguel,
    COUNT(gi.id)::INT                                AS qtd_parcelas_atraso,
    SUM(gi.value)::NUMERIC                           AS valor_total_atraso,
    MAX( (CURRENT_DATE - gi.due_date) )::INT         AS dias_atraso_max,
    MIN(gi.due_date)::DATE                           AS primeira_parcela_atraso,
    MAX(gi.due_date)::DATE                           AS ultima_parcela_atraso,
    (
      SELECT MAX(created_at) FROM audit_logs al
       WHERE al.record_id = c.id::text
         AND al.action ILIKE '%cobranca%'
    )                                                AS ultima_cobranca_at
  FROM contracts c
  JOIN analyses  a  ON a.id = c.analysis_id
  JOIN agencies  ag ON ag.id = a.agency_id
  JOIN guarantee_installments gi ON gi.contract_id = c.id
 WHERE gi.status IN ('pendente', 'faturada')
   AND gi.paid_at IS NULL
   AND gi.due_date < CURRENT_DATE
   AND (CURRENT_DATE - gi.due_date) BETWEEN p_atraso_min AND p_atraso_max
   AND (p_agency_id IS NULL OR a.agency_id = p_agency_id)
 GROUP BY c.id, a.id, a.agency_id, ag.razao_social,
          a.inquilino_nome, a.inquilino_cpf, a.inquilino_email, a.inquilino_telefone,
          a.imovel_endereco, a.valor_aluguel
HAVING SUM(gi.value) >= p_valor_min
 ORDER BY MAX(CURRENT_DATE - gi.due_date) DESC, SUM(gi.value) DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_inadimplentes(UUID, INT, INT, NUMERIC) TO authenticated;

COMMENT ON FUNCTION public.get_inadimplentes IS
  'Lista contratos com parcelas vencidas e não pagas. Útil para cobrança e tomada de garantia. P0.1 plano migração GarantFacil → Tridots.';
