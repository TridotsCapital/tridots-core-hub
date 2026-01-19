-- Tabela para log de todos os e-mails enviados
CREATE TABLE public.email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_email TEXT NOT NULL,
  recipient_original TEXT,
  template_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  metadata JSONB DEFAULT '{}',
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar coluna para controle de relatório semanal de comissões
ALTER TABLE public.commissions ADD COLUMN IF NOT EXISTS report_sent_at TIMESTAMP WITH TIME ZONE;

-- Índices para performance
CREATE INDEX idx_email_logs_template_type ON public.email_logs(template_type);
CREATE INDEX idx_email_logs_status ON public.email_logs(status);
CREATE INDEX idx_email_logs_created_at ON public.email_logs(created_at DESC);
CREATE INDEX idx_commissions_report_sent ON public.commissions(report_sent_at) WHERE report_sent_at IS NULL;

-- RLS para email_logs (apenas masters podem ver)
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Masters can view email logs"
  ON public.email_logs
  FOR SELECT
  USING (public.is_master(auth.uid()));

CREATE POLICY "Service role can insert email logs"
  ON public.email_logs
  FOR INSERT
  WITH CHECK (true);

-- Comentários para documentação
COMMENT ON TABLE public.email_logs IS 'Log de todos os e-mails enviados pelo sistema';
COMMENT ON COLUMN public.email_logs.recipient_original IS 'E-mail original do destinatário (usado em modo teste)';
COMMENT ON COLUMN public.email_logs.template_type IS 'Tipo do template: acceptance_link, renewal_reminder, payment_confirmation, contract_activated, agency_activation, commission_report, new_agency_pending';
COMMENT ON COLUMN public.commissions.report_sent_at IS 'Data/hora em que a comissão foi incluída no relatório semanal';