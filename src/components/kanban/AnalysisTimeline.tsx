import { Analysis } from '@/types/database';
import { 
  Circle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileSearch,
  Ban,
  CirclePlus,
  ArrowRight,
  Percent,
  Link,
  Timer,
  CheckCircle,
  Camera,
  CreditCard,
  AlertCircle,
  FileText,
  Upload,
  PlayCircle,
  UserCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAnalysisTimeline, getEventConfig } from '@/hooks/useAnalysisTimeline';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface AnalysisTimelineProps {
  analysis: Analysis;
}

// Icon mapping
const iconMap: Record<string, React.ElementType> = {
  CirclePlus,
  ArrowRight,
  Percent,
  Link,
  Timer,
  CheckCircle,
  Camera,
  CreditCard,
  AlertCircle,
  FileText,
  Upload,
  XCircle,
  PlayCircle,
  UserCheck,
  CheckCircle2,
  Ban,
  Circle,
  Clock,
  FileSearch,
};

// Helper functions for formatting
const formatDate = (dateStr: string) => {
  try {
    return format(new Date(dateStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return dateStr;
  }
};

const formatDateOnly = (dateStr: string) => {
  try {
    return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return dateStr;
  }
};

const formatId = (id: string) => `#${id.slice(0, 8).toUpperCase()}`;

const formatBoolean = (value: boolean) => value ? 'Sim' : 'Não';

// Fields to ignore in metadata display
const ignoredFields = [
  'validated_by', 'rejected_by', 'created_by', 'analyst_id', 'canceled_by',
  'photo_path', 'receipt_path', 'identity_photo_path', 'setup_payment_receipt_path',
  'guarantee_payment_receipt_path', 'file_path', 'user_id', 'activated_by'
];

// Format metadata based on event type
const formatMetadata = (eventType: string, metadata: Record<string, unknown>): { label: string; value: string }[] => {
  const entries: { label: string; value: string }[] = [];
  
  switch (eventType) {
    case 'rate_adjusted':
      if (metadata.original_rate !== undefined) entries.push({ 
        label: 'Taxa Original', 
        value: `${metadata.original_rate}%` 
      });
      if (metadata.new_rate !== undefined) entries.push({ 
        label: 'Nova Taxa', 
        value: `${metadata.new_rate}%` 
      });
      break;
      
    case 'acceptance_link_generated':
      if (metadata.expires_at) entries.push({ 
        label: 'Expira em', 
        value: formatDate(metadata.expires_at as string)
      });
      if (metadata.has_setup_link !== undefined) entries.push({
        label: 'Link Setup',
        value: formatBoolean(metadata.has_setup_link as boolean)
      });
      if (metadata.has_guarantee_link !== undefined) entries.push({
        label: 'Link Garantia',
        value: formatBoolean(metadata.has_guarantee_link as boolean)
      });
      break;
      
    case 'analysis_started':
    case 'analyst_assigned':
      if (metadata.analyst_name) entries.push({ 
        label: 'Analista', 
        value: metadata.analyst_name as string 
      });
      break;
      
    case 'status_changed':
      if (metadata.old_status) entries.push({ 
        label: 'Status Anterior', 
        value: formatStatus(metadata.old_status as string) 
      });
      if (metadata.new_status) entries.push({ 
        label: 'Novo Status', 
        value: formatStatus(metadata.new_status as string) 
      });
      break;
      
    case 'payment_completed':
      if (metadata.checkout_session_id) entries.push({ 
        label: 'Sessão', 
        value: `...${(metadata.checkout_session_id as string).slice(-8)}` 
      });
      break;

    case 'payment_failed':
      if (metadata.attempt) entries.push({ 
        label: 'Tentativa', 
        value: `${metadata.attempt}/3` 
      });
      if (metadata.reason) entries.push({
        label: 'Motivo',
        value: metadata.reason as string
      });
      break;

    case 'contract_created':
      if (metadata.contract_id) entries.push({ 
        label: 'Contrato', 
        value: formatId(metadata.contract_id as string) 
      });
      break;

    case 'payments_validated':
      if (metadata.contract_id) entries.push({
        label: 'Contrato',
        value: formatId(metadata.contract_id as string)
      });
      if (metadata.guarantee_payment_date) entries.push({
        label: 'Data Pag. Garantia',
        value: formatDateOnly(metadata.guarantee_payment_date as string)
      });
      if (metadata.setup_payment_date) entries.push({
        label: 'Data Pag. Setup',
        value: formatDateOnly(metadata.setup_payment_date as string)
      });
      break;

    case 'payments_rejected':
      if (metadata.reason) entries.push({
        label: 'Motivo',
        value: metadata.reason as string
      });
      break;

    case 'identity_verified':
      entries.push({
        label: 'Foto',
        value: 'Capturada com sucesso'
      });
      break;

    case 'payer_confirmed':
      entries.push({
        label: 'Pagador',
        value: metadata.is_tenant ? 'O próprio inquilino' : 'Terceiro responsável'
      });
      if (metadata.payer_name) entries.push({
        label: 'Nome',
        value: metadata.payer_name as string
      });
      break;

    case 'guarantee_payment_confirmed':
    case 'setup_payment_confirmed':
      if (metadata.has_receipt !== undefined) entries.push({
        label: 'Comprovante',
        value: formatBoolean(metadata.has_receipt as boolean)
      });
      break;

    case 'acceptance_completed':
      // Este evento não tem metadados relevantes para exibir
      break;

    case 'ticket_opened':
      if (metadata.ticket_id) entries.push({
        label: 'Chamado',
        value: formatId(metadata.ticket_id as string)
      });
      if (metadata.subject) entries.push({
        label: 'Assunto',
        value: metadata.subject as string
      });
      break;

    case 'ticket_resolved':
      if (metadata.ticket_id) entries.push({
        label: 'Chamado',
        value: formatId(metadata.ticket_id as string)
      });
      break;

    case 'document_uploaded':
    case 'document_approved':
    case 'document_rejected':
      if (metadata.document_type) entries.push({
        label: 'Tipo',
        value: metadata.document_type as string
      });
      if (metadata.file_name) entries.push({
        label: 'Arquivo',
        value: metadata.file_name as string
      });
      if (metadata.feedback) entries.push({
        label: 'Feedback',
        value: metadata.feedback as string
      });
      break;

    case 'contract_activated':
      if (metadata.contract_id) entries.push({
        label: 'Contrato',
        value: formatId(metadata.contract_id as string)
      });
      break;

    case 'contract_canceled':
      if (metadata.contract_id) entries.push({
        label: 'Contrato',
        value: formatId(metadata.contract_id as string)
      });
      if (metadata.reason) entries.push({
        label: 'Motivo',
        value: metadata.reason as string
      });
      break;
      
    default:
      // Fallback melhorado: filtrar campos sensíveis e formatar adequadamente
      Object.entries(metadata).forEach(([key, value]) => {
        // Ignorar campos que são IDs de usuário ou caminhos internos
        if (ignoredFields.includes(key)) return;
        
        if (value !== null && value !== undefined) {
          // Formatar a chave de snake_case para texto legível
          const formattedKey = key
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase())
            .replace('Id', 'ID');
          
          let formattedValue: string;
          
          // Detectar e formatar UUIDs
          if (typeof value === 'string' && value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-/i)) {
            formattedValue = formatId(value);
          }
          // Formatar booleanos
          else if (typeof value === 'boolean') {
            formattedValue = formatBoolean(value);
          }
          // Formatar objetos/arrays
          else if (typeof value === 'object') {
            formattedValue = JSON.stringify(value);
            if (formattedValue.length > 50) {
              formattedValue = formattedValue.slice(0, 47) + '...';
            }
          }
          // Formatar datas ISO completas (com T)
          else if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T/)) {
            formattedValue = formatDate(value);
          }
          // Formatar datas simples (YYYY-MM-DD)
          else if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
            formattedValue = formatDateOnly(value);
          }
          else {
            formattedValue = String(value);
          }
          
          entries.push({ label: formattedKey, value: formattedValue });
        }
      });
  }
  
  return entries;
};

