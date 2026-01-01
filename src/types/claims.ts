// =====================================================
// TIPOS DO MÓDULO DE SINISTROS (CLAIMS)
// =====================================================

// Status público (visível para imobiliárias)
export type ClaimPublicStatus = 
  | 'solicitado'
  | 'em_analise_tecnica'
  | 'pagamento_programado'
  | 'finalizado';

// Status interno (operação de cobrança)
export type ClaimInternalStatus = 
  | 'aguardando_analise'
  | 'cobranca_amigavel'
  | 'notificacao_extrajudicial'
  | 'acordo_realizado'
  | 'juridico_acionado'
  | 'encerrado';

// Categorias de itens
export type ClaimItemCategory = 
  | 'aluguel'
  | 'condominio'
  | 'iptu'
  | 'luz'
  | 'agua'
  | 'gas'
  | 'danos'
  | 'limpeza'
  | 'pintura'
  | 'multa_contratual'
  | 'outros';

// Tipos de arquivo
export type ClaimFileType = 
  | 'boleto'
  | 'contrato'
  | 'vistoria'
  | 'notificacao'
  | 'acordo'
  | 'comprovante'
  | 'outros';

// =====================================================
// INTERFACES PRINCIPAIS
// =====================================================

export interface Claim {
  id: string;
  analysis_id: string;
  agency_id: string;
  created_by: string;
  public_status: ClaimPublicStatus;
  internal_status: ClaimInternalStatus;
  total_claimed_value: number;
  observations: string | null;
  canceled_at: string | null;
  canceled_by: string | null;
  created_at: string;
  updated_at: string;
  // Relações opcionais (quando join é feito)
  analysis?: {
    inquilino_nome: string;
    inquilino_cpf: string;
    imovel_endereco: string;
    imovel_cidade: string;
    imovel_estado: string;
    valor_aluguel: number;
  };
  agency?: {
    nome_fantasia: string | null;
    razao_social: string;
  };
  creator?: {
    full_name: string;
    email: string;
  };
}

export interface ClaimItem {
  id: string;
  claim_id: string;
  category: ClaimItemCategory;
  description: string | null;
  reference_period: string;
  due_date: string;
  amount: number;
  created_at: string;
  updated_at: string;
}

export interface ClaimFile {
  id: string;
  claim_id: string;
  file_path: string;
  file_name: string;
  file_size: number;
  file_type: ClaimFileType;
  description: string | null;
  uploaded_by: string;
  created_at: string;
  // Relação opcional
  uploader?: {
    full_name: string;
  };
}

export interface ClaimStatusHistory {
  id: string;
  claim_id: string;
  status_type: 'public' | 'internal';
  old_status: string | null;
  new_status: string;
  changed_by: string;
  observations: string | null;
  created_at: string;
  // Relação opcional
  changer?: {
    full_name: string;
  };
}

// =====================================================
// INPUTS PARA MUTATIONS
// =====================================================

export interface CreateClaimInput {
  analysis_id: string;
  agency_id: string;
  observations?: string;
}

export interface CreateClaimItemInput {
  claim_id: string;
  category: ClaimItemCategory;
  description?: string;
  reference_period: string;
  due_date: string;
  amount: number;
}

export interface UpdateClaimItemInput {
  id: string;
  category?: ClaimItemCategory;
  description?: string;
  reference_period?: string;
  due_date?: string;
  amount?: number;
}

export interface CreateClaimFileInput {
  claim_id: string;
  file_path: string;
  file_name: string;
  file_size: number;
  file_type: ClaimFileType;
  description?: string;
}

export interface UpdateClaimStatusInput {
  id: string;
  public_status?: ClaimPublicStatus;
  internal_status?: ClaimInternalStatus;
  observations?: string;
}

// =====================================================
// CONFIGURAÇÃO DE UI
// =====================================================

export const claimPublicStatusConfig: Record<ClaimPublicStatus, { label: string; color: string; bgColor: string }> = {
  solicitado: { 
    label: 'Solicitado', 
    color: 'text-yellow-700', 
    bgColor: 'bg-yellow-100' 
  },
  em_analise_tecnica: { 
    label: 'Em Análise Técnica', 
    color: 'text-blue-700', 
    bgColor: 'bg-blue-100' 
  },
  pagamento_programado: { 
    label: 'Pagamento Programado', 
    color: 'text-purple-700', 
    bgColor: 'bg-purple-100' 
  },
  finalizado: { 
    label: 'Finalizado', 
    color: 'text-green-700', 
    bgColor: 'bg-green-100' 
  },
};

export const claimInternalStatusConfig: Record<ClaimInternalStatus, { label: string; color: string; bgColor: string }> = {
  aguardando_analise: { 
    label: 'Aguardando Análise', 
    color: 'text-gray-700', 
    bgColor: 'bg-gray-100' 
  },
  cobranca_amigavel: { 
    label: 'Cobrança Amigável', 
    color: 'text-orange-700', 
    bgColor: 'bg-orange-100' 
  },
  notificacao_extrajudicial: { 
    label: 'Notificação Extrajudicial', 
    color: 'text-red-700', 
    bgColor: 'bg-red-100' 
  },
  acordo_realizado: { 
    label: 'Acordo Realizado', 
    color: 'text-teal-700', 
    bgColor: 'bg-teal-100' 
  },
  juridico_acionado: { 
    label: 'Jurídico Acionado', 
    color: 'text-rose-700', 
    bgColor: 'bg-rose-100' 
  },
  encerrado: { 
    label: 'Encerrado', 
    color: 'text-slate-700', 
    bgColor: 'bg-slate-100' 
  },
};

export const claimItemCategoryConfig: Record<ClaimItemCategory, { label: string; icon?: string }> = {
  aluguel: { label: 'Aluguel' },
  condominio: { label: 'Condomínio' },
  iptu: { label: 'IPTU' },
  luz: { label: 'Luz' },
  agua: { label: 'Água' },
  gas: { label: 'Gás' },
  danos: { label: 'Danos ao Imóvel' },
  limpeza: { label: 'Limpeza' },
  pintura: { label: 'Pintura' },
  multa_contratual: { label: 'Multa Contratual' },
  outros: { label: 'Outros' },
};

export const claimFileTypeConfig: Record<ClaimFileType, { label: string }> = {
  boleto: { label: 'Boleto' },
  contrato: { label: 'Contrato' },
  vistoria: { label: 'Vistoria' },
  notificacao: { label: 'Notificação' },
  acordo: { label: 'Acordo' },
  comprovante: { label: 'Comprovante' },
  outros: { label: 'Outros' },
};

// Listas para selects/dropdowns
export const claimPublicStatusList = Object.entries(claimPublicStatusConfig).map(([value, config]) => ({
  value: value as ClaimPublicStatus,
  label: config.label,
}));

export const claimInternalStatusList = Object.entries(claimInternalStatusConfig).map(([value, config]) => ({
  value: value as ClaimInternalStatus,
  label: config.label,
}));

export const claimItemCategoryList = Object.entries(claimItemCategoryConfig).map(([value, config]) => ({
  value: value as ClaimItemCategory,
  label: config.label,
}));

export const claimFileTypeList = Object.entries(claimFileTypeConfig).map(([value, config]) => ({
  value: value as ClaimFileType,
  label: config.label,
}));
