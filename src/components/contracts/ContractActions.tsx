import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  RefreshCw,
  AlertTriangle,
  CreditCard,
  FileText,
  History,
  XCircle,
  Edit,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import type { Database } from '@/integrations/supabase/types';

type ContractStatus = Database['public']['Enums']['contract_status'];

interface ContractActionsProps {
  contract: {
    id: string;
    status: ContractStatus;
    agency_id: string;
    analysis_id: string;
  };
  onEdit?: () => void;
}

export function ContractActions({ contract, onEdit }: ContractActionsProps) {
  const queryClient = useQueryClient();
  const [pendencyOpen, setPendencyOpen] = useState(false);
  const [paymentsOpen, setPaymentsOpen] = useState(false);
  const [commissionsOpen, setCommissionsOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  
  const [pendencyDescription, setPendencyDescription] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loadingCommissions, setLoadingCommissions] = useState(false);

  const handleOpenCommissions = async () => {
    setCommissionsOpen(true);
    setLoadingCommissions(true);
    
    try {
      const { data, error } = await supabase
        .from('commissions')
        .select('*')
        .eq('analysis_id', contract.analysis_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCommissions(data || []);
    } catch (error) {
      console.error('Error fetching commissions:', error);
      toast.error('Erro ao carregar comissões');
    } finally {
      setLoadingCommissions(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error('Informe o motivo do cancelamento');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('contracts')
        .update({
          status: 'cancelado' as ContractStatus,
          canceled_at: new Date().toISOString(),
          cancellation_reason: cancelReason,
        })
        .eq('id', contract.id);

      if (error) throw error;

      toast.success('Contrato cancelado com sucesso');
      setCancelOpen(false);
      setCancelReason('');
      queryClient.invalidateQueries({ queryKey: ['contract'] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    } catch (error) {
      console.error('Error canceling contract:', error);
      toast.error('Erro ao cancelar contrato');
    } finally {
      setLoading(false);
    }
  };

  const handleFlagPendency = async () => {
    if (!pendencyDescription.trim()) {
      toast.error('Descreva a pendência');
      return;
    }

    setLoading(true);
    try {
      // Add pendency as observation in related analysis
      const { data: current, error: fetchError } = await supabase
        .from('analyses')
        .select('observacoes')
        .eq('id', contract.analysis_id)
        .single();

      if (fetchError) throw fetchError;

      const newObservacoes = `[PENDÊNCIA ${new Date().toLocaleDateString('pt-BR')}] ${pendencyDescription}\n\n${current.observacoes || ''}`;

      const { error } = await supabase
        .from('analyses')
        .update({ observacoes: newObservacoes })
        .eq('id', contract.analysis_id);

      if (error) throw error;

      toast.success('Pendência registrada com sucesso');
      setPendencyOpen(false);
      setPendencyDescription('');
      queryClient.invalidateQueries({ queryKey: ['contract'] });
    } catch (error) {
      console.error('Error flagging pendency:', error);
      toast.error('Erro ao registrar pendência');
    } finally {
      setLoading(false);
    }
  };

  const isActive = contract.status === 'ativo';
  const canCancel = ['ativo', 'documentacao_pendente'].includes(contract.status);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setPaymentsOpen(true)}>
          <CreditCard className="h-4 w-4 mr-2" />
          Ver Pagamentos
        </Button>

        {onEdit && (
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Editar Dados
          </Button>
        )}
        
        {canCancel && (
          <Button variant="destructive" size="sm" onClick={() => setCancelOpen(true)}>
            <XCircle className="h-4 w-4 mr-2" />
            Cancelar Contrato
          </Button>
        )}
      </div>

      {/* Pendency Modal */}
      <Dialog open={pendencyOpen} onOpenChange={setPendencyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sinalizar Pendência</DialogTitle>
            <DialogDescription>
              Registre uma pendência para este contrato. Ela ficará visível no histórico.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Descrição da Pendência *</Label>
              <Textarea
                placeholder="Descreva a pendência..."
                value={pendencyDescription}
                onChange={(e) => setPendencyDescription(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendencyOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleFlagPendency} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Registrar Pendência
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payments Sheet */}
      <Sheet open={paymentsOpen} onOpenChange={setPaymentsOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Histórico de Pagamentos</SheetTitle>
            <SheetDescription>
              Pagamentos relacionados a este contrato
            </SheetDescription>
          </SheetHeader>
          <div className="py-6">
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Integração com sistema de pagamentos em desenvolvimento.</p>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Commissions Sheet */}
      <Sheet open={commissionsOpen} onOpenChange={setCommissionsOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Histórico de Comissões</SheetTitle>
            <SheetDescription>
              Comissões geradas por este contrato
            </SheetDescription>
          </SheetHeader>
          <div className="py-6">
            {loadingCommissions ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : commissions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma comissão encontrada para este contrato.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {commissions.map((commission) => (
                  <div key={commission.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium capitalize">{commission.type}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(commission.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          R$ {commission.valor?.toFixed(2)}
                        </p>
                        <p className={`text-xs ${
                          commission.status === 'paga' ? 'text-green-600' :
                          commission.status === 'pendente' ? 'text-amber-600' :
                          'text-muted-foreground'
                        }`}>
                          {commission.status}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Cancel Modal */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Cancelar Contrato</DialogTitle>
            <DialogDescription>
              Esta ação é irreversível. O contrato será cancelado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Motivo do Cancelamento *</Label>
              <Textarea
                placeholder="Informe o motivo do cancelamento..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              Voltar
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
