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

function TimelineEventItem({ event }: { event: ClaimTimelineEvent }) {
  const config = getEventConfig(event.event_type);
  const IconComponent = config.icon;

  return (
    <div className="flex gap-4 relative">
      {/* Icon */}
      <div className={cn('p-2 rounded-full shrink-0', config.bgColor)}>
        <IconComponent className={cn('h-4 w-4', config.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium">{event.description}</p>
            {event.creator && (
              <p className="text-xs text-muted-foreground mt-0.5">
                por {event.creator.full_name}
              </p>
            )}
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
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
          <div key={i} className="flex gap-4">
            <Skeleton className="h-8 w-8 rounded-full" />
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
      <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-border" />

      {/* Events */}
      <div className="space-y-0">
        {events.map((event) => (
          <TimelineEventItem key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