// Helper to format status names
const formatStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pendente': 'Pendente',
    'em_analise': 'Em Análise',
    'aprovada': 'Aprovada',
    'reprovada': 'Reprovada',
    'cancelada': 'Cancelada',
    'aguardando_pagamento': 'Aguardando Pagamento',
    'ativo': 'Ativo',
  };
  return statusMap[status] || status;
};

export function AnalysisTimeline({ analysis }: AnalysisTimelineProps) {
  const { data: timelineEvents, isLoading } = useAnalysisTimeline(analysis.id);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  const toggleExpand = (eventId: string) => {
    setExpandedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  // If we have real timeline data, use it
  if (!isLoading && timelineEvents && timelineEvents.length > 0) {
    return (
      <div className="relative">
        {timelineEvents.map((event, index) => {
          const config = getEventConfig(event.event_type);
          const IconComponent = iconMap[config.iconName] || Circle;
          const isLast = index === timelineEvents.length - 1;
          const isExpanded = expandedEvents.has(event.id);
          const hasMetadata = event.metadata && Object.keys(event.metadata).length > 0;

          return (
            <div key={event.id} className="flex gap-4">
              {/* Line and icon */}
              <div className="flex flex-col items-center">
                <div className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full',
                  config.bgColor
                )}>
                  <IconComponent className={cn('h-4 w-4', config.color)} />
                </div>
                {!isLast && (
                  <div className="w-px h-full bg-border min-h-[40px]" />
                )}
              </div>

              {/* Content */}
              <div className="pb-6 flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">{event.description}</p>
                    {event.creator && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        por {event.creator.full_name}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(event.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  {hasMetadata && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2"
                      onClick={() => toggleExpand(event.id)}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>
                
                {/* Expanded metadata */}
                {isExpanded && hasMetadata && (
                  <div className="mt-2 rounded-md bg-muted/50 p-3 space-y-1.5">
                    {formatMetadata(event.event_type, event.metadata as Record<string, unknown>).map((item, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Fallback: Generate timeline from analysis data (legacy behavior)
  const events: Array<{
    date: string;
    title: string;
    description?: string;
    icon: React.ElementType;
    color: string;
  }> = [
    {
      date: analysis.created_at,
      title: 'Análise Criada',
      description: 'Solicitação recebida',
      icon: Circle,
      color: 'text-muted-foreground bg-muted',
    },
  ];

  // Add status-based events
  if (analysis.status === 'em_analise' || analysis.approved_at || analysis.rejected_at || analysis.canceled_at) {
    events.push({
      date: analysis.updated_at,
      title: 'Em Análise',
      description: 'Análise iniciada pela equipe',
      icon: FileSearch,
      color: 'text-info bg-info/10',
    });
  }

  if (analysis.approved_at) {
    events.push({
      date: analysis.approved_at,
      title: 'Aprovada',
      description: 'Análise aprovada com sucesso',
      icon: CheckCircle2,
      color: 'text-success bg-success/10',
    });
  }

  if (analysis.rejected_at) {
    events.push({
      date: analysis.rejected_at,
      title: 'Reprovada',
      description: analysis.rejection_reason || 'Análise reprovada',
      icon: XCircle,
      color: 'text-destructive bg-destructive/10',
    });
  }

  if (analysis.canceled_at) {
    events.push({
      date: analysis.canceled_at,
      title: 'Cancelada',
      description: 'Análise cancelada',
      icon: Ban,
      color: 'text-muted-foreground bg-muted',
    });
  }

  // Current status indicator if still pending/in analysis
  if (!analysis.approved_at && !analysis.rejected_at && !analysis.canceled_at) {
    events.push({
      date: new Date().toISOString(),
      title: 'Aguardando',
      description: analysis.status === 'pendente' ? 'Aguardando início da análise' : 'Análise em andamento',
      icon: Clock,
      color: 'text-warning bg-warning/10',
    });
  }

  return (
    <div className="relative">
      {events.map((event, index) => {
        const Icon = event.icon;
        const isLast = index === events.length - 1;

        return (
          <div key={index} className="flex gap-4">
            {/* Line and icon */}
            <div className="flex flex-col items-center">
              <div className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full',
                event.color
              )}>
                <Icon className="h-4 w-4" />
              </div>
              {!isLast && (
                <div className="w-px h-full bg-border min-h-[40px]" />
              )}
            </div>

            {/* Content */}
            <div className="pb-6">
              <p className="font-medium text-sm">{event.title}</p>
              {event.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(event.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
