import { useState } from 'react';
import { Analysis, AnalysisStatus, statusConfig } from '@/types/database';
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
import { ArrowRight, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface StatusChangeConfirmationProps {
  analysis: Analysis | null;
  newStatus: AnalysisStatus | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason?: string) => void;
}

export function StatusChangeConfirmation({
  analysis,
  newStatus,
  open,
  onOpenChange,
  onConfirm,
}: StatusChangeConfirmationProps) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm(reason || undefined);
    setReason('');
  };

  if (!analysis || !newStatus) return null;

  const isCritical = ['reprovada', 'cancelada'].includes(newStatus);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {isCritical && <AlertTriangle className="h-5 w-5 text-warning" />}
            Confirmar mudança de status
          </AlertDialogTitle>
          <AlertDialogDescription>
            Você está prestes a alterar o status da análise de{' '}
            <strong>{analysis.inquilino_nome}</strong>.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Status change visualization */}
        <div className="flex items-center justify-center gap-4 py-4">
          <Badge 
            variant="secondary" 
            className={`status-badge ${statusConfig[analysis.status].class}`}
          >
            {statusConfig[analysis.status].label}
          </Badge>
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
          <Badge 
            variant="secondary" 
            className={`status-badge ${statusConfig[newStatus].class}`}
          >
            {statusConfig[newStatus].label}
          </Badge>
        </div>

        {/* Reason field for critical changes */}
        {isCritical && (
          <div className="space-y-2">
            <Label htmlFor="reason">Justificativa (opcional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={`Por que esta análise está sendo ${newStatus === 'reprovada' ? 'reprovada' : 'cancelada'}?`}
              rows={3}
            />
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setReason('')}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            Confirmar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
