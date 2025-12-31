-- Function for agency ranking (returns position without revealing other agencies)
CREATE OR REPLACE FUNCTION public.get_agency_ranking(_agency_id UUID)
RETURNS TABLE(ranking_position INT, total_agencies INT, total_commissions NUMERIC)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    WITH agency_totals AS (
        SELECT 
            agency_id,
            COALESCE(SUM(valor), 0) as total
        FROM public.commissions
        WHERE status = 'paga'
        GROUP BY agency_id
    ),
    ranked AS (
        SELECT 
            agency_id,
            total,
            ROW_NUMBER() OVER (ORDER BY total DESC) as pos
        FROM agency_totals
    )
    SELECT 
        r.pos::INT as ranking_position,
        (SELECT COUNT(*)::INT FROM public.agencies WHERE active = true) as total_agencies,
        r.total as total_commissions
    FROM ranked r
    WHERE r.agency_id = _agency_id
$$;

-- Function for agency projection (estimates next 3 months based on active contracts)
CREATE OR REPLACE FUNCTION public.get_agency_projection(_agency_id UUID)
RETURNS TABLE(monthly_projection NUMERIC, contracts_count BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        COALESCE(SUM(
            (a.valor_aluguel * a.taxa_garantia_percentual / 100) * 
            (ag.percentual_comissao_recorrente / 100)
        ), 0) as monthly_projection,
        COUNT(*) as contracts_count
    FROM public.analyses a
    JOIN public.agencies ag ON ag.id = a.agency_id
    WHERE a.agency_id = _agency_id
    AND a.status = 'ativo'
$$;

-- Function for agency approval rate
CREATE OR REPLACE FUNCTION public.get_agency_approval_rate(_agency_id UUID)
RETURNS TABLE(approved BIGINT, total BIGINT, rate NUMERIC)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        COUNT(*) FILTER (WHERE status IN ('aprovada', 'aguardando_pagamento', 'ativo')) as approved,
        COUNT(*) as total,
        CASE 
            WHEN COUNT(*) > 0 
            THEN ROUND((COUNT(*) FILTER (WHERE status IN ('aprovada', 'aguardando_pagamento', 'ativo'))::NUMERIC / COUNT(*)::NUMERIC) * 100, 1)
            ELSE 0
        END as rate
    FROM public.analyses
    WHERE agency_id = _agency_id
    AND created_at >= NOW() - INTERVAL '1 year'
$$;