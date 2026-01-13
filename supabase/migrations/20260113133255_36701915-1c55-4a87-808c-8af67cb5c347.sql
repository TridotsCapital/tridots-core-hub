-- Add internal_observations column to agencies table
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS internal_observations TEXT;

-- Create internal_notes table for Tridots internal notes
CREATE TABLE public.internal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_type TEXT NOT NULL CHECK (reference_type IN ('analysis', 'contract', 'claim')),
  reference_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient lookups
CREATE INDEX idx_internal_notes_reference ON public.internal_notes(reference_type, reference_id);
CREATE INDEX idx_internal_notes_created_at ON public.internal_notes(created_at);

-- Enable RLS
ALTER TABLE public.internal_notes ENABLE ROW LEVEL SECURITY;

-- RLS: Only internal users (master, analyst) can manage notes
CREATE POLICY "Internal users can view notes"
  ON public.internal_notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('master', 'analyst')
    )
  );

CREATE POLICY "Internal users can insert notes"
  ON public.internal_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('master', 'analyst')
    )
  );

CREATE POLICY "Internal users can update own notes"
  ON public.internal_notes FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('master', 'analyst')
    )
  );

CREATE POLICY "Internal users can delete own notes"
  ON public.internal_notes FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('master', 'analyst')
    )
  );