// Field labels for humanizing database field names
export const FIELD_LABELS: Record<string, string> = {
  // Common fields
  id: "ID",
  created_at: "Criado em",
  updated_at: "Atualizado em",
  status: "Status",
  email: "Email",
  phone: "Telefone",
  telefone: "Telefone",
  active: "Ativo",
  
  // Tenant/Inquilino fields
  inquilino_nome: "Nome do Inquilino",
  inquilino_cpf: "CPF do Inquilino",
  inquilino_rg: "RG do Inquilino",
  inquilino_email: "Email do Inquilino",
  inquilino_telefone: "Telefone do Inquilino",
  inquilino_data_nascimento: "Data de Nascimento do Inquilino",
  inquilino_renda_mensal: "Renda Mensal do Inquilino",
  inquilino_empresa: "Empresa do Inquilino",
  inquilino_profissao: "Profissão do Inquilino",
  
  // Spouse/Conjuge fields
  conjuge_nome: "Nome do Cônjuge",
  conjuge_cpf: "CPF do Cônjuge",
  conjuge_rg: "RG do Cônjuge",
  conjuge_data_nascimento: "Data de Nascimento do Cônjuge",
  conjuge_renda_mensal: "Renda Mensal do Cônjuge",
  conjuge_empresa: "Empresa do Cônjuge",
  conjuge_profissao: "Profissão do Cônjuge",
  
  // Property/Imovel fields
  imovel_endereco: "Endereço do Imóvel",
  imovel_numero: "Número do Imóvel",
  imovel_complemento: "Complemento",
  imovel_bairro: "Bairro",
  imovel_cidade: "Cidade do Imóvel",
  imovel_estado: "Estado do Imóvel",
  imovel_cep: "CEP do Imóvel",
  imovel_tipo: "Tipo de Imóvel",
  imovel_proprietario_nome: "Nome do Proprietário",
  imovel_proprietario_cpf_cnpj: "CPF/CNPJ do Proprietário",
  
  // Financial fields
  valor_aluguel: "Valor do Aluguel",
  valor_condominio: "Valor do Condomínio",
  valor_iptu: "Valor do IPTU",
  valor_outros_encargos: "Outros Encargos",
  valor_total: "Valor Total",
  taxa_garantia_percentual: "Taxa de Garantia (%)",
  setup_fee: "Taxa de Setup",
  setup_fee_exempt: "Isento de Taxa de Setup",
  total_claimed_value: "Valor Total Reclamado",
  amount: "Valor",
  valor: "Valor",
  
  // Agency fields
  agency_id: "ID da Imobiliária",
  razao_social: "Razão Social",
  nome_fantasia: "Nome Fantasia",
  cnpj: "CNPJ",
  endereco: "Endereço",
  cidade: "Cidade",
  estado: "Estado",
  cep: "CEP",
  responsavel_nome: "Nome do Responsável",
  responsavel_email: "Email do Responsável",
  responsavel_telefone: "Telefone do Responsável",
  logo_url: "URL do Logo",
  percentual_comissao_setup: "Comissão de Setup (%)",
  percentual_comissao_recorrente: "Comissão Recorrente (%)",
  
  // User/Profile fields
  user_id: "ID do Usuário",
  full_name: "Nome Completo",
  avatar_url: "URL do Avatar",
  is_primary_contact: "Contato Principal",
  position: "Função",
  role: "Papel",
  
  // Analysis fields
  analyst_id: "ID do Analista",
  approved_at: "Aprovado em",
  rejected_at: "Rejeitado em",
  canceled_at: "Cancelado em",
  rejection_reason: "Motivo da Rejeição",
  observacoes: "Observações",
  
  // Contract fields
  contract_id: "ID do Contrato",
  analysis_id: "ID da Análise",
  data_fim_contrato: "Fim do Contrato",
  activated_at: "Ativado em",
  activation_pending: "Ativação Pendente",
  cancellation_reason: "Motivo do Cancelamento",
  doc_contrato_locacao_status: "Status Contrato de Locação",
  doc_vistoria_inicial_status: "Status Vistoria Inicial",
  doc_seguro_incendio_status: "Status Seguro Incêndio",
  
  // Ticket fields
  ticket_id: "ID do Chamado",
  subject: "Assunto",
  description: "Descrição",
  category: "Categoria",
  priority: "Prioridade",
  assigned_to: "Atribuído a",
  resolved_at: "Resolvido em",
  first_response_at: "Primeira Resposta em",
  satisfaction_rating: "Avaliação",
  satisfaction_comment: "Comentário da Avaliação",
  
  // Claim fields
  claim_id: "ID da Garantia",
  public_status: "Status Público",
  internal_status: "Status Interno",
  docs_checklist: "Checklist de Documentos",
  
  // Message fields
  message: "Mensagem",
  sender_id: "ID do Remetente",
  is_read: "Lido",
  attachments_url: "Anexos",
  
  // Commission fields
  type: "Tipo",
  data_pagamento: "Data do Pagamento",
  mes_referencia: "Mês de Referência",
  ano_referencia: "Ano de Referência",
  
  // Payment fields
  payer_name: "Nome do Pagador",
  payer_cpf: "CPF do Pagador",
  payer_email: "Email do Pagador",
  payer_phone: "Telefone do Pagador",
  payer_is_tenant: "Pagador é Inquilino",
  payment_confirmed_at: "Pagamento Confirmado em",
  
  // File fields
  file_name: "Nome do Arquivo",
  file_path: "Caminho do Arquivo",
  file_size: "Tamanho do Arquivo",
  file_type: "Tipo de Arquivo",
  uploaded_by: "Enviado por",
  
  // Other
  content: "Conteúdo",
  note_type: "Tipo de Nota",
  event_type: "Tipo de Evento",
  metadata: "Metadados",
  rating: "Avaliação",
  comment: "Comentário",
  title: "Título",
  name: "Nome",
  version: "Versão",
  is_active: "Ativo",
  usage_count: "Vezes Usado",
  due_date: "Data de Vencimento",
  reference_period: "Período de Referência",
};

