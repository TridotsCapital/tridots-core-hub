export type TicketCategory = 'financeiro' | 'tecnico' | 'comercial' | 'urgente' | 'solicitacao_link';
export type TicketStatus = 'aberto' | 'em_atendimento' | 'aguardando_cliente' | 'resolvido';
export type TicketPriority = 'baixa' | 'media' | 'alta';
export type NotificationType = 'new_message' | 'status_change' | 'ticket_escalated' | 'ticket_assigned';

export interface Ticket {
  id: string;
  agency_id: string;
  analysis_id: string | null;
  contract_id: string | null;
  claim_id: string | null;
  created_by: string;
  assigned_to: string | null;
  subject: string;
  description: string | null;
  category: TicketCategory;
  status: TicketStatus;
  priority: TicketPriority;
  first_response_at: string | null;
  resolved_at: string | null;
  satisfaction_rating: number | null;
  satisfaction_comment: string | null;
  escalated_at: string | null;
  closed_by: string | null;
  closed_by_type: 'agency' | 'internal' | null;
  created_at: string;
  updated_at: string;
  // Joined data
  agency?: {
    id: string;
    nome_fantasia: string | null;
    razao_social: string;
    responsavel_nome: string;
    responsavel_email: string | null;
    responsavel_telefone: string | null;
    logo_url: string | null;
  };
  creator?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
  assignee?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
  // Last message timestamp for sorting
  last_message_at?: string;
  // Linked contract/analysis data
  analysis?: {
    id: string;
    inquilino_nome: string;
    imovel_endereco: string;
    status: string;
  };
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  attachments_url: string[] | null;
  is_read: boolean;
  created_at: string;
  sender?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
}

export interface TicketNotification {
  id: string;
  user_id: string;
  ticket_id: string;
  type: NotificationType;
  title: string;
  message: string | null;
  read_at: string | null;
  created_at: string;
}

export interface QuickReply {
  id: string;
  title: string;
  content: string;
  category: TicketCategory | null;
  created_by: string;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface TypingIndicator {
  id: string;
  ticket_id: string;
  user_id: string;
  started_at: string;
  user?: {
    id: string;
    full_name: string;
  };
}

export const ticketCategoryConfig: Record<TicketCategory, { label: string; color: string }> = {
  financeiro: { label: 'Financeiro', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  tecnico: { label: 'Técnico', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  comercial: { label: 'Comercial', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  urgente: { label: 'Urgente', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
  solicitacao_link: { label: 'Solicitação de Link', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
};

export const ticketStatusConfig: Record<TicketStatus, { label: string; color: string }> = {
  aberto: { label: 'Aberto', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  em_atendimento: { label: 'Em Atendimento', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  aguardando_cliente: { label: 'Aguardando Cliente', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
  resolvido: { label: 'Resolvido', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
};

export const ticketPriorityConfig: Record<TicketPriority, { label: string; color: string; icon: string }> = {
  baixa: { label: 'Baixa', color: 'text-slate-500', icon: '↓' },
  media: { label: 'Média', color: 'text-yellow-500', icon: '→' },
  alta: { label: 'Alta', color: 'text-red-500', icon: '↑' },
};
