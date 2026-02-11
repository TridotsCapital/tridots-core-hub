import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

import { Database } from '@/integrations/supabase/types';

export interface InvoiceFilter {
  agencyId?: string;
  status?: Database['public']['Enums']['invoice_status'];
  referenceMonth?: number;
  referenceYear?: number;
  dueDateFrom?: string;
  dueDateTo?: string;
}

export const useAgencyInvoices = (filters: InvoiceFilter = {}) => {
  return useQuery({
    queryKey: ['agency_invoices', filters],
    queryFn: async () => {
      let query = supabase
        .from('agency_invoices')
        .select(`
          id,
          agency_id,
          reference_month,
          reference_year,
          status,
          total_value,
          adjusted_value,
          due_date,
          paid_at,
          paid_value,
          sent_at,
          created_at,
          agencies!inner (
            id,
            razao_social,
            nome_fantasia,
            cnpj
          )
        `)
        .order('due_date', { ascending: false });

      if (filters.agencyId) {
        query = query.eq('agency_id', filters.agencyId);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.referenceMonth) {
        query = query.eq('reference_month', filters.referenceMonth);
      }
      if (filters.referenceYear) {
        query = query.eq('reference_year', filters.referenceYear);
      }
      if (filters.dueDateFrom) {
        query = query.gte('due_date', filters.dueDateFrom);
      }
      if (filters.dueDateTo) {
        query = query.lte('due_date', filters.dueDateTo);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });
};

export const useInvoiceDetail = (invoiceId: string | null) => {
  return useQuery({
    queryKey: ['invoice_detail', invoiceId],
    queryFn: async () => {
      if (!invoiceId) return null;

      const { data, error } = await supabase
        .from('agency_invoices')
        .select(`
          *,
          agencies!inner (
            id,
            razao_social,
            nome_fantasia,
            cnpj,
            email,
            telefone
          ),
          invoice_items (
            id,
            contract_id,
            tenant_name,
            property_address,
            installment_number,
            value,
            contracts (
              id,
              data_fim_contrato
            )
          ),
          invoice_timeline (
            id,
            event_type,
            description,
            created_at,
            user_id,
            attachment_url
          )
        `)
        .eq('id', invoiceId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!invoiceId
  });
};

export const useInvoiceTimeline = (invoiceId: string) => {
  return useQuery({
    queryKey: ['invoice_timeline', invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoice_timeline')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });
};

export const useUpdateInvoiceStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      invoiceId: string;
      status: Database['public']['Enums']['invoice_status'];
      updates?: Record<string, any>;
    }) => {
      const { invoiceId, status, updates = {} } = params;

      const { data, error } = await supabase
        .from('agency_invoices')
        .update({
          status,
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency_invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice_detail'] });
    }
  });
};

export const useRegisterInvoicePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      invoiceId: string;
      paidValue: number;
      paymentProofUrl?: string;
      paymentNotes?: string;
    }) => {
      const { invoiceId, paidValue, paymentProofUrl, paymentNotes } = params;
      const paidAt = new Date().toISOString();

      // 1. Marcar fatura como paga
      const { data, error } = await supabase
        .from('agency_invoices')
        .update({
          status: 'paga',
          paid_at: paidAt,
          paid_value: paidValue,
          payment_proof_url: paymentProofUrl,
          payment_notes: paymentNotes,
          updated_at: paidAt
        })
        .eq('id', invoiceId)
        .select('*, reference_month, reference_year')
        .single();

      if (error) throw error;

      // 2. Registrar evento na timeline
      await supabase
        .from('invoice_timeline')
        .insert({
          invoice_id: invoiceId,
          event_type: 'payment_registered',
          description: `Pagamento de R$ ${paidValue.toFixed(2)} registrado`
        });

      // 3. BAIXA AUTOMÁTICA DAS PARCELAS
      const { data: items } = await supabase
        .from('invoice_items')
        .select('installment_id, contract_id')
        .eq('invoice_id', invoiceId);

      if (items && items.length > 0) {
        const installmentIds = items
          .map(item => item.installment_id)
          .filter((id): id is string => id !== null);
        
        if (installmentIds.length > 0) {
          await supabase
            .from('guarantee_installments')
            .update({ 
              status: 'paga', 
              paid_at: paidAt 
            })
            .in('id', installmentIds);
        }

        // 4. ATUALIZAR COMISSÕES: marcar de 'pendente' para 'a_pagar'
        const contractIds = [...new Set(items.map(item => item.contract_id).filter(Boolean))];
        
        if (contractIds.length > 0 && data) {
          // Buscar analysis_id dos contratos para vincular às comissões
          const { data: contracts } = await supabase
            .from('contracts')
            .select('analysis_id')
            .in('id', contractIds);

          const analysisIds = (contracts || [])
            .map(c => c.analysis_id)
            .filter(Boolean);

          if (analysisIds.length > 0) {
            // Atualizar comissões recorrentes pendentes do mês de referência da fatura
            await supabase
              .from('commissions')
              .update({ status: 'a_pagar' })
              .in('analysis_id', analysisIds)
              .eq('type', 'recorrente')
              .eq('status', 'pendente')
              .eq('mes_referencia', data.reference_month)
              .eq('ano_referencia', data.reference_year);
          }
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency_invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice_detail'] });
      queryClient.invalidateQueries({ queryKey: ['contract_installments'] });
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
    }
  });
};

export const useCancelInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      invoiceId: string;
      reason?: string;
    }) => {
      const { invoiceId, reason } = params;

      const { data: originalInvoice } = await supabase
        .from('agency_invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (!originalInvoice) throw new Error('Invoice not found');

      // Criar fatura substituta
      const { data: newInvoice, error: newError } = await supabase
        .from('agency_invoices')
        .insert({
          agency_id: originalInvoice.agency_id,
          reference_month: originalInvoice.reference_month,
          reference_year: originalInvoice.reference_year,
          status: 'rascunho',
          total_value: originalInvoice.total_value,
          due_date: originalInvoice.due_date
        })
        .select()
        .single();

      if (newError) throw newError;

      // Cancelar fatura original
      const { error: cancelError } = await supabase
        .from('agency_invoices')
        .update({
          status: 'cancelada',
          canceled_at: new Date().toISOString(),
          replacement_invoice_id: newInvoice.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId);

      if (cancelError) throw cancelError;

      // Registrar evento
      await supabase
        .from('invoice_timeline')
        .insert({
          invoice_id: invoiceId,
          event_type: 'canceled',
          description: `Fatura cancelada. ${reason || 'Sem motivo especificado'}. Nova fatura gerada: ${newInvoice.id}`
        });

      // REVERSÃO COMPLETA: Atualizar status das parcelas de volta para 'pendente'
      const { data: items } = await supabase
        .from('invoice_items')
        .select('installment_id')
        .eq('invoice_id', invoiceId);

      if (items && items.length > 0) {
        const installmentIds = items
          .map(item => item.installment_id)
          .filter((id): id is string => id !== null);
        
        if (installmentIds.length > 0) {
          await supabase
            .from('guarantee_installments')
            .update({ 
              status: 'pendente', 
              invoice_item_id: null,
              paid_at: null 
            })
            .in('id', installmentIds);
        }
      }

      return newInvoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency_invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice_detail'] });
    }
  });
};

export const useSendInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      invoiceId: string;
      boletoUrl?: string;
      boletoBarcode?: string;
    }) => {
      const { invoiceId, boletoUrl, boletoBarcode } = params;

      const updates: Record<string, any> = {
        status: 'enviada',
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (boletoUrl) updates.boleto_url = boletoUrl;
      if (boletoBarcode) updates.boleto_barcode = boletoBarcode;

      const { data, error } = await supabase
        .from('agency_invoices')
        .update(updates)
        .eq('id', invoiceId)
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('invoice_timeline')
        .insert({
          invoice_id: invoiceId,
          event_type: 'sent',
          description: 'Fatura enviada para a imobiliária'
        });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency_invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice_detail'] });
    }
  });
};

export const useAddInvoiceNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      invoiceId: string;
      description: string;
    }) => {
      const { invoiceId, description } = params;

      const { data, error } = await supabase
        .from('invoice_timeline')
        .insert({
          invoice_id: invoiceId,
          event_type: 'note_added',
          description
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice_timeline'] });
    }
  });
};