// Icon names for different field types (lucide-react icon names)
export const FIELD_ICONS: Record<string, string> = {
  // Person/User
  inquilino_nome: "User",
  conjuge_nome: "Users",
  full_name: "User",
  responsavel_nome: "UserCheck",
  payer_name: "User",
  
  // Email
  email: "Mail",
  inquilino_email: "Mail",
  responsavel_email: "Mail",
  payer_email: "Mail",
  
  // Phone
  telefone: "Phone",
  phone: "Phone",
  inquilino_telefone: "Phone",
  responsavel_telefone: "Phone",
  payer_phone: "Phone",
  
  // Location
  endereco: "MapPin",
  imovel_endereco: "MapPin",
  cidade: "Building2",
  imovel_cidade: "Building2",
  estado: "Map",
  imovel_estado: "Map",
  cep: "Hash",
  imovel_cep: "Hash",
  
  // Money
  valor_aluguel: "DollarSign",
  valor_condominio: "DollarSign",
  valor_iptu: "DollarSign",
  valor_total: "DollarSign",
  setup_fee: "DollarSign",
  total_claimed_value: "DollarSign",
  amount: "DollarSign",
  valor: "DollarSign",
  
  // Percentage
  taxa_garantia_percentual: "Percent",
  percentual_comissao_setup: "Percent",
  percentual_comissao_recorrente: "Percent",
  
  // Status
  status: "Activity",
  public_status: "Eye",
  internal_status: "Lock",
  active: "CheckCircle",
  
  // Documents
  cpf: "FileText",
  cnpj: "FileText",
  inquilino_cpf: "FileText",
  conjuge_cpf: "FileText",
  payer_cpf: "FileText",
  file_name: "File",
  file_path: "Folder",
  
  // Date
  created_at: "Calendar",
  updated_at: "Calendar",
  approved_at: "CalendarCheck",
  rejected_at: "CalendarX",
  canceled_at: "CalendarX",
  data_nascimento: "Cake",
  inquilino_data_nascimento: "Cake",
  conjuge_data_nascimento: "Cake",
  
  // Text
  observacoes: "MessageSquare",
  description: "FileText",
  message: "MessageCircle",
  content: "FileText",
  subject: "Tag",
  title: "Type",
  
  // Category/Type
  category: "Tag",
  type: "Tag",
  priority: "AlertTriangle",
  role: "Shield",
  position: "Briefcase",
  
  // Other
  rating: "Star",
  id: "Hash",
  is_primary_contact: "UserCheck",
};

