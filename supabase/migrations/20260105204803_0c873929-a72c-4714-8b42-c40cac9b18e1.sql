-- Add payment link and confirmation fields to analyses table
ALTER TABLE public.analyses 
ADD COLUMN IF NOT EXISTS setup_payment_link TEXT,
ADD COLUMN IF NOT EXISTS guarantee_payment_link TEXT,
ADD COLUMN IF NOT EXISTS setup_payment_confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS setup_payment_receipt_path TEXT,
ADD COLUMN IF NOT EXISTS guarantee_payment_confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS guarantee_payment_receipt_path TEXT,
ADD COLUMN IF NOT EXISTS payments_validated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payments_validated_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS payments_rejected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payments_rejection_reason TEXT;