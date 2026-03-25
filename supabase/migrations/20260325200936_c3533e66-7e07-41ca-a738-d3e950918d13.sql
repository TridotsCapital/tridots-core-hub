
-- 1. Retroactive fix: revert installments marked as 'paga' when linked invoice is NOT paid
UPDATE guarantee_installments gi
SET status = 'faturada', paid_at = NULL
FROM invoice_items ii
JOIN agency_invoices ai ON ai.id = ii.invoice_id
WHERE gi.invoice_item_id = ii.id
  AND gi.status = 'paga'
  AND ai.status != 'paga';

-- 2. Validation trigger to prevent future occurrences
CREATE OR REPLACE FUNCTION public.validate_installment_paid_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'paga' AND NEW.invoice_item_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM invoice_items ii
      JOIN agency_invoices ai ON ai.id = ii.invoice_id
      WHERE ii.id = NEW.invoice_item_id AND ai.status = 'paga'
    ) THEN
      RAISE EXCEPTION 'Cannot mark installment as paid when linked invoice is not paid';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Attach trigger to guarantee_installments
DROP TRIGGER IF EXISTS trg_validate_installment_paid_status ON guarantee_installments;
CREATE TRIGGER trg_validate_installment_paid_status
  BEFORE INSERT OR UPDATE ON guarantee_installments
  FOR EACH ROW
  EXECUTE FUNCTION validate_installment_paid_status();