// Status translations
export const STATUS_LABELS: Record<string, string> = {
  // Analysis status
  pendente: "Pendente",
  em_analise: "Em Análise",
  aprovada: "Aprovada",
  reprovada: "Reprovada",
  cancelada: "Cancelada",
  aguardando_pagamento: "Aguardando Pagamento",
  ativo: "Ativo",
  
  // Contract status
  documentacao_pendente: "Documentação Pendente",
  encerrado: "Encerrado",
  
  // Ticket status
  aberto: "Aberto",
  em_atendimento: "Em Atendimento",
  aguardando_cliente: "Aguardando Cliente",
  resolvido: "Resolvido",
  
  // Claim public status
  solicitado: "Solicitado",
  em_analise_tecnica: "Em Análise Técnica",
  pagamento_programado: "Pagamento Programado",
  finalizado: "Finalizado",
  
  // Claim internal status
  aguardando_analise: "Aguardando Análise",
  cobranca_amigavel: "Cobrança Amigável",
  notificacao_extrajudicial: "Notificação Extrajudicial",
  acordo_realizado: "Acordo Realizado",
  juridico_acionado: "Jurídico Acionado",
  
  // Commission status
  paga: "Paga",
  estornada: "Estornada",
  
  // Ticket priority
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  
  // Ticket category
  financeiro: "Financeiro",
  tecnico: "Técnico",
  comercial: "Comercial",
  urgente: "Urgente",
  
  // Commission type
  setup: "Setup",
  recorrente: "Recorrente",
  
  // Document status
  enviado: "Enviado",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
  
  // Agency position
  dono: "Dono",
  gerente: "Gerente",
  auxiliar: "Auxiliar",
  
  // User roles
  master: "Master",
  analyst: "Analista",
  agency_user: "Usuário de Imobiliária",
  
  // Boolean values
  true: "Sim",
  false: "Não",
};

// Format a value for display
export function formatFieldValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return "-";
  
  // Handle booleans
  if (typeof value === "boolean") {
    return value ? "Sim" : "Não";
  }
  
  // Handle status and enums
  if (typeof value === "string" && STATUS_LABELS[value]) {
    return STATUS_LABELS[value];
  }
  
  // Handle dates
  if (typeof value === "string" && (key.includes("_at") || key.includes("data_") || key.includes("_date"))) {
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          ...(value.includes("T") ? { hour: "2-digit", minute: "2-digit" } : {}),
        });
      }
    } catch {
      // Not a valid date, return as string
    }
  }
  
  // Handle money values
  if (typeof value === "number" && (key.includes("valor") || key.includes("fee") || key.includes("amount") || key === "setup_fee")) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  }
  
  // Handle percentages
  if (typeof value === "number" && key.includes("percentual")) {
    return `${value}%`;
  }
  
  // Handle file sizes
  if (typeof value === "number" && key === "file_size") {
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }
  
  // Handle arrays
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "-";
  }
  
  // Handle objects
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  
  return String(value);
}

// Get field label
export function getFieldLabel(key: string): string {
  return FIELD_LABELS[key] || key;
}

// Get field icon
export function getFieldIcon(key: string): string {
  return FIELD_ICONS[key] || "Circle";
}
