-- Change record_id to TEXT since not all tables use UUID as primary key
ALTER TABLE public.audit_logs ALTER COLUMN record_id TYPE text USING record_id::text;