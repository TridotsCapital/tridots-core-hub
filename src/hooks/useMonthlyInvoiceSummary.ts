import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface MonthSummary {
  month: number;
  year: number;
  totalValue: number;
  status: 'paga' | 'atrasada' | 'pendente' | 'futura';
  invoiceCount: number;
  hasInvoice: boolean;
  dueDate?: string;
}

export interface AgencyInvoiceSummary {
  agencyId: string;
  agencyName: string;
  cnpj: string;
  invoiceId: string | null;
  totalValue: number;
  dueDate: string;
  status: 'paga' | 'atrasada' | 'pendente' | 'futura' | 'rascunho' | 'gerada' | 'enviada';
}

/**
 * Hook para buscar resumo mensal de faturas (para gráfico de barras)
 * Consolida dados de agency_invoices + guarantee_installments pendentes
 */
export const useMonthlyInvoiceSummary = (agencyId?: string) => {
  return useQuery({
    queryKey: ['monthly_invoice_summary', agencyId],
    queryFn: async (): Promise<MonthSummary[]> => {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      
      // Start from January 2026 (system billing start date)
      const startYear = 2026;
      const startMonth = 1;
      
      // End at current month + 12 months into the future
      const endYear = currentYear + 1;
      const endMonth = currentMonth;
      
      const months: MonthSummary[] = [];
      
      let year = startYear;
      let month = startMonth;
      
      // Generate months from Jan/2026 until current month + 12 months
      while (year < endYear || (year === endYear && month <= endMonth)) {
        months.push({
          month,
          year,
          totalValue: 0,
          status: 'futura',
          invoiceCount: 0,
          hasInvoice: false
        });
        
        month++;
        if (month > 12) {
          month = 1;
          year++;
        }
      }

      // Query 1: Faturas existentes
      let invoiceQuery = supabase
        .from('agency_invoices')
        .select('reference_month, reference_year, total_value, status, due_date, agency_id');
      
      if (agencyId) {
        invoiceQuery = invoiceQuery.eq('agency_id', agencyId);
      }

      const { data: invoices, error: invoiceError } = await invoiceQuery;
      if (invoiceError) throw invoiceError;

      // Query 2: Parcelas pendentes (sem fatura gerada)
      let installmentQuery = supabase
        .from('guarantee_installments')
        .select(`
          reference_month,
          reference_year,
          value,
          due_date,
          contract_id,
          contracts!inner (agency_id)
        `)
        .eq('status', 'pendente')
        .is('invoice_item_id', null);

      if (agencyId) {
        installmentQuery = installmentQuery.eq('contracts.agency_id', agencyId);
      }

      const { data: installments, error: installmentError } = await installmentQuery;
      if (installmentError) throw installmentError;

      // Mapear faturas existentes
      const invoiceMap = new Map<string, { value: number; status: string; count: number; dueDate: string }>();
      
      for (const inv of invoices || []) {
        const key = `${inv.reference_month}-${inv.reference_year}`;
        const existing = invoiceMap.get(key);
        if (existing) {
          existing.value += inv.total_value || 0;
          existing.count++;
          // Priorizar status mais crítico
          if (inv.status === 'atrasada' || (inv.status !== 'paga' && existing.status === 'paga')) {
            existing.status = inv.status;
          }
        } else {
          invoiceMap.set(key, {
            value: inv.total_value || 0,
            status: inv.status,
            count: 1,
            dueDate: inv.due_date
          });
        }
      }

      // Mapear parcelas pendentes (meses futuros)
      const pendingMap = new Map<string, { value: number; dueDate: string }>();
      
      for (const inst of installments || []) {
        const key = `${inst.reference_month}-${inst.reference_year}`;
        const existing = pendingMap.get(key);
        if (existing) {
          existing.value += inst.value || 0;
        } else {
          pendingMap.set(key, {
            value: inst.value || 0,
            dueDate: inst.due_date
          });
        }
      }

      // Consolidar dados
      return months.map(m => {
        const key = `${m.month}-${m.year}`;
        const invoice = invoiceMap.get(key);
        const pending = pendingMap.get(key);
        
        if (invoice) {
          return {
            ...m,
            totalValue: invoice.value,
            status: invoice.status as MonthSummary['status'],
            invoiceCount: invoice.count,
            hasInvoice: true,
            dueDate: invoice.dueDate
          };
        }
        
        if (pending) {
          return {
            ...m,
            totalValue: pending.value,
            status: 'futura' as const,
            invoiceCount: 0,
            hasInvoice: false,
            dueDate: pending.dueDate
          };
        }
        
        return m;
      });
    }
  });
};

/**
 * Hook para buscar imobiliárias com fatura/parcelas em um mês específico (para Tridots)
 */
