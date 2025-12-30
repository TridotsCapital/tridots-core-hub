-- Drop the security definer view and recreate with proper security
DROP VIEW IF EXISTS public.financial_summary;

-- Create a secure function instead for financial aggregations
CREATE OR REPLACE FUNCTION public.get_financial_summary(
  start_date timestamp with time zone DEFAULT NULL,
  end_date timestamp with time zone DEFAULT NULL
)
RETURNS TABLE (
  mes timestamp with time zone,
  tipo text,
  status text,
  total_valor numeric,
  quantidade bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    DATE_TRUNC('month', c.created_at) as mes,
    c.type::text as tipo,
    c.status::text as status,
    SUM(c.valor) as total_valor,
    COUNT(*) as quantidade
  FROM public.commissions c
  WHERE 
    (start_date IS NULL OR c.created_at >= start_date)
    AND (end_date IS NULL OR c.created_at <= end_date)
  GROUP BY DATE_TRUNC('month', c.created_at), c.type, c.status
  ORDER BY mes DESC;
$$;