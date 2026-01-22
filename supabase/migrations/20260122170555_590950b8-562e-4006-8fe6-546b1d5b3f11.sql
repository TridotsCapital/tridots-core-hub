-- Add unique constraint on help_media for upsert (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'help_media_section_placeholder_unique'
  ) THEN
    ALTER TABLE public.help_media 
    ADD CONSTRAINT help_media_section_placeholder_unique 
    UNIQUE (section_id, placeholder_id);
  END IF;
END $$;