import { useState, useCallback } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Trash2, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useCascadeDelete } from '@/hooks/useCascadeDelete';
import { useQueryClient } from '@tanstack/react-query';

interface ContractInfo {
  id: string;
  tenantName: string;
  code: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contracts: ContractInfo[];
  onComplete: () => void;
}

type Step = 'summary' | 'confirm' | 'progress' | 'done';

interface DeletionResult {
  id: string;
  tenantName: string;
  code: string;
  success: boolean;
  error?: string;
}

export function BulkDeleteContractsModal({ open, onOpenChange, contracts, onComplete }: Props) {
  const [step, setStep] = useState<Step>('summary');
  const [results, setResults] = useState<DeletionResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const { executeDeletion } = useCascadeDelete();
  const queryClient = useQueryClient();

  const total = contracts.length;
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  const progress = total > 0 ? (currentIndex / total) * 100 : 0;

  const handleClose = useCallback(() => {
    if (isProcessing) return;
    setStep('summary');
    setResults([]);
    setCurrentIndex(0);
    onOpenChange(false);
    if (results.length > 0) {
      onComplete();
    }
  }, [isProcessing, onOpenChange, onComplete, results.length]);

  const handleExecute = useCallback(async () => {
    setStep('progress');
    setIsProcessing(true);
    const newResults: DeletionResult[] = [];

    for (let i = 0; i < contracts.length; i++) {
      const contract = contracts[i];
      setCurrentIndex(i);

      try {
        const success = await executeDeletion('contract', contract.id);
        newResults.push({
          id: contract.id,
          tenantName: contract.tenantName,
          code: contract.code,
          success,
          error: success ? undefined : 'Falha ao excluir',
        });
      } catch (err: any) {
        newResults.push({
          id: contract.id,
          tenantName: contract.tenantName,
          code: contract.code,
          success: false,
          error: err.message || 'Erro desconhecido',
        });
      }

      setResults([...newResults]);
    }

    setCurrentIndex(contracts.length);
    setIsProcessing(false);
    setStep('done');

    // Invalidate all related queries
    queryClient.invalidateQueries({ queryKey: ['contracts'] });
    queryClient.invalidateQueries({ queryKey: ['analyses'] });
    queryClient.invalidateQueries({ queryKey: ['analyses-kanban'] });
    queryClient.invalidateQueries({ queryKey: ['claims'] });
    queryClient.invalidateQueries({ queryKey: ['commissions'] });
    queryClient.invalidateQueries({ queryKey: ['agency-invoices'] });
  }, [contracts, executeDeletion, queryClient]);

  return (
    <AlertDialog open={open} onOpenChange={isProcessing ? undefined : handleClose}>
      <AlertDialogContent className="max-w-lg">
        {step === 'summary' && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Exclusão em Massa
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-destructive">Ação irreversível!</p>
                    <p className="text-muted-foreground">
                      Serão excluídos permanentemente os contratos selecionados junto com todas as
                      análises, comissões, faturas, documentos e tickets vinculados.
                    </p>
                  </div>
                </div>

                <p className="text-sm font-medium">
                  {total} contrato(s) selecionado(s):
                </p>

                <ScrollArea className="max-h-48">
                  <div className="space-y-1">
                    {contracts.map(c => (
                      <div key={c.id} className="flex items-center gap-2 text-sm py-1 px-2 rounded bg-muted/50">
                        <span className="font-mono text-xs text-muted-foreground">#{c.code}</span>
                        <span className="truncate">{c.tenantName}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <Button variant="destructive" onClick={() => setStep('confirm')}>
                Continuar
              </Button>
            </AlertDialogFooter>
          </>
        )}

        {step === 'confirm' && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-destructive">
                Tem certeza absoluta?
              </AlertDialogTitle>
              <AlertDialogDescription>
                <p className="text-sm">
                  Você está prestes a excluir permanentemente{' '}
                  <strong className="text-foreground">{total} contrato(s)</strong> e todos os dados
                  vinculados. Esta ação não pode ser desfeita.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button variant="outline" onClick={() => setStep('summary')}>
                Voltar
              </Button>
              <Button variant="destructive" onClick={handleExecute}>
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir {total} contrato(s)
              </Button>
            </AlertDialogFooter>
          </>
        )}

        {step === 'progress' && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Excluindo contratos...
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progresso</span>
                    <span>{currentIndex} / {total}</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                {currentIndex < total && (
                  <p className="text-sm text-muted-foreground">
                    Excluindo: <span className="font-mono">#{contracts[currentIndex]?.code}</span>{' '}
                    {contracts[currentIndex]?.tenantName}
                  </p>
                )}

                <ScrollArea className="max-h-32">
                  <div className="space-y-1">
                    {results.map(r => (
                      <div key={r.id} className="flex items-center gap-2 text-xs">
                        {r.success ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                        )}
                        <span className="font-mono">#{r.code}</span>
                        <span className="truncate">{r.tenantName}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </AlertDialogDescription>
            </AlertDialogHeader>
          </>
        )}

        {step === 'done' && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Exclusão Concluída</AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <div className="flex gap-3">
                  {successCount > 0 && (
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      {successCount} excluído(s)
                    </Badge>
                  )}
                  {failCount > 0 && (
                    <Badge variant="destructive">
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      {failCount} falha(s)
                    </Badge>
                  )}
                </div>

                {failCount > 0 && (
                  <ScrollArea className="max-h-32">
                    <div className="space-y-1">
                      {results.filter(r => !r.success).map(r => (
                        <div key={r.id} className="flex items-center gap-2 text-xs text-destructive">
                          <XCircle className="h-3.5 w-3.5 shrink-0" />
                          <span className="font-mono">#{r.code}</span>
                          <span className="truncate">{r.tenantName}</span>
                          {r.error && <span className="text-muted-foreground">— {r.error}</span>}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button onClick={handleClose}>Fechar</Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
