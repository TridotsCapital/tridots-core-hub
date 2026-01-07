import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { User, MapPin, Building2, Calendar, DollarSign, ExternalLink, FileText } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useClaimItems } from '@/hooks/useClaimItems';
import { useClaimFiles } from '@/hooks/useClaimFiles';
import type { Claim } from '@/types/claims';
import { claimPublicStatusConfig, claimItemCategoryConfig } from '@/types/claims';

interface ClaimDetailDrawerProps {
  claim: Claim | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function ClaimDetailDrawer({ claim, open, onOpenChange }: ClaimDetailDrawerProps) {
  const navigate = useNavigate();
  const { data: items } = useClaimItems(claim?.id);
  const { data: files } = useClaimFiles(claim?.id);

  if (!claim) return null;

  const statusConfig = claimPublicStatusConfig[claim.public_status];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center justify-between">
            <span>Detalhes do Sinistro</span>
            <Badge className={`${statusConfig.bgColor} ${statusConfig.color}`}>
              {statusConfig.label}
            </Badge>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-140px)] pr-4">
          <div className="space-y-6">
            {/* Tenant Info */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Inquilino
              </h4>
              <div className="bg-muted/40 rounded-lg p-3 space-y-1">
                <p className="font-medium">{claim.contract?.analysis?.inquilino_nome}</p>
                <p className="text-sm text-muted-foreground">
                  CPF: {claim.contract?.analysis?.inquilino_cpf}
                </p>
              </div>
            </div>

            {/* Property Info */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Imóvel
              </h4>
              <div className="bg-muted/40 rounded-lg p-3 space-y-1">
                <p className="font-medium">{claim.contract?.analysis?.imovel_endereco}</p>
                <p className="text-sm text-muted-foreground">
                  {claim.contract?.analysis?.imovel_cidade} - {claim.contract?.analysis?.imovel_estado}
                </p>
              </div>
            </div>

            <Separator />

            {/* Value Summary */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                Valor Total Solicitado
              </h4>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(claim.total_claimed_value)}
              </div>
            </div>

            {/* Items Summary */}
            {items && items.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Itens ({items.length})</h4>
                <div className="space-y-2">
                  {items.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground">
                        {claimItemCategoryConfig[item.category]?.label || item.category}
                        {item.reference_period && ` (${item.reference_period})`}
                      </span>
                      <span className="font-medium">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                  {items.length > 5 && (
                    <p className="text-xs text-muted-foreground">
                      + {items.length - 5} outros itens
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Files Summary */}
            {files && files.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Arquivos ({files.length})
                </h4>
                <div className="space-y-1">
                  {files.slice(0, 3).map((file) => (
                    <p key={file.id} className="text-sm text-muted-foreground truncate">
                      {file.file_name}
                    </p>
                  ))}
                  {files.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      + {files.length - 3} outros arquivos
                    </p>
                  )}
                </div>
              </div>
            )}

            <Separator />

            {/* Dates */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Criado em{' '}
                {format(new Date(claim.created_at), "dd/MM/yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
              </div>
            </div>

            {/* View Full Details Button */}
            <Button
              className="w-full gap-2"
              onClick={() => {
                onOpenChange(false);
                navigate(`/agency/claims/${claim.id}`);
              }}
            >
              <ExternalLink className="h-4 w-4" />
              Ver Detalhes Completos
            </Button>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
