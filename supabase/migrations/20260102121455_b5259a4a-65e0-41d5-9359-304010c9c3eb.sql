-- Table for manual collection notes/actions
CREATE TABLE public.claim_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  note_type TEXT NOT NULL DEFAULT 'observacao',
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.claim_notes ENABLE ROW LEVEL SECURITY;

-- Policies for claim_notes
CREATE POLICY "Team members can view all claim notes"
ON public.claim_notes FOR SELECT
USING (has_any_role(auth.uid()));

CREATE POLICY "Team members can create claim notes"
ON public.claim_notes FOR INSERT
WITH CHECK (has_any_role(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Masters can delete claim notes"
ON public.claim_notes FOR DELETE
USING (is_master(auth.uid()));

-- Add document checklist fields to claims table
ALTER TABLE public.claims
ADD COLUMN IF NOT EXISTS docs_checklist JSONB DEFAULT '{"contrato": false, "boletos": false, "notificacao": false, "vistoria": false, "acordo": false}'::jsonb,
ADD COLUMN IF NOT EXISTS last_internal_status_change_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.profiles(id);

-- Create trigger to update last_internal_status_change_at when internal_status changes
CREATE OR REPLACE FUNCTION public.update_claim_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.internal_status IS DISTINCT FROM NEW.internal_status THEN
    NEW.last_internal_status_change_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_claim_internal_status_timestamp
BEFORE UPDATE ON public.claims
FOR EACH ROW
EXECUTE FUNCTION public.update_claim_status_timestamp();

-- Enable realtime for claim_notes
ALTER PUBLICATION supabase_realtime ADD TABLE public.claim_notes;