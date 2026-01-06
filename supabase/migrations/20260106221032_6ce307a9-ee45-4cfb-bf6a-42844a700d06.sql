-- Add payment date columns to analyses table
ALTER TABLE public.analyses
ADD COLUMN IF NOT EXISTS setup_payment_date DATE,
ADD COLUMN IF NOT EXISTS guarantee_payment_date DATE;

COMMENT ON COLUMN public.analyses.setup_payment_date IS 'Data efetiva do pagamento da taxa setup, informada pela Tridots';
COMMENT ON COLUMN public.analyses.guarantee_payment_date IS 'Data efetiva do pagamento da garantia, informada pela Tridots';