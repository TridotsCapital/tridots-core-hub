// Types for the TRIDOTS CAPITAL system

export type AppRole = 'master' | 'analyst' | 'agency_user';

export interface AgencyUser {
  id: string;
  user_id: string;
  agency_id: string;
  is_primary_contact: boolean;
  created_at: string;
}

export type AnalysisStatus = 'pendente' | 'em_analise' | 'aprovada' | 'reprovada' | 'cancelada' | 'aguardando_pagamento' | 'ativo';

export type CommissionStatus = 'pendente' | 'a_pagar' | 'paga' | 'cancelada' | 'estornada';

export type PlanType = 'start' | 'prime' | 'exclusive';

export type CommissionType = 'setup' | 'recorrente';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Agency {
  id: string;
  cnpj: string;
  razao_social: string;
  nome_fantasia: string | null;
  email: string;
  telefone: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  responsavel_nome: string;
  responsavel_email: string | null;
  responsavel_telefone: string | null;
  percentual_comissao_setup: number;
  desconto_pix_percentual: number | null;
  active: boolean;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Analysis {
  id: string;
  agency_id: string;
  analyst_id: string | null;
  status: AnalysisStatus;
  
  // Tenant data
  inquilino_nome: string;
  inquilino_cpf: string;
  inquilino_rg: string | null;
  inquilino_data_nascimento: string | null;
  inquilino_email: string | null;
  inquilino_telefone: string | null;
  inquilino_profissao: string | null;
  inquilino_renda_mensal: number | null;
  inquilino_empresa: string | null;
  
  // Spouse data
  conjuge_nome: string | null;
  conjuge_cpf: string | null;
  conjuge_rg: string | null;
  conjuge_data_nascimento: string | null;
  conjuge_profissao: string | null;
  conjuge_renda_mensal: number | null;
  conjuge_empresa: string | null;
  
  // Property data
  imovel_endereco: string;
  imovel_numero: string | null;
  imovel_complemento: string | null;
  imovel_bairro: string | null;
  imovel_cidade: string;
  imovel_estado: string;
  imovel_cep: string | null;
  imovel_tipo: string | null;
  imovel_proprietario_nome: string | null;
  imovel_proprietario_cpf_cnpj: string | null;
  
  // Values
  valor_aluguel: number;
  valor_condominio: number | null;
  valor_iptu: number | null;
  valor_outros_encargos: number | null;
  valor_total: number;
  setup_fee: number;
  taxa_garantia_percentual: number;
  forma_pagamento_preferida: string | null;
  plano_garantia: PlanType | null;
  garantia_anual: number | null;
  
  observacoes: string | null;
  
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  rejected_at: string | null;
  canceled_at: string | null;
  
  // New fields for tenant journey
  rate_adjusted_by_tridots: boolean;
  original_taxa_garantia_percentual: number | null;
  acceptance_token: string | null;
  acceptance_token_expires_at: string | null;
  acceptance_token_used_at: string | null;
  payer_name: string | null;
  payer_cpf: string | null;
  payer_email: string | null;
  payer_phone: string | null;
  payer_address: string | null;
  payer_number: string | null;
  payer_complement: string | null;
  payer_neighborhood: string | null;
  payer_city: string | null;
  payer_state: string | null;
  payer_cep: string | null;
  payer_is_tenant: boolean;
  identity_photo_path: string | null;
  terms_accepted_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_checkout_session_id: string | null;
  payment_confirmed_at: string | null;
  payment_failed_at: string | null;
  payment_retry_count: number;
  rejection_reason: string | null;
  setup_fee_exempt: boolean;
  
  // Manual payment flow fields
  setup_payment_link: string | null;
  guarantee_payment_link: string | null;
  setup_payment_confirmed_at: string | null;
  setup_payment_receipt_path: string | null;
  guarantee_payment_confirmed_at: string | null;
  guarantee_payment_receipt_path: string | null;
  payments_validated_at: string | null;
  payments_validated_by: string | null;
  payments_rejected_at: string | null;
  payments_rejection_reason: string | null;
  
  // Joined data
  agency?: Agency;
  analyst?: Profile;
}

export interface Commission {
  id: string;
  analysis_id: string;
  agency_id: string;
  type: CommissionType;
  status: CommissionStatus;
  valor: number;
  mes_referencia: number | null;
  ano_referencia: number | null;
  data_pagamento: string | null;
  data_estorno: string | null;
  observacoes: string | null;
  base_calculo: number | null;
  percentual_comissao: number | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  
  // Joined data
  analysis?: Analysis;
  agency?: Agency;
}

export interface ChatMessage {
  id: string;
  analysis_id: string;
  sender_id: string;
  message: string;
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_size: number | null;
  created_at: string;
  
  // Joined data
  sender?: Profile;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  
  // Joined data
  user?: Profile;
}

// Status display configuration
export const statusConfig: Record<AnalysisStatus, { label: string; class: string }> = {
  pendente: { label: 'Pendente', class: 'status-pendente' },
  em_analise: { label: 'Em Análise', class: 'status-em_analise' },
  aprovada: { label: 'Ativa', class: 'status-aprovada' },
  reprovada: { label: 'Reprovada', class: 'status-reprovada' },
  cancelada: { label: 'Cancelada', class: 'status-cancelada' },
  aguardando_pagamento: { label: 'Aguardando Pagamento', class: 'status-aguardando_pagamento' },
  ativo: { label: 'Ativo', class: 'status-ativo' },
};

// Kanban column order - Updated for new flow
// Removed 'ativo' - after payment, analysis goes to 'aprovada' and creates a contract
export const kanbanColumns: AnalysisStatus[] = [
  'pendente',
  'em_analise',
  'aguardando_pagamento',
  'aprovada',
  'reprovada',
];

// Contract status type
export type ContractStatus = 'documentacao_pendente' | 'ativo' | 'cancelado' | 'encerrado';

export const contractStatusConfig: Record<ContractStatus, { label: string; class: string }> = {
  documentacao_pendente: { label: 'Documentação Pendente', class: 'status-pendente' },
  ativo: { label: 'Ativo', class: 'status-ativo' },
  cancelado: { label: 'Cancelado', class: 'status-cancelada' },
  encerrado: { label: 'Encerrado', class: 'status-reprovada' },
};

// Document validation status type
export type DocumentValidationStatus = 'pendente' | 'enviado' | 'aprovado' | 'rejeitado';

// Contract interface
export interface Contract {
  id: string;
  analysis_id: string;
  agency_id: string;
  status: ContractStatus;
  doc_contrato_locacao_path: string | null;
  doc_contrato_locacao_name: string | null;
  doc_contrato_locacao_uploaded_at: string | null;
  doc_contrato_locacao_status: DocumentValidationStatus;
  doc_contrato_locacao_feedback: string | null;
  doc_vistoria_inicial_path: string | null;
  doc_vistoria_inicial_name: string | null;
  doc_vistoria_inicial_uploaded_at: string | null;
  doc_vistoria_inicial_status: DocumentValidationStatus;
  doc_vistoria_inicial_feedback: string | null;
  doc_seguro_incendio_path: string | null;
  doc_seguro_incendio_name: string | null;
  doc_seguro_incendio_uploaded_at: string | null;
  doc_seguro_incendio_status: DocumentValidationStatus;
  doc_seguro_incendio_feedback: string | null;
  activated_at: string | null;
  activated_by: string | null;
  canceled_at: string | null;
  canceled_by: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  
  // Joined data
  analysis?: Analysis;
  agency?: Agency;
}

// Rejection reason categories
export type RejectionCategory = 'renda_insuficiente' | 'restricoes_cadastrais' | 'documentacao' | 'outros';

export const rejectionCategories: Record<RejectionCategory, { label: string; description: string }> = {
  renda_insuficiente: { 
    label: 'Renda insuficiente', 
    description: 'Renda não atende aos critérios mínimos' 
  },
  restricoes_cadastrais: { 
    label: 'Restrições cadastrais', 
    description: 'SPC, Serasa, processos judiciais ou pendências' 
  },
  documentacao: { 
    label: 'Documentação', 
    description: 'Documentos incompletos, inválidos ou inconsistentes' 
  },
  outros: { 
    label: 'Outros', 
    description: 'Motivo não listado acima' 
  },
};

// Analysis timeline event type
export interface AnalysisTimelineEvent {
  id: string;
  analysis_id: string;
  event_type: string;
  description: string;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  
  // Joined data
  creator?: Profile;
}

// Analysis document type
export interface AnalysisDocument {
  id: string;
  analysis_id: string;
  uploaded_by: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string | null;
  created_at: string;
}

export const commissionStatusConfig: Record<CommissionStatus, { label: string; class: string }> = {
  pendente: { label: 'Pendente', class: 'status-pendente' },
  a_pagar: { label: 'A Pagar', class: 'status-aguardando_pagamento' },
  paga: { label: 'Paga', class: 'status-aprovada' },
  cancelada: { label: 'Cancelada', class: 'status-cancelada' },
  estornada: { label: 'Estornada', class: 'status-reprovada' },
};
