import { Analysis } from '@/types/database';
import { 
  Circle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileSearch,
  Ban
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface AnalysisTimelineProps {
  analysis: Analysis;
}

interface TimelineEvent {
  date: string;
  title: string;
  description?: string;
  icon: React.ElementType;
  color: string;
}

export function AnalysisTimeline({ analysis }: AnalysisTimelineProps) {
  const events: TimelineEvent[] = [
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
      description: 'Análise reprovada',
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
