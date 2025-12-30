-- Add percentage field for Tridots guarantee fee on each analysis
ALTER TABLE public.analyses 
ADD COLUMN IF NOT EXISTS taxa_garantia_percentual numeric NOT NULL DEFAULT 8;

-- Add comment explaining the field
COMMENT ON COLUMN public.analyses.taxa_garantia_percentual IS 'Percentage of rent charged as Tridots guarantee fee (e.g., 8 means 8%)';

-- Create a view for financial dashboard aggregations
CREATE OR REPLACE VIEW public.financial_summary AS
SELECT 
  DATE_TRUNC('month', c.created_at) as mes,
  c.type,
  c.status,
  SUM(c.valor) as total_valor,
  COUNT(*) as quantidade
FROM public.commissions c
GROUP BY DATE_TRUNC('month', c.created_at), c.type, c.status;

-- Enable RLS on the view through underlying table (already done on commissions)