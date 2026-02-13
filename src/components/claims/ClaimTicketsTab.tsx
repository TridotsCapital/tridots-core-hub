import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatDateBR } from '@/lib/utils';
import { 
  MessageSquare, 
  ExternalLink,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useClaimTickets } from '@/hooks/useClaimTickets';

interface ClaimTicketsTabProps {
  claimId: string;
  isAgencyPortal?: boolean;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  aberto: { label: 'Aberto', className: 'bg-yellow-100 text-yellow-800' },
  em_atendimento: { label: 'Em Atendimento', className: 'bg-blue-100 text-blue-800' },
  aguardando_cliente: { label: 'Aguardando', className: 'bg-orange-100 text-orange-800' },
  resolvido: { label: 'Resolvido', className: 'bg-green-100 text-green-800' },
};

const priorityConfig: Record<string, { label: string; className: string }> = {
  baixa: { label: 'Baixa', className: 'border-slate-300' },
  media: { label: 'Média', className: 'border-amber-400' },
  alta: { label: 'Alta', className: 'border-red-500' },
};

export function ClaimTicketsTab({ claimId, isAgencyPortal = false }: ClaimTicketsTabProps) {
  const navigate = useNavigate();
  const { data: tickets, isLoading } = useClaimTickets(claimId);

  const handleViewTicket = (ticketId: string) => {
    if (isAgencyPortal) {
      navigate('/agency/support', { state: { ticketId } });
    } else {
      navigate('/tickets', { state: { ticketId } });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (!tickets || tickets.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
        <p className="text-muted-foreground">Nenhum chamado em aberto</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Os chamados vinculados a esta garantia aparecerão aqui
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tickets.map((ticket) => {
        const status = statusConfig[ticket.status] || statusConfig.aberto;
        const priority = priorityConfig[ticket.priority] || priorityConfig.media;

        return (
          <Card key={ticket.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm truncate">{ticket.subject}</h4>
                    <Badge className={status.className} variant="secondary">
                      {status.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDateBR(ticket.created_at, "dd/MM/yyyy 'às' HH:mm")}
                    </span>
                    {ticket.assigned_to_profile && (
                      <span>• {ticket.assigned_to_profile.full_name}</span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewTicket(ticket.id)}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Ver
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
