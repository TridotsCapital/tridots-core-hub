import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AuditLog {
  id: string;
  user_id: string | null;
  table_name: string;
  record_id: string | null;
  action: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user?: { full_name: string } | null;
}

export const TABLE_LABELS: Record<string, string> = {
  agencies: 'Imobiliárias',
  agency_users: 'Usuários de Imobiliárias',
  analyses: 'Análises',
  analysis_documents: 'Documentos de Análises',
  analysis_timeline: 'Timeline de Análises',
  audit_logs: 'Logs de Auditoria',
  claim_files: 'Arquivos de Garantias',
  claim_items: 'Itens de Garantias',
  claim_notes: 'Notas de Garantias',
  claim_status_history: 'Histórico de Status de Garantias',
  claim_timeline: 'Timeline de Garantias',
  claims: 'Garantias',
  commissions: 'Comissões',
  contracts: 'Contratos',
  digital_acceptances: 'Aceites Digitais',
  internal_chat: 'Chat Interno',
  notifications: 'Notificações',
  profiles: 'Perfis',
  satisfaction_surveys: 'Pesquisas de Satisfação',
  term_templates: 'Modelos de Termos',
  ticket_analyst_history: 'Histórico de Analistas',
  ticket_messages: 'Mensagens de Chamados',
  ticket_notifications: 'Notificações de Chamados',
  ticket_quick_replies: 'Respostas Rápidas',
  ticket_typing_indicators: 'Indicadores de Digitação',
  tickets: 'Chamados',
  user_roles: 'Permissões de Usuários',
};

export const useAuditLogs = (filters?: {
  tableName?: string;
  action?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: ["audit-logs", filters],
    queryFn: async () => {
      let query = supabase
        .from("audit_logs")
        .select("*, user:profiles(full_name)")
        .order("created_at", { ascending: false })
        .limit(500);

      if (filters?.tableName) {
        query = query.eq("table_name", filters.tableName);
      }

      if (filters?.action) {
        query = query.eq("action", filters.action);
      }

      if (filters?.userId) {
        query = query.eq("user_id", filters.userId);
      }

      if (filters?.startDate) {
        query = query.gte("created_at", filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte("created_at", filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as AuditLog[];
    },
  });
};

export const useAuditUsers = () => {
  return useQuery({
    queryKey: ["audit-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .order("full_name");

      if (error) throw error;
      return data;
    },
  });
};
