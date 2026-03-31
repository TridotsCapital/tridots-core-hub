ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_claim_id_fkey;

ALTER TABLE public.tickets
  ADD CONSTRAINT tickets_claim_id_fkey
  FOREIGN KEY (claim_id)
  REFERENCES public.claims(id)
  ON DELETE SET NULL;