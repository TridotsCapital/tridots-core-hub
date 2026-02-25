-- Set default billing_due_day = 10 for all agencies that have NULL
UPDATE public.agencies SET billing_due_day = 10 WHERE billing_due_day IS NULL;

-- Add NOT NULL constraint with default for future inserts
ALTER TABLE public.agencies ALTER COLUMN billing_due_day SET DEFAULT 10;