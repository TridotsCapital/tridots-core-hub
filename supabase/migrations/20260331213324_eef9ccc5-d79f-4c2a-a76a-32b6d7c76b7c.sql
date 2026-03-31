
-- 1. claims → contracts: NO ACTION → CASCADE
ALTER TABLE public.claims DROP CONSTRAINT IF EXISTS claims_contract_id_fkey;
ALTER TABLE public.claims
  ADD CONSTRAINT claims_contract_id_fkey
  FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;

-- 2. guarantee_installments → contracts: RESTRICT → CASCADE
ALTER TABLE public.guarantee_installments DROP CONSTRAINT IF EXISTS guarantee_installments_contract_id_fkey;
ALTER TABLE public.guarantee_installments
  ADD CONSTRAINT guarantee_installments_contract_id_fkey
  FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;

-- 3. invoice_items → contracts: RESTRICT → CASCADE
ALTER TABLE public.invoice_items DROP CONSTRAINT IF EXISTS invoice_items_contract_id_fkey;
ALTER TABLE public.invoice_items
  ADD CONSTRAINT invoice_items_contract_id_fkey
  FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;

-- 4. commissions → analyses: RESTRICT → CASCADE
ALTER TABLE public.commissions DROP CONSTRAINT IF EXISTS commissions_analysis_id_fkey;
ALTER TABLE public.commissions
  ADD CONSTRAINT commissions_analysis_id_fkey
  FOREIGN KEY (analysis_id) REFERENCES public.analyses(id) ON DELETE CASCADE;

-- 5. contracts → analyses: RESTRICT → CASCADE
ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_analysis_id_fkey;
ALTER TABLE public.contracts
  ADD CONSTRAINT contracts_analysis_id_fkey
  FOREIGN KEY (analysis_id) REFERENCES public.analyses(id) ON DELETE CASCADE;
