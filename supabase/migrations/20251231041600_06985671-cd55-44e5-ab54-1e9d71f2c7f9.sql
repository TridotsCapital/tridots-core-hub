-- Add setup fee commission percentage column to agencies table
ALTER TABLE public.agencies 
ADD COLUMN percentual_comissao_setup NUMERIC(5,2) NOT NULL DEFAULT 100;

COMMENT ON COLUMN public.agencies.percentual_comissao_setup 
IS 'Percentual da comissão de setup fee que a imobiliária recebe (0-100%)';