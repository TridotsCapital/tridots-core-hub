import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Eye, MessageCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Claim } from '@/types/claims';

interface AgencyClaimKanbanCardProps {
  claim: Claim;
  onClick: () => void;
  onViewDetails: () => void;
  onOpenTicket: () => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function AgencyClaimKanbanCard({
  claim,
  onClick,
  onViewDetails,
  onOpenTicket,
}: AgencyClaimKanbanCardProps) {
  const createdAt = new Date(claim.created_at);
  const daysSinceCreation = Math.floor(
    (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  const isUrgent = daysSinceCreation > 7 && claim.public_status !== 'finalizado';

  const timeAgo = formatDistanceToNow(createdAt, {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={onClick}>
      <CardContent className="p-3 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">
              {claim.analysis?.inquilino_nome || 'Inquilino'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {claim.analysis?.imovel_endereco}, {claim.analysis?.imovel_cidade}
            </p>
          </div>
          {isUrgent && (
            <Badge variant="destructive" className="flex-shrink-0 h-5 gap-1">
              <AlertTriangle className="h-3 w-3" />
              {daysSinceCreation}d
            </Badge>
          )}
        </div>

        {/* Value and Time */}
        <div className="flex items-center justify-between">
          <span className="font-bold text-primary">
            {formatCurrency(claim.total_claimed_value)}
          </span>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-8 text-xs gap-1.5"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails();
            }}
          >
            <Eye className="h-3.5 w-3.5" />
            Ver Detalhes
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-8 text-xs gap-1.5"
            onClick={(e) => {
              e.stopPropagation();
              onOpenTicket();
            }}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Abrir Chamado
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
