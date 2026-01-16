import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  MessageSquare,
  RefreshCw,
  User,
  ArrowRightLeft
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useClaimTimeline, ClaimTimelineEvent } from '@/hooks/useClaimTimeline';
import { cn } from '@/lib/utils';
import { claimPublicStatusConfig, claimInternalStatusConfig } from '@/types/claims';

interface ClaimTimelineProps {
  claimId: string;
}

const eventTypeConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  created: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  public_status_changed: {
    icon: ArrowRightLeft,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  internal_status_changed: {
    icon: RefreshCw,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
  file_added: {
    icon: FileText,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
  note_added: {
    icon: MessageSquare,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
  },
  assigned: {
    icon: User,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
  },
  default: {
    icon: Clock,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
  },
};

function getEventConfig(eventType: string) {
  return eventTypeConfig[eventType] || eventTypeConfig.default;
}

// Humanize status in description
function humanizeDescription(description: string): string {
  // Replace public status keys with labels
  Object.entries(claimPublicStatusConfig).forEach(([key, config]) => {
    const regex = new RegExp(`\\b${key}\\b`, 'gi');
    description = description.replace(regex, config.label);
  });
  
  // Replace internal status keys with labels
  Object.entries(claimInternalStatusConfig).forEach(([key, config]) => {
    const regex = new RegExp(`\\b${key}\\b`, 'gi');
    description = description.replace(regex, config.label);
  });
  
  return description;
}

function TimelineEventItem({ event }: { event: ClaimTimelineEvent }) {
  const config = getEventConfig(event.event_type);
  const IconComponent = config.icon;
  const humanizedDescription = humanizeDescription(event.description);

  return (
    <div className={cn(
      'flex gap-4 relative rounded-lg p-3 -ml-3 transition-colors',
      event.event_type === 'public_status_changed' && 'bg-blue-50/50 dark:bg-blue-950/20',
      event.event_type === 'internal_status_changed' && 'bg-purple-50/50 dark:bg-purple-950/20',
      event.event_type === 'created' && 'bg-green-50/50 dark:bg-green-950/20',
    )}>
      {/* Icon */}
      <div className={cn('p-2 rounded-full shrink-0', config.bgColor)}>
        <IconComponent className={cn('h-4 w-4', config.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-relaxed">{humanizedDescription}</p>
            {event.creator && (
              <p className="text-xs text-muted-foreground mt-1">
                por {event.creator.full_name}
              </p>
            )}
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
            {format(new Date(event.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </span>
        </div>
      </div>
    </div>
  );
}

export function ClaimTimeline({ claimId }: ClaimTimelineProps) {
  const { data: events, isLoading, error } = useClaimTimeline(claimId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4 p-3">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-destructive p-4">
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm">Erro ao carregar timeline</span>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nenhum evento registrado</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[22px] top-10 bottom-4 w-0.5 bg-border" />

      {/* Events */}
      <div className="space-y-2">
        {events.map((event) => (
          <TimelineEventItem key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
