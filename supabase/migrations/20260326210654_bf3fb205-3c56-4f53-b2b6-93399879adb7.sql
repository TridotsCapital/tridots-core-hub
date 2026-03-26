
-- ETAPA 1: Corrigir valores de Nathaniely e Gislaine

UPDATE analyses
SET valor_aluguel = 1465.82,
    garantia_anual = ROUND(1465.82 * 12 * 10.0 / 100, 2),
    updated_at = now()
WHERE id = '6f552368-6c3e-475a-bae5-ed477b4ceb55';

UPDATE analyses
SET valor_aluguel = 762.30,
    garantia_anual = ROUND(762.30 * 12 * 10.0 / 100, 2),
    updated_at = now()
WHERE id = '5f3b5421-0688-4914-824e-824977ce2ed0';

UPDATE guarantee_installments
SET value = ROUND(1758.98 / 12.0, 2)
WHERE contract_id = '844217a0-0467-4b15-ac9e-1fabf3c886cc';

UPDATE guarantee_installments
SET value = ROUND(914.76 / 12.0, 2)
WHERE contract_id = '078fbdad-b873-4232-bc71-7e17b4e2c6d2';

UPDATE invoice_items
SET value = ROUND(1758.98 / 12.0, 2)
WHERE contract_id = '844217a0-0467-4b15-ac9e-1fabf3c886cc';

UPDATE invoice_items
SET value = ROUND(914.76 / 12.0, 2)
WHERE contract_id = '078fbdad-b873-4232-bc71-7e17b4e2c6d2';

-- ETAPA 2: Remover duplicados - redirect installments to kept item
UPDATE guarantee_installments gi
SET invoice_item_id = kept.min_id
FROM (
  SELECT invoice_id, contract_id, installment_number, MIN(id::text)::uuid as min_id
  FROM invoice_items
  GROUP BY invoice_id, contract_id, installment_number
  HAVING COUNT(*) > 1
) kept
JOIN invoice_items ii ON ii.invoice_id = kept.invoice_id
  AND ii.contract_id = kept.contract_id
  AND ii.installment_number = kept.installment_number
  AND ii.id != kept.min_id
WHERE gi.invoice_item_id = ii.id;

-- Delete duplicates (keep oldest by id::text sort)
DELETE FROM invoice_items
WHERE id IN (
  SELECT ii.id
  FROM invoice_items ii
  JOIN (
    SELECT invoice_id, contract_id, installment_number, MIN(id::text)::uuid as min_id
    FROM invoice_items
    GROUP BY invoice_id, contract_id, installment_number
    HAVING COUNT(*) > 1
  ) dups ON ii.invoice_id = dups.invoice_id
    AND ii.contract_id = dups.contract_id
    AND ii.installment_number = dups.installment_number
    AND ii.id != dups.min_id
);

-- ETAPA 3: Recalcular totais das faturas
UPDATE agency_invoices ai
SET total_value = sub.real_total, updated_at = now()
FROM (
  SELECT invoice_id, SUM(value) as real_total
  FROM invoice_items GROUP BY invoice_id
) sub
WHERE ai.id = sub.invoice_id AND ai.status != 'paga' AND ai.total_value != sub.real_total;

-- ETAPA 4: Auditoria
INSERT INTO analysis_timeline (analysis_id, event_type, description, metadata)
VALUES
  ('6f552368-6c3e-475a-bae5-ed477b4ceb55', 'value_correction',
   'Correção: valor_aluguel 1.307,75→1.465,82, garantia_anual 1.465,82→1.758,98',
   '{"old_valor_aluguel": 1307.75, "new_valor_aluguel": 1465.82, "old_garantia_anual": 1465.82, "new_garantia_anual": 1758.98}'::jsonb),
  ('5f3b5421-0688-4914-824e-824977ce2ed0', 'value_correction',
   'Correção: valor_aluguel 740,10→762,30, garantia_anual 762,30→914,76',
   '{"old_valor_aluguel": 740.10, "new_valor_aluguel": 762.30, "old_garantia_anual": 762.30, "new_garantia_anual": 914.76}'::jsonb);

-- ETAPA 5: UNIQUE constraint
ALTER TABLE invoice_items
ADD CONSTRAINT invoice_items_unique_invoice_contract_installment
UNIQUE (invoice_id, contract_id, installment_number);
