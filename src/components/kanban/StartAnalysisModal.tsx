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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PlayCircle, UserCheck, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

interface StartAnalysisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysisId: string;
  tenantName: string;
  onSuccess?: () => void;
}

export function StartAnalysisModal({
  open,
  onOpenChange,
  analysisId,
  tenantName,
  onSuccess,
}: StartAnalysisModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedAnalyst, setSelectedAnalyst] = useState<string>(user?.id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch available analysts (masters and analysts)
  const { data: analysts = [] } = useQuery({
    queryKey: ['analysts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          role,
          profile:profiles!inner(id, full_name, email, active)
        `)
        .in('role', ['master', 'analyst']);

      if (error) throw error;

      // Filter active users and deduplicate
      const uniqueUsers = new Map();
      data?.forEach((item: any) => {
        if (item.profile?.active && !uniqueUsers.has(item.user_id)) {
          uniqueUsers.set(item.user_id, {
            id: item.user_id,
            full_name: item.profile.full_name,
            email: item.profile.email,
          });
        }
      });

      return Array.from(uniqueUsers.values());
    },
  });

  const handleConfirm = async () => {
    if (!selectedAnalyst) {
      toast.error('Selecione um analista responsável');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get analyst name for timeline
      const analyst = analysts.find(a => a.id === selectedAnalyst);
      const analystName = analyst?.full_name || 'Analista';

      // Update analysis status and assign analyst
      const { error: updateError } = await supabase
        .from('analyses')
        .update({
          status: 'em_analise',
          analyst_id: selectedAnalyst,
          updated_at: new Date().toISOString(),
        })
        .eq('id', analysisId);

      if (updateError) throw updateError;

      // Log timeline event
      const { error: timelineError } = await supabase.rpc('log_analysis_timeline_event', {
        _analysis_id: analysisId,
        _event_type: 'analysis_started',
        _description: `Análise iniciada - Responsável: ${analystName}`,
        _metadata: { analyst_id: selectedAnalyst, analyst_name: analystName },
        _created_by: user?.id || null,
      });

      if (timelineError) {
        console.error('Timeline log error:', timelineError);
      }

      toast.success('Análise iniciada com sucesso');
      queryClient.invalidateQueries({ queryKey: ['analyses'] });
      queryClient.invalidateQueries({ queryKey: ['analysis', analysisId] });
      queryClient.invalidateQueries({ queryKey: ['analysis-timeline', analysisId] });
      
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error starting analysis:', error);
      toast.error('Erro ao iniciar análise');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-primary" />
            Iniciar Análise
          </DialogTitle>
          <DialogDescription>
            Você está prestes a iniciar a análise de <strong>{tenantName}</strong>. 
            Selecione o analista responsável.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="analyst" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Analista Responsável
            </Label>
            <Select value={selectedAnalyst} onValueChange={setSelectedAnalyst}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um analista" />
              </SelectTrigger>
              <SelectContent>
                {analysts.map((analyst) => (
                  <SelectItem key={analyst.id} value={analyst.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {getInitials(analyst.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{analyst.full_name}</span>
                      {analyst.id === user?.id && (
                        <span className="text-xs text-muted-foreground">(você)</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
            <p>
              Ao confirmar, o status será alterado para <strong>"Em Análise"</strong> e 
              o analista selecionado será notificado como responsável.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting || !selectedAnalyst}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
