export type NotificationType = 
  | 'ticket_message' 
  | 'ticket_status' 
  | 'analysis_message' 
  | 'analysis_status'
  | 'contract_status'
  | 'contract_document_rejected';

export type NotificationSource = 'chamados' | 'analises' | 'contratos' | 'sinistros';

export interface NotificationMetadata {
  sender_name?: string;
  ticket_subject?: string;
  agency_name?: string;
  category?: string;
  tenant_name?: string;
  status?: string;
  old_status?: string;
  new_status?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  source: NotificationSource;
  reference_id: string;
  title: string;
  message: string | null;
  metadata: NotificationMetadata;
  read_at: string | null;
  created_at: string;
}

export interface NotificationConfig {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const getNotificationConfig = (type: NotificationType): { 
  icon: string; 
  color: string; 
  bgColor: string;
  borderColor: string;
} => {
  switch (type) {
    case 'ticket_message':
      return {
        icon: 'MessageSquare',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      };
    case 'ticket_status':
      return {
        icon: 'RefreshCw',
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200'
      };
    case 'analysis_message':
      return {
        icon: 'FileText',
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200'
      };
    case 'analysis_status':
      return {
        icon: 'CheckCircle',
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200'
      };
    case 'contract_status':
      return {
        icon: 'FileCheck',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      };
    case 'contract_document_rejected':
      return {
        icon: 'FileX',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      };
    default:
      return {
        icon: 'Bell',
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200'
      };
  }
};

export const getSourceLabel = (source: NotificationSource): string => {
  switch (source) {
    case 'chamados':
      return 'Chamado';
    case 'analises':
      return 'Análise';
    case 'contratos':
      return 'Contrato';
    default:
      return '';
  }
};
