import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { claimInternalStatusConfig, ClaimInternalStatus } from '@/types/claims';

interface ClaimStatusTransitionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fromStatus: ClaimInternalStatus;
  toStatus: ClaimInternalStatus;
  warning?: string;
  onConfirm: (justification: string) => void;
  isPending?: boolean;
}

export function ClaimStatusTransitionModal({
  open,
  onOpenChange,
  fromStatus,
  toStatus,
  warning,
  onConfirm,
  isPending,
}: ClaimStatusTransitionModalProps) {
  const [justification, setJustification] = useState('');

  const fromConfig = claimInternalStatusConfig[fromStatus];
  const toConfig = claimInternalStatusConfig[toStatus];

  const handleConfirm = () => {
    onConfirm(justification);
    setJustification('');
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {warning && <AlertTriangle className="h-5 w-5 text-amber-500" />}
            Confirmar Transição de Status
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <div className="flex items-center justify-center gap-3 py-4">
              <Badge className={`${fromConfig.bgColor} ${fromConfig.color}`}>
                {fromConfig.label}
              </Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <Badge className={`${toConfig.bgColor} ${toConfig.color}`}>
                {toConfig.label}
              </Badge>
            </div>

            {warning && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-700">{warning}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="justification">
                Justificativa {warning ? '(obrigatória)' : '(opcional)'}
              </Label>
              <Textarea
                id="justification"
                placeholder="Descreva o motivo da transição..."
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                rows={3}
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending || (!!warning && !justification.trim())}
          >
            {isPending ? 'Salvando...' : 'Confirmar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
