-- Create table for renewal notification history
CREATE TABLE public.renewal_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
  renewal_id uuid REFERENCES public.contract_renewals(id) ON DELETE SET NULL,
  channel text NOT NULL CHECK (channel IN ('email', 'whatsapp', 'both')),
  sent_by uuid NOT NULL,
  sent_at timestamptz DEFAULT now(),
  recipient_name text,
  recipient_email text,
  recipient_phone text,
  message_preview text,
  status text DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'clicked')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.renewal_notifications ENABLE ROW LEVEL SECURITY;

-- Policy for Tridots users (master/analyst) to manage all notifications
CREATE POLICY "Tridots users can manage all renewal notifications"
ON public.renewal_notifications
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('master', 'analyst')
  )
);

-- Policy for agency users to view notifications for their contracts
CREATE POLICY "Agency users can view their contract renewal notifications"
ON public.renewal_notifications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.contracts c
    JOIN public.agency_users au ON au.agency_id = c.agency_id
    WHERE c.id = contract_id
    AND au.user_id = auth.uid()
  )
);

-- Add index for faster queries
CREATE INDEX idx_renewal_notifications_contract_id ON public.renewal_notifications(contract_id);
CREATE INDEX idx_renewal_notifications_renewal_id ON public.renewal_notifications(renewal_id);
CREATE INDEX idx_renewal_notifications_sent_at ON public.renewal_notifications(sent_at DESC);