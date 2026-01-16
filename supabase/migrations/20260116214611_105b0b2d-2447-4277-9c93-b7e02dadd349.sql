-- Gerar comissões para contratos existentes que não possuem registros na tabela commissions
-- Setup commission (100% do setup fee)
INSERT INTO commissions (analysis_id, agency_id, type, status, valor, base_calculo, percentual_comissao, due_date, mes_referencia, ano_referencia)
SELECT 
  a.id as analysis_id,
  a.agency_id,
  'setup'::commission_type as type,
  (CASE 
    WHEN c.created_at::date <= CURRENT_DATE THEN 'a_pagar'
    ELSE 'pendente'
  END)::commission_status as status,
  a.setup_fee as valor,
  a.setup_fee as base_calculo,
  100 as percentual_comissao,
  c.created_at::date as due_date,
  EXTRACT(MONTH FROM c.created_at)::integer as mes_referencia,
  EXTRACT(YEAR FROM c.created_at)::integer as ano_referencia
FROM contracts c
JOIN analyses a ON a.id = c.analysis_id
WHERE NOT EXISTS (SELECT 1 FROM commissions WHERE analysis_id = a.id)
  AND a.setup_fee > 0
  AND NOT COALESCE(a.setup_fee_exempt, false);

-- 12 recurring commissions para cada contrato
INSERT INTO commissions (analysis_id, agency_id, type, status, valor, base_calculo, percentual_comissao, due_date, mes_referencia, ano_referencia)
SELECT 
  a.id as analysis_id,
  a.agency_id,
  'recorrente'::commission_type as type,
  (CASE 
    WHEN (c.created_at::date + (n || ' months')::interval)::date <= CURRENT_DATE THEN 'a_pagar'
    ELSE 'pendente'
  END)::commission_status as status,
  (COALESCE(a.garantia_anual, 0) * 
    CASE COALESCE(a.plano_garantia, 'start')
      WHEN 'start' THEN 0.05
      WHEN 'prime' THEN 0.10
      WHEN 'exclusive' THEN 0.15
      ELSE 0.05
    END
  ) / 12 as valor,
  COALESCE(a.garantia_anual, 0) as base_calculo,
  (CASE COALESCE(a.plano_garantia, 'start')
    WHEN 'start' THEN 5
    WHEN 'prime' THEN 10
    WHEN 'exclusive' THEN 15
    ELSE 5
  END)::numeric as percentual_comissao,
  (c.created_at::date + (n || ' months')::interval)::date as due_date,
  EXTRACT(MONTH FROM (c.created_at::date + (n || ' months')::interval))::integer as mes_referencia,
  EXTRACT(YEAR FROM (c.created_at::date + (n || ' months')::interval))::integer as ano_referencia
FROM contracts c
JOIN analyses a ON a.id = c.analysis_id
CROSS JOIN generate_series(1, 12) as n
WHERE NOT EXISTS (SELECT 1 FROM commissions WHERE analysis_id = a.id AND type = 'recorrente');