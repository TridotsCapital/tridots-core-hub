
-- Add deleted_link_info to tickets for preserving link context after cascade delete
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS deleted_link_info jsonb DEFAULT NULL;

COMMENT ON COLUMN public.tickets.deleted_link_info IS 'Stores info about deleted linked entity (analysis/contract/claim). Format: { entity_type, entity_id, deleted_at, deleted_by, tenant_name }';
