-- Corrigir search_path das funções criadas
CREATE OR REPLACE FUNCTION calculate_next_business_day(target_date date)
RETURNS date
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  result_date date := target_date;
BEGIN
  IF EXTRACT(DOW FROM result_date) = 6 THEN
    result_date := result_date + INTERVAL '2 days';
  ELSIF EXTRACT(DOW FROM result_date) = 0 THEN
    result_date := result_date + INTERVAL '1 day';
  END IF;
  RETURN result_date;
END;
$$;

CREATE OR REPLACE FUNCTION calculate_first_installment_date(
  activation_date date,
  billing_due_day smallint
)
RETURNS date
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  activation_day smallint;
  first_due_date date;
BEGIN
  activation_day := EXTRACT(DAY FROM activation_date);
  
  IF activation_day < billing_due_day THEN
    first_due_date := make_date(
      EXTRACT(YEAR FROM activation_date)::integer,
      EXTRACT(MONTH FROM activation_date)::integer,
      billing_due_day
    );
  ELSE
    first_due_date := make_date(
      EXTRACT(YEAR FROM activation_date)::integer,
      EXTRACT(MONTH FROM activation_date)::integer,
      billing_due_day
    ) + INTERVAL '1 month';
  END IF;
  
  RETURN calculate_next_business_day(first_due_date);
END;
$$;