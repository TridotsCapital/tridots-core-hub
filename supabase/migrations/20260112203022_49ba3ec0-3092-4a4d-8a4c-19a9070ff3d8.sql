-- Add PIX discount percentage to agencies (required for activation)
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS desconto_pix_percentual NUMERIC DEFAULT NULL;

-- Add secondary phone and preferred payment method to analyses
ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS inquilino_telefone_secundario TEXT;
ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS forma_pagamento_preferida TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.agencies.desconto_pix_percentual IS 'Percentual de desconto para pagamento via PIX. Obrigatório para ativar a imobiliária.';
COMMENT ON COLUMN public.analyses.inquilino_telefone_secundario IS 'Telefone secundário do inquilino (WhatsApp)';
COMMENT ON COLUMN public.analyses.forma_pagamento_preferida IS 'Forma de pagamento preferida: pix, card_1x, card_2x...card_12x';