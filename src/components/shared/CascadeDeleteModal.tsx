import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Trash2, Loader2, Shield, ExternalLink } from 'lucide-react';
import { useCascadeDelete } from '@/hooks/useCascadeDelete';
import { useNavigate } from 'react-router-dom';

interface CascadeDeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: 'analysis' | 'contract' | 'claim';
  entityId: string;
  entityLabel: string; // e.g. "Análise", "Contrato", "Garantia"
  onDeleted?: () => void;
}

const summaryLabels: Record<string, string> = {
  documentos: 'Documentos',
  timeline: 'Eventos de timeline',
  comissoes: 'Comissões',
  aceites_digitais: 'Aceites digitais',
  notas_internas: 'Notas internas',
  contrato: 'Contrato',
  parcelas: 'Parcelas',
  parcelas_contrato: 'Parcelas do contrato',
  renovacoes: 'Renovações',
  renovacoes_contrato: 'Renovações do contrato',
  lembretes_renovacao: 'Lembretes de renovação',
  garantias_finalizadas: 'Garantias finalizadas',
  faturas_afetadas: 'Faturas afetadas',
  chamados_preservados: 'Chamados preservados (com aviso)',
  arquivos: 'Arquivos',
  itens: 'Itens de cobrança',
  notas: 'Notas',
  historico: 'Histórico de status',
};

export function CascadeDeleteModal({
  open,
  onOpenChange,
  entityType,
  entityId,
  entityLabel,
  onDeleted,
}: CascadeDeleteModalProps) {
  const navigate = useNavigate();
  const { fetchDeletionSummary, executeDeletion, isLoading } = useCascadeDelete();
  const [step, setStep] = useState<'loading' | 'summary' | 'confirm' | 'blocked'>('loading');
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [tenantName, setTenantName] = useState('');
  const [blockedBy, setBlockedBy] = useState<{ type: string; id: string; label: string } | null>(null);

  useEffect(() => {
    if (open && entityId) {
      setStep('loading');
      fetchDeletionSummary(entityType, entityId).then((result) => {
        if (!result) {
          onOpenChange(false);
          return;
        }
        setTenantName(result.tenant_name);
        if (result.blocked && result.blocked_by) {
          setBlockedBy(result.blocked_by);
          setStep('blocked');
        } else {
          setSummary(result.summary);
          setStep('summary');
        }
      });
    }
  }, [open, entityId]);

  const handleConfirmDelete = async () => {
    const result = await executeDeletion(entityType, entityId);
    if (result.success) {
      onOpenChange(false);
      onDeleted?.();
    }
  };

  const totalItems = Object.entries(summary)
    .filter(([key]) => key !== 'chamados_preservados')
    .reduce((sum, [, count]) => sum + count, 0);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!isLoading) onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg">
        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Verificando dependências...</p>
          </div>
        )}

        {step === 'blocked' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-600">
                <Shield className="h-5 w-5" />
                Exclusão Bloqueada
              </DialogTitle>
              <DialogDescription>
                Não é possível excluir esta {entityLabel.toLowerCase()} porque existe uma garantia ativa vinculada.
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4 space-y-3">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                {blockedBy?.label}
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Exclua a garantia ativa primeiro para poder prosseguir com esta exclusão.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="border-amber-300 text-amber-700 hover:bg-amber-100"
                onClick={() => {
                  onOpenChange(false);
                  navigate(`/claims/${blockedBy?.id}`);
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ir para a Garantia
              </Button>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
            </DialogFooter>
          </>
        )}

        {step === 'summary' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Excluir {entityLabel}
              </DialogTitle>
              <DialogDescription>
                Revise o que será excluído permanentemente.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-3">
                <p className="text-sm"><strong>Inquilino:</strong> {tenantName}</p>
                <p className="text-sm"><strong>ID:</strong> <span className="font-mono">#{entityId.slice(0, 8).toUpperCase()}</span></p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Será excluído:</p>
                <div className="grid grid-cols-2 gap-1">
                  {Object.entries(summary)
                    .filter(([, count]) => count > 0)
                    .map(([key, count]) => (
                      <div key={key} className="flex items-center justify-between text-sm py-1 px-2 rounded bg-muted/30">
                        <span className="text-muted-foreground">{summaryLabels[key] || key}</span>
                        <Badge variant={key === 'chamados_preservados' ? 'secondary' : 'destructive'} className="text-xs">
                          {count}
                        </Badge>
                      </div>
                    ))}
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-xs text-destructive">
                  Esta ação é <strong>irreversível</strong>. {totalItems > 0 ? `${totalItems} registros serão removidos permanentemente.` : ''} 
                  {summary.chamados_preservados > 0 && ` ${summary.chamados_preservados} chamado(s) vinculado(s) serão preservados com um aviso de vínculo excluído.`}
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => setStep('confirm')}
                disabled={isLoading}
              >
                Prosseguir com a Exclusão
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'confirm' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Confirmação Final
              </DialogTitle>
              <DialogDescription>
                Tem certeza absoluta? Não será possível desfazer esta exclusão.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-lg border-2 border-destructive/50 bg-destructive/5 p-4 text-center space-y-2">
              <p className="font-semibold text-destructive">
                {entityLabel} de {tenantName} será excluída permanentemente
              </p>
              <p className="text-sm text-muted-foreground">
                Incluindo todos os registros dependentes listados anteriormente.
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setStep('summary')} disabled={isLoading}>
                Voltar
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  'Excluir Definitivamente'
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
