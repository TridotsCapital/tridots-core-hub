-- ========================================
-- FASE 1: Sistema de Faturamento Unificado (Boleto Imobiliaria)
-- ========================================

-- 1. Criar ENUMs
CREATE TYPE billing_status AS ENUM ('em_dia', 'atrasada', 'bloqueada');
CREATE TYPE invoice_status AS ENUM ('rascunho', 'gerada', 'enviada', 'atrasada', 'paga', 'cancelada');
CREATE TYPE installment_status AS ENUM ('pendente', 'faturada', 'paga', 'cancelada');
CREATE TYPE invoice_event_type AS ENUM ('created', 'edited', 'sent', 'payment_registered', 'canceled', 'note_added');
CREATE TYPE payment_method AS ENUM ('pix', 'card', 'boleto_imobiliaria');

-- 2. Modificar tabela agencies
ALTER TABLE agencies 
  ADD COLUMN IF NOT EXISTS billing_due_day smallint CHECK (billing_due_day IN (5, 10, 15)),
  ADD COLUMN IF NOT EXISTS billing_status billing_status DEFAULT 'em_dia',
  ADD COLUMN IF NOT EXISTS billing_blocked_at timestamptz;

-- 3. Modificar tabela contracts
ALTER TABLE contracts 
  ADD COLUMN IF NOT EXISTS payment_method payment_method;

-- 4. Criar tabela agency_invoices (Faturas)
CREATE TABLE public.agency_invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE RESTRICT,
  reference_month smallint NOT NULL CHECK (reference_month BETWEEN 1 AND 12),
  reference_year smallint NOT NULL CHECK (reference_year >= 2024),
  status invoice_status NOT NULL DEFAULT 'rascunho',
  total_value numeric NOT NULL DEFAULT 0,
  adjusted_value numeric,
  due_date date NOT NULL,
  boleto_url text,
  boleto_barcode text,
  paid_at timestamptz,
  paid_value numeric,
  payment_proof_url text,
  payment_notes text,
  paid_by uuid,
  sent_at timestamptz,
  sent_by uuid,
  canceled_at timestamptz,
  canceled_by uuid,
  replacement_invoice_id uuid REFERENCES agency_invoices(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agency_id, reference_month, reference_year, status)
);

-- 5. Criar tabela guarantee_installments (Parcelas da Garantia)
CREATE TABLE public.guarantee_installments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE RESTRICT,
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE RESTRICT,
  installment_number smallint NOT NULL CHECK (installment_number BETWEEN 1 AND 12),
  reference_month smallint NOT NULL CHECK (reference_month BETWEEN 1 AND 12),
  reference_year smallint NOT NULL CHECK (reference_year >= 2024),
  value numeric NOT NULL,
  status installment_status NOT NULL DEFAULT 'pendente',
  due_date date NOT NULL,
  invoice_item_id uuid,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (contract_id, installment_number)
);

-- 6. Criar tabela invoice_items (Itens da Fatura)
CREATE TABLE public.invoice_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id uuid NOT NULL REFERENCES agency_invoices(id) ON DELETE CASCADE,
  installment_id uuid REFERENCES guarantee_installments(id) ON DELETE SET NULL,
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE RESTRICT,
  tenant_name text NOT NULL,
  property_address text NOT NULL,
  installment_number smallint NOT NULL,
  value numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Adicionar FK de invoice_items em guarantee_installments
ALTER TABLE guarantee_installments 
  ADD CONSTRAINT guarantee_installments_invoice_item_id_fkey 
  FOREIGN KEY (invoice_item_id) REFERENCES invoice_items(id) ON DELETE SET NULL;

