-- Add garantia_anual column to store the final calculated annual guarantee value
-- This includes any discounts (e.g., PIX 5% off) applied at submission time
ALTER TABLE public.analyses ADD COLUMN garantia_anual NUMERIC;