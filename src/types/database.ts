// Types for the TRIDOTS GARANTIA system

export type AppRole = 'master' | 'analyst';

export type AnalysisStatus = 'pendente' | 'em_analise' | 'aprovada' | 'reprovada' | 'cancelada';

export type CommissionStatus = 'pendente' | 'paga' | 'cancelada' | 'estornada';

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
  percentual_comissao_recorrente: number;
  active: boolean;
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
  
  observacoes: string | null;
  
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  rejected_at: string | null;
  canceled_at: string | null;
  
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
  aprovada: { label: 'Aprovada', class: 'status-aprovada' },
  reprovada: { label: 'Reprovada', class: 'status-reprovada' },
  cancelada: { label: 'Cancelada', class: 'status-cancelada' },
};

export const commissionStatusConfig: Record<CommissionStatus, { label: string; class: string }> = {
  pendente: { label: 'Pendente', class: 'status-pendente' },
  paga: { label: 'Paga', class: 'status-aprovada' },
  cancelada: { label: 'Cancelada', class: 'status-cancelada' },
  estornada: { label: 'Estornada', class: 'status-reprovada' },
};