-- 7. Criar tabela invoice_timeline (Histórico da Fatura)
CREATE TABLE public.invoice_timeline (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id uuid NOT NULL REFERENCES agency_invoices(id) ON DELETE CASCADE,
  event_type invoice_event_type NOT NULL,
  description text NOT NULL,
  user_id uuid,
  attachment_url text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. Criar índices para performance
CREATE INDEX idx_agency_invoices_agency_id ON agency_invoices(agency_id);
CREATE INDEX idx_agency_invoices_status ON agency_invoices(status);
CREATE INDEX idx_agency_invoices_due_date ON agency_invoices(due_date);
CREATE INDEX idx_agency_invoices_reference ON agency_invoices(reference_year, reference_month);

CREATE INDEX idx_guarantee_installments_contract_id ON guarantee_installments(contract_id);
CREATE INDEX idx_guarantee_installments_agency_id ON guarantee_installments(agency_id);
CREATE INDEX idx_guarantee_installments_status ON guarantee_installments(status);
CREATE INDEX idx_guarantee_installments_reference ON guarantee_installments(reference_year, reference_month);

CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_contract_id ON invoice_items(contract_id);

CREATE INDEX idx_invoice_timeline_invoice_id ON invoice_timeline(invoice_id);

-- 9. Habilitar RLS em todas as tabelas
ALTER TABLE agency_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE guarantee_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_timeline ENABLE ROW LEVEL SECURITY;

-- 10. Políticas RLS para agency_invoices
CREATE POLICY "Team members can view all invoices"
  ON agency_invoices FOR SELECT
  USING (has_any_role(auth.uid()));

CREATE POLICY "Team members can create invoices"
  ON agency_invoices FOR INSERT
  WITH CHECK (has_any_role(auth.uid()));

CREATE POLICY "Team members can update invoices"
  ON agency_invoices FOR UPDATE
  USING (has_any_role(auth.uid()));

CREATE POLICY "Agency users can view their invoices"
  ON agency_invoices FOR SELECT
  USING (agency_id = get_user_agency_id(auth.uid()));

-- 11. Políticas RLS para guarantee_installments
CREATE POLICY "Team members can view all installments"
  ON guarantee_installments FOR SELECT
  USING (has_any_role(auth.uid()));

CREATE POLICY "Team members can manage installments"
  ON guarantee_installments FOR ALL
  USING (has_any_role(auth.uid()));

CREATE POLICY "Agency users can view their installments"
  ON guarantee_installments FOR SELECT
  USING (agency_id = get_user_agency_id(auth.uid()));

-- 12. Políticas RLS para invoice_items
CREATE POLICY "Team members can view all invoice items"
  ON invoice_items FOR SELECT
  USING (has_any_role(auth.uid()));

CREATE POLICY "Team members can manage invoice items"
  ON invoice_items FOR ALL
  USING (has_any_role(auth.uid()));

CREATE POLICY "Agency users can view their invoice items"
  ON invoice_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM agency_invoices ai
    WHERE ai.id = invoice_items.invoice_id
    AND ai.agency_id = get_user_agency_id(auth.uid())
  ));

-- 13. Políticas RLS para invoice_timeline
CREATE POLICY "Team members can view all timeline"
  ON invoice_timeline FOR SELECT
  USING (has_any_role(auth.uid()));

CREATE POLICY "Team members can insert timeline events"
  ON invoice_timeline FOR INSERT
  WITH CHECK (has_any_role(auth.uid()));

CREATE POLICY "Agency users can view their invoice timeline"
  ON invoice_timeline FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM agency_invoices ai
    WHERE ai.id = invoice_timeline.invoice_id
    AND ai.agency_id = get_user_agency_id(auth.uid())
  ));

-- 14. Trigger para updated_at em agency_invoices
CREATE TRIGGER update_agency_invoices_updated_at
  BEFORE UPDATE ON agency_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 15. Função para calcular próximo dia útil (considerando fins de semana)
CREATE OR REPLACE FUNCTION calculate_next_business_day(target_date date)
RETURNS date
LANGUAGE plpgsql
AS $$
DECLARE
  result_date date := target_date;
BEGIN
  -- Se sábado, move para segunda
  IF EXTRACT(DOW FROM result_date) = 6 THEN
    result_date := result_date + INTERVAL '2 days';
  -- Se domingo, move para segunda
  ELSIF EXTRACT(DOW FROM result_date) = 0 THEN
    result_date := result_date + INTERVAL '1 day';
  END IF;
  
  RETURN result_date;
END;
$$;

-- 16. Função para calcular a data da primeira parcela baseado na regra de corte
CREATE OR REPLACE FUNCTION calculate_first_installment_date(
  activation_date date,
  billing_due_day smallint
)
RETURNS date
LANGUAGE plpgsql
AS $$
DECLARE
  activation_day smallint;
  first_due_date date;
BEGIN
  activation_day := EXTRACT(DAY FROM activation_date);
  
  -- Regra de corte: se ativado antes do dia de vencimento, primeira parcela no mesmo mês
  IF activation_day < billing_due_day THEN
    first_due_date := make_date(
      EXTRACT(YEAR FROM activation_date)::integer,
      EXTRACT(MONTH FROM activation_date)::integer,
      billing_due_day
    );
  ELSE
    -- Se ativado no dia ou depois, primeira parcela no próximo mês
    first_due_date := make_date(
      EXTRACT(YEAR FROM activation_date)::integer,
      EXTRACT(MONTH FROM activation_date)::integer,
      billing_due_day
    ) + INTERVAL '1 month';
  END IF;
  
  -- Ajusta para próximo dia útil se necessário
  RETURN calculate_next_business_day(first_due_date);
END;
$$;