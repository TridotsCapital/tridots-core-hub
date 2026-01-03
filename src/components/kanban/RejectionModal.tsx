import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { rejectionCategories, type RejectionCategory } from '@/types/database';

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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<RejectionCategory | ''>('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!category) {
      toast.error('Selecione uma categoria de recusa');
      return;
    }

    if (!reason.trim()) {
      toast.error('Descreva o motivo da recusa');
      return;
    }

    if (reason.trim().length < 10) {
      toast.error('O motivo deve ter pelo menos 10 caracteres');
      return;
    }

    setIsSubmitting(true);

    try {
      const categoryLabel = rejectionCategories[category as RejectionCategory].label;
      const fullReason = `[${categoryLabel}] ${reason.trim()}`;

      // Update analysis status
      const { error: updateError } = await supabase
        .from('analyses')
        .update({
          status: 'reprovada',
          rejection_reason: fullReason,
          rejected_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', analysisId);

      if (updateError) throw updateError;

      // Log timeline event
      const { error: timelineError } = await supabase.rpc('log_analysis_timeline_event', {
        _analysis_id: analysisId,
        _event_type: 'status_changed',
        _description: `Análise reprovada: ${categoryLabel}`,
        _metadata: { 
          old_status: 'em_analise', 
          new_status: 'reprovada',
          rejection_category: category,
          rejection_reason: reason.trim(),
        },
        _created_by: user?.id || null,
      });

      if (timelineError) {
        console.error('Timeline log error:', timelineError);
      }

      toast.success('Análise reprovada');
      queryClient.invalidateQueries({ queryKey: ['analyses'] });
      queryClient.invalidateQueries({ queryKey: ['analysis', analysisId] });
      queryClient.invalidateQueries({ queryKey: ['analysis-timeline', analysisId] });
      
      // Reset form
      setCategory('');
      setReason('');
      
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error rejecting analysis:', error);
      toast.error('Erro ao reprovar análise');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCategory('');
    setReason('');
    onOpenChange(false);
  };

  const isValid = category && reason.trim().length >= 10;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            Reprovar Análise
          </DialogTitle>
          <DialogDescription>
            Você está prestes a reprovar a análise de <strong>{tenantName}</strong>. 
            Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
              <p className="text-sm text-destructive">
                A imobiliária será notificada sobre a recusa. Certifique-se de fornecer 
                uma justificativa clara e profissional.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria da Recusa *</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as RejectionCategory)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motivo principal" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(rejectionCategories).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex flex-col items-start">
                      <span>{value.label}</span>
                      <span className="text-xs text-muted-foreground">{value.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Detalhamento do Motivo *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Descreva detalhadamente o motivo da recusa..."
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Mínimo de 10 caracteres. Este texto será visível para a imobiliária.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm} 
            disabled={isSubmitting || !isValid}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Recusa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