export const useAgenciesWithInvoiceInMonth = (month: number, year: number) => {
  return useQuery({
    queryKey: ['agencies_invoice_month', month, year],
    queryFn: async (): Promise<AgencyInvoiceSummary[]> => {
      const results: AgencyInvoiceSummary[] = [];
      
      // Query 1: Faturas existentes para o mês
      const { data: invoices, error: invoiceError } = await supabase
        .from('agency_invoices')
        .select(`
          id,
          agency_id,
          total_value,
          due_date,
          status,
          agencies!inner (
            id,
            razao_social,
            cnpj
          )
        `)
        .eq('reference_month', month)
        .eq('reference_year', year)
        .neq('status', 'cancelada');

      if (invoiceError) throw invoiceError;

      // Adicionar faturas existentes
      const agenciesWithInvoice = new Set<string>();
      for (const inv of invoices || []) {
        agenciesWithInvoice.add(inv.agency_id);
        results.push({
          agencyId: inv.agency_id,
          agencyName: (inv.agencies as any)?.razao_social || '',
          cnpj: (inv.agencies as any)?.cnpj || '',
          invoiceId: inv.id,
          totalValue: inv.total_value || 0,
          dueDate: inv.due_date,
          status: inv.status as AgencyInvoiceSummary['status']
        });
      }

      // Query 2: Parcelas pendentes sem fatura (para meses futuros)
      const { data: installments, error: installmentError } = await supabase
        .from('guarantee_installments')
        .select(`
          value,
          due_date,
          contracts!inner (
            agency_id,
            agencies!inner (
              id,
              razao_social,
              cnpj
            )
          )
        `)
        .eq('reference_month', month)
        .eq('reference_year', year)
        .eq('status', 'pendente')
        .is('invoice_item_id', null);

      if (installmentError) throw installmentError;

      // Agrupar parcelas por agência
      const pendingByAgency = new Map<string, { value: number; dueDate: string; name: string; cnpj: string }>();
      
      for (const inst of installments || []) {
        const agencyId = (inst.contracts as any)?.agency_id;
        if (!agencyId || agenciesWithInvoice.has(agencyId)) continue;
        
        const existing = pendingByAgency.get(agencyId);
        if (existing) {
          existing.value += inst.value || 0;
        } else {
          pendingByAgency.set(agencyId, {
            value: inst.value || 0,
            dueDate: inst.due_date,
            name: (inst.contracts as any)?.agencies?.razao_social || '',
            cnpj: (inst.contracts as any)?.agencies?.cnpj || ''
          });
        }
      }

      // Adicionar agências com apenas parcelas pendentes
      for (const [agencyId, data] of pendingByAgency) {
        results.push({
          agencyId,
          agencyName: data.name,
          cnpj: data.cnpj,
          invoiceId: null,
          totalValue: data.value,
          dueDate: data.dueDate,
          status: 'futura'
        });
      }

      return results.sort((a, b) => a.agencyName.localeCompare(b.agencyName));
    },
    enabled: month > 0 && year > 0
  });
};

/**
 * Hook para buscar detalhes de parcelas de uma agência em um mês (para portal da Agência)
 */
export const useAgencyMonthInstallments = (agencyId: string | undefined, month: number, year: number) => {
  return useQuery({
    queryKey: ['agency_month_installments', agencyId, month, year],
    queryFn: async () => {
      if (!agencyId) return [];

      // Primeiro buscar fatura existente
      const { data: invoice } = await supabase
        .from('agency_invoices')
        .select(`
          id,
          status,
          invoice_items (
            id,
            contract_id,
            tenant_name,
            property_address,
            installment_number,
            value,
            installment_id
          )
        `)
        .eq('agency_id', agencyId)
        .eq('reference_month', month)
        .eq('reference_year', year)
        .neq('status', 'cancelada')
        .maybeSingle();

      if (invoice?.invoice_items) {
        // Para itens de fatura existente, buscar o analysis_id de cada contrato
        const contractIds = invoice.invoice_items.map((item: any) => item.contract_id).filter(Boolean);
        
        let contractsMap: Record<string, string> = {};
        if (contractIds.length > 0) {
          const { data: contracts } = await supabase
            .from('contracts')
            .select('id, analysis_id')
            .in('id', contractIds);
          
          contractsMap = (contracts || []).reduce((acc: Record<string, string>, c: any) => {
            acc[c.id] = c.analysis_id;
            return acc;
          }, {});
        }

        return invoice.invoice_items.map((item: any) => ({
          ...item,
          analysis_id: contractsMap[item.contract_id] || null,
          invoiceStatus: invoice.status,
          hasInvoice: true
        }));
      }

      // Se não há fatura, buscar parcelas pendentes
      const { data: installments, error } = await supabase
        .from('guarantee_installments')
        .select(`
          id,
          installment_number,
          value,
          due_date,
          status,
          contract_id,
          contracts!inner (
            agency_id,
            analysis_id,
            analyses!inner (
              inquilino_nome,
              imovel_endereco,
              imovel_numero
            )
          )
        `)
        .eq('contracts.agency_id', agencyId)
        .eq('reference_month', month)
        .eq('reference_year', year)
        .eq('status', 'pendente');

      if (error) throw error;

      return (installments || []).map((inst: any) => ({
        id: inst.id,
        contract_id: inst.contract_id,
        analysis_id: inst.contracts?.analysis_id,
        tenant_name: inst.contracts?.analyses?.inquilino_nome || 'N/A',
        property_address: `${inst.contracts?.analyses?.imovel_endereco || ''}, ${inst.contracts?.analyses?.imovel_numero || ''}`,
        installment_number: inst.installment_number,
        value: inst.value,
        invoiceStatus: 'futura',
        hasInvoice: false
      }));
    },
    enabled: !!agencyId && month > 0 && year > 0
  });
};
