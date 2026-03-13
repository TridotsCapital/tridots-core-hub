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
      // 1. Cancelar o contrato
      const { error } = await supabase
        .from('contracts')
        .update({
          status: 'cancelado' as ContractStatus,
          canceled_at: new Date().toISOString(),
          cancellation_reason: cancelReason,
        })
        .eq('id', contract.id);

      if (error) throw error;

      // 2. Verificar parcelas pagas vs total para parcela compensatória
      await generateCompensatoryInstallmentIfNeeded(contract.id, contract.agency_id, contract.analysis_id);

      toast.success('Contrato cancelado com sucesso');
      setCancelOpen(false);
      setCancelReason('');
      queryClient.invalidateQueries({ queryKey: ['contract'] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['contract-installments'] });
    } catch (error) {
      console.error('Error canceling contract:', error);
      toast.error('Erro ao cancelar contrato');
    } finally {
      setLoading(false);
    }
  };

  const generateCompensatoryInstallmentIfNeeded = async (
    contractId: string,
    agencyId: string,
    analysisId: string
  ) => {
    try {
      // Contar parcelas pagas
      const { count: paidCount } = await supabase
        .from('guarantee_installments')
        .select('*', { count: 'exact', head: true })
        .eq('contract_id', contractId)
        .eq('status', 'paga');

      // Se já pagou 12 ou mais, não precisa compensar
      if ((paidCount || 0) >= 12) return;

      // Buscar dados necessários
      const [{ data: lastInstallment }, { data: agency }, { data: analysis }] = await Promise.all([
        supabase
          .from('guarantee_installments')
          .select('value, reference_month, reference_year')
          .eq('contract_id', contractId)
          .order('installment_number', { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from('agencies')
          .select('billing_due_day')
          .eq('id', agencyId)
          .single(),
        supabase
          .from('analyses')
          .select('inquilino_nome, imovel_endereco, imovel_numero, imovel_bairro, imovel_cidade')
          .eq('id', analysisId)
          .single(),
      ]);

      if (!lastInstallment) return;

      const billingDueDay = agency?.billing_due_day || 10;
      const now = new Date();
      // Parcela compensatória no mês seguinte ao cancelamento
      let compMonth = now.getMonth() + 1; // próximo mês (0-indexed)
      let compYear = now.getFullYear();
      if (compMonth > 11) {
        compMonth = 0;
        compYear++;
      }
      const refMonth = compMonth + 1; // 1-12
      const refYear = compYear;
      const dueDate = new Date(compYear, compMonth, billingDueDay);

      // Contar total de parcelas existentes para definir o número
      const { count: totalCount } = await supabase
        .from('guarantee_installments')
        .select('*', { count: 'exact', head: true })
        .eq('contract_id', contractId);

      const installmentNumber = (totalCount || 12) + 1;

      // Inserir parcela compensatória
      const { data: newInstallment, error: instError } = await supabase
        .from('guarantee_installments')
        .insert({
          contract_id: contractId,
          agency_id: agencyId,
          installment_number: installmentNumber,
          reference_month: refMonth,
          reference_year: refYear,
          value: lastInstallment.value,
          due_date: dueDate.toISOString().split('T')[0],
          status: 'pendente' as const,
        })
        .select()
        .single();

      if (instError) {
        console.error('Error creating compensatory installment:', instError);
        return;
      }

      // Vincular à fatura existente ou criar nova
      const { data: existingInvoice } = await supabase
        .from('agency_invoices')
        .select('id, total_value')
        .eq('agency_id', agencyId)
        .eq('reference_month', refMonth)
        .eq('reference_year', refYear)
        .neq('status', 'cancelada')
        .maybeSingle();

      let invoiceId: string;
      const tenantName = analysis?.inquilino_nome || 'N/A';
      const propertyAddress = [
        analysis?.imovel_endereco,
        analysis?.imovel_numero,
        analysis?.imovel_bairro,
        analysis?.imovel_cidade,
      ].filter(Boolean).join(', ') || 'N/A';

      if (existingInvoice) {
        invoiceId = existingInvoice.id;
        await supabase
          .from('agency_invoices')
          .update({
            total_value: (existingInvoice.total_value || 0) + lastInstallment.value,
            updated_at: new Date().toISOString(),
          })
          .eq('id', invoiceId);
      } else {
        const { data: newInvoice, error: invError } = await supabase
          .from('agency_invoices')
          .insert({
            agency_id: agencyId,
            reference_month: refMonth,
            reference_year: refYear,
            status: 'rascunho',
            total_value: lastInstallment.value,
            due_date: dueDate.toISOString().split('T')[0],
          })
          .select()
          .single();

        if (invError) {
          console.error('Error creating compensatory invoice:', invError);
          return;
        }
        invoiceId = newInvoice.id;
      }

      // Criar invoice_item
      const { data: invoiceItem } = await supabase
        .from('invoice_items')
        .insert({
          invoice_id: invoiceId,
          installment_id: newInstallment.id,
          contract_id: contractId,
          tenant_name: tenantName,
          property_address: propertyAddress,
          installment_number: installmentNumber,
          value: lastInstallment.value,
        })
        .select()
        .single();

      if (invoiceItem) {
        await supabase
          .from('guarantee_installments')
          .update({ status: 'faturada', invoice_item_id: invoiceItem.id })
          .eq('id', newInstallment.id);
      }

      // Registrar na timeline
      await supabase.rpc('log_analysis_timeline_event', {
        _analysis_id: analysisId,
        _event_type: 'compensatory_installment',
        _description: `Parcela compensatória #${installmentNumber} gerada (R$ ${lastInstallment.value.toFixed(2)}) para ${String(refMonth).padStart(2, '0')}/${refYear} devido ao cancelamento antecipado do contrato. Parcelas pagas: ${paidCount || 0}/12.`,
        _metadata: {
          contract_id: contractId,
          installment_id: newInstallment.id,
          paid_count: paidCount || 0,
          compensatory_month: refMonth,
          compensatory_year: refYear,
        },
      });

      console.log(`Compensatory installment created for contract ${contractId}: ${refMonth}/${refYear}`);
    } catch (err) {
      console.error('Error generating compensatory installment:', err);
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
