import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageCircle, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface TimelineEvent {
  id: string;
  event_type: string;
  description: string;
  created_at: string;
  user_id?: string;
  attachment_url?: string;
}

interface InvoiceTimelineViewProps {
  events: TimelineEvent[];
}

const eventIcons: Record<string, React.ReactNode> = {
  created: <FileText className="h-4 w-4 text-primary" />,
  edited: <AlertCircle className="h-4 w-4 text-yellow-600" />,
  sent: <FileText className="h-4 w-4 text-blue-600" />,
  payment_registered: <CheckCircle2 className="h-4 w-4 text-green-600" />,
  canceled: <AlertCircle className="h-4 w-4 text-destructive" />,
  note_added: <MessageCircle className="h-4 w-4 text-secondary-foreground" />,
};

const eventLabels: Record<string, string> = {
  created: 'Fatura Criada',
  edited: 'Fatura Editada',
  sent: 'Fatura Enviada',
  payment_registered: 'Pagamento Registrado',
  canceled: 'Fatura Cancelada',
  note_added: 'Nota Adicionada',
};

export default function InvoiceTimelineView({ events }: InvoiceTimelineViewProps) {
  if (!events || events.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Nenhum evento registrado
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {events.map((event, index) => (
        <div key={event.id} className="flex gap-4">
          {/* Timeline Line */}
          <div className="flex flex-col items-center">
            <div className="rounded-full bg-muted p-2">
              {eventIcons[event.event_type] || <FileText className="h-4 w-4" />}
            </div>
            {index < events.length - 1 && (
              <div className="w-px bg-muted h-16 mt-2" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 pt-1 pb-6">
            <div className="bg-muted/30 rounded-lg border p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-foreground">
                    {eventLabels[event.event_type] || event.event_type}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(event.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                </div>
              </div>

              <p className="text-sm text-foreground mt-3">{event.description}</p>

              {event.attachment_url && (
                <a
                  href={event.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-3 text-sm text-primary hover:underline"
                >
                  <FileText className="h-4 w-4" />
                  Ver anexo
                </a>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
