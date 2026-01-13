import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface RejectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysisId: string;
  tenantName: string;
  onSuccess?: () => void;
}

export function RejectionModal({
  open,
  onOpenChange,
  analysisId,
  tenantName,
  onSuccess,
}: RejectionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('analyses')
        .update({
          status: 'reprovada',
          rejected_at: new Date().toISOString(),
        })
        .eq('id', analysisId);

      if (error) throw error;

      // Log timeline event
      await supabase.rpc('log_analysis_timeline_event', {
        _analysis_id: analysisId,
        _event_type: 'rejected',
        _description: 'Análise reprovada',
        _metadata: {},
      });

      queryClient.invalidateQueries({ queryKey: ['analyses-kanban'] });
      toast.success('Análise reprovada com sucesso');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error rejecting analysis:', error);
      toast.error('Erro ao reprovar análise');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Reprovar Análise
          </DialogTitle>
          <DialogDescription>
            Tem certeza que deseja reprovar a análise de <strong>{tenantName}</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-4">
          <p className="text-sm text-destructive font-medium">
            Esta ação não pode ser desfeita.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            A imobiliária será notificada sobre a reprovação.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Reprovando...
              </>
            ) : (
              'Confirmar Reprovação'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}