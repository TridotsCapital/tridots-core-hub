-- Add new status 'vencido' to contract_status enum
-- This needs to be in a separate transaction before being used
ALTER TYPE public.contract_status ADD VALUE IF NOT EXISTS 'vencido';