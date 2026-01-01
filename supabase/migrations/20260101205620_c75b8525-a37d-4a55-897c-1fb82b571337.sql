-- Add column to link tickets to analyses/contracts
ALTER TABLE public.tickets 
ADD COLUMN analysis_id uuid REFERENCES public.analyses(id) ON DELETE SET NULL;

-- Index for performance
CREATE INDEX idx_tickets_analysis_id ON public.tickets(analysis_id);

-- Comment for documentation
COMMENT ON COLUMN public.tickets.analysis_id IS 'Optional reference to linked contract/analysis';