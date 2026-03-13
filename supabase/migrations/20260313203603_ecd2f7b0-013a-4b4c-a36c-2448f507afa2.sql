CREATE OR REPLACE FUNCTION public.calculate_first_installment_date(activation_date date, billing_due_day smallint)
 RETURNS date
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  first_due_date date;
BEGIN
  -- REGRA: Primeira parcela SEMPRE no mês seguinte à ativação
  first_due_date := make_date(
    EXTRACT(YEAR FROM activation_date)::integer,
    EXTRACT(MONTH FROM activation_date)::integer,
    billing_due_day
  ) + INTERVAL '1 month';

  RETURN calculate_next_business_day(first_due_date);
END;
$function$;