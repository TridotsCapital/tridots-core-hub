-- Add document validation fields to contracts table
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS doc_contrato_locacao_status TEXT DEFAULT 'pendente',
ADD COLUMN IF NOT EXISTS doc_contrato_locacao_feedback TEXT,
ADD COLUMN IF NOT EXISTS doc_vistoria_inicial_status TEXT DEFAULT 'pendente',
ADD COLUMN IF NOT EXISTS doc_vistoria_inicial_feedback TEXT,
ADD COLUMN IF NOT EXISTS doc_seguro_incendio_status TEXT DEFAULT 'pendente',
ADD COLUMN IF NOT EXISTS doc_seguro_incendio_feedback TEXT;

-- Add check constraints for valid statuses
ALTER TABLE public.contracts 
ADD CONSTRAINT doc_contrato_locacao_status_check 
CHECK (doc_contrato_locacao_status IN ('pendente', 'enviado', 'aprovado', 'rejeitado'));

ALTER TABLE public.contracts 
ADD CONSTRAINT doc_vistoria_inicial_status_check 
CHECK (doc_vistoria_inicial_status IN ('pendente', 'enviado', 'aprovado', 'rejeitado'));

ALTER TABLE public.contracts 
ADD CONSTRAINT doc_seguro_incendio_status_check 
CHECK (doc_seguro_incendio_status IN ('pendente', 'enviado', 'aprovado', 'rejeitado'));

-- Add comment for documentation
COMMENT ON COLUMN public.contracts.doc_contrato_locacao_status IS 'Status de validação: pendente, enviado, aprovado, rejeitado';
COMMENT ON COLUMN public.contracts.doc_contrato_locacao_feedback IS 'Feedback da equipe Tridots quando rejeitado';
COMMENT ON COLUMN public.contracts.doc_vistoria_inicial_status IS 'Status de validação: pendente, enviado, aprovado, rejeitado';
COMMENT ON COLUMN public.contracts.doc_vistoria_inicial_feedback IS 'Feedback da equipe Tridots quando rejeitado';
COMMENT ON COLUMN public.contracts.doc_seguro_incendio_status IS 'Status de validação: pendente, enviado, aprovado, rejeitado';
COMMENT ON COLUMN public.contracts.doc_seguro_incendio_feedback IS 'Feedback da equipe Tridots quando rejeitado';