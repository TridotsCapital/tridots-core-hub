-- Indexes for commissions table
CREATE INDEX IF NOT EXISTS idx_commissions_agency_id ON public.commissions(agency_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON public.commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_due_date ON public.commissions(due_date);
CREATE INDEX IF NOT EXISTS idx_commissions_mes_ano ON public.commissions(mes_referencia, ano_referencia);

-- Indexes for analyses table
CREATE INDEX IF NOT EXISTS idx_analyses_agency_id ON public.analyses(agency_id);
CREATE INDEX IF NOT EXISTS idx_analyses_status ON public.analyses(status);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON public.analyses(created_at);

-- Indexes for contracts table
CREATE INDEX IF NOT EXISTS idx_contracts_agency_id ON public.contracts(agency_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_payment_method ON public.contracts(payment_method);

-- Indexes for agency_invoices table
CREATE INDEX IF NOT EXISTS idx_agency_invoices_agency_id ON public.agency_invoices(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_invoices_status ON public.agency_invoices(status);
CREATE INDEX IF NOT EXISTS idx_agency_invoices_due_date ON public.agency_invoices(due_date);

-- Indexes for profiles table (user_id is already PK, but role and agency lookups are common)
CREATE INDEX IF NOT EXISTS idx_guarantee_installments_contract_id ON public.guarantee_installments(contract_id);
CREATE INDEX IF NOT EXISTS idx_guarantee_installments_status ON public.guarantee_installments(status);
CREATE INDEX IF NOT EXISTS idx_guarantee_installments_due_date ON public.guarantee_installments(due_date);