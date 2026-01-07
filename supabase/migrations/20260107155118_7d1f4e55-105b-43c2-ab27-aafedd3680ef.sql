-- Add explicit contract link to tickets so we can show the correct 'vínculo' badge
ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS contract_id uuid;

-- FK to contracts (optional link)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tickets_contract_id_fkey'
  ) THEN
    ALTER TABLE public.tickets
    ADD CONSTRAINT tickets_contract_id_fkey
    FOREIGN KEY (contract_id) REFERENCES public.contracts(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- Index for filtering
CREATE INDEX IF NOT EXISTS idx_tickets_contract_id ON public.tickets(contract_id);

-- Helpful composite index for common lookups
CREATE INDEX IF NOT EXISTS idx_tickets_contract_id_created_at ON public.tickets(contract_id, created_at DESC);