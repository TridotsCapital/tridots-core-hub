-- Add plan field to analyses
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS plano_garantia TEXT 
  CHECK (plano_garantia IN ('start', 'prime', 'exclusive'));

-- Migrate existing data based on rate
UPDATE analyses
SET plano_garantia = CASE
  WHEN taxa_garantia_percentual >= 15 THEN 'exclusive'
  WHEN taxa_garantia_percentual >= 13 THEN 'prime'
  ELSE 'start'
END
WHERE plano_garantia IS NULL;

-- Add new columns to commissions for traceability
ALTER TABLE commissions 
  ADD COLUMN IF NOT EXISTS base_calculo NUMERIC,
  ADD COLUMN IF NOT EXISTS percentual_comissao NUMERIC,
  ADD COLUMN IF NOT EXISTS due_date DATE;

-- Add new status value to commission_status enum
ALTER TYPE commission_status ADD VALUE IF NOT EXISTS 'a_pagar';

-- Remove legacy field from agencies (commission is now determined by plan)
ALTER TABLE agencies DROP COLUMN IF EXISTS percentual_comissao_recorrente;