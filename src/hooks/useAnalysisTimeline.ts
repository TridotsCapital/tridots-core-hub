import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { AnalysisTimelineEvent } from '@/types/database';

export function useAnalysisTimeline(analysisId: string | undefined) {
  return useQuery({
    queryKey: ['analysis-timeline', analysisId],
    queryFn: async () => {
      if (!analysisId) return [];

      const { data, error } = await supabase
        .from('analysis_timeline')
        .select(`
          *,
          creator:profiles!analysis_timeline_created_by_fkey(id, full_name, email)
        `)
        .eq('analysis_id', analysisId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(event => ({
        ...event,
        metadata: event.metadata as Record<string, unknown>,
      })) as AnalysisTimelineEvent[];
    },
    enabled: !!analysisId,
  });
}

// Timeline event type configuration with colors and icons
export const timelineEventConfig: Record<string, { 
  label: string; 
  color: string; 
  bgColor: string;
  iconName: string;
}> = {
  created: {
    label: 'Análise Criada',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    iconName: 'CirclePlus',
  },
  status_changed: {
    label: 'Status Alterado',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    iconName: 'ArrowRight',
  },
  rate_adjusted: {
    label: 'Taxa Reajustada',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    iconName: 'Percent',
  },
  acceptance_link_generated: {
    label: 'Link de Aceite Gerado',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    iconName: 'Link',
  },
  acceptance_link_expired: {
    label: 'Link Expirado',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    iconName: 'Timer',
  },
  terms_accepted: {
    label: 'Termos Aceitos',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    iconName: 'CheckCircle',
  },
  identity_verified: {
    label: 'Identidade Verificada',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    iconName: 'Camera',
  },
  payment_initiated: {
    label: 'Pagamento Iniciado',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    iconName: 'CreditCard',
  },
  payment_completed: {
    label: 'Pagamento Confirmado',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    iconName: 'CreditCard',
  },
  payment_failed: {
    label: 'Pagamento Falhou',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    iconName: 'AlertCircle',
  },
  contract_created: {
    label: 'Contrato Criado',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    iconName: 'FileText',
  },
  document_uploaded: {
    label: 'Documento Enviado',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    iconName: 'Upload',
  },
  document_approved: {
    label: 'Documento Aprovado',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    iconName: 'CheckCircle',
  },
  document_rejected: {
    label: 'Documento Rejeitado',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    iconName: 'XCircle',
  },
  contract_activated: {
    label: 'Contrato Ativado',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    iconName: 'CheckCircle2',
  },
  contract_canceled: {
    label: 'Contrato Cancelado',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    iconName: 'Ban',
  },
  analysis_started: {
    label: 'Análise Iniciada',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    iconName: 'PlayCircle',
  },
  analyst_assigned: {
    label: 'Analista Atribuído',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    iconName: 'UserCheck',
  },
};

export function getEventConfig(eventType: string) {
  return timelineEventConfig[eventType] || {
    label: eventType,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    iconName: 'Circle',
  };
}
