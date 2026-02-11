import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  billingDueDay: number | null;
}

/**
 * Hook para buscar resumo mensal de faturas (para gráfico de barras)
 */
export const useMonthlyInvoiceSummary = (agencyId?: string) => {
  return useQuery({
    queryKey: ['monthly_invoice_summary', agencyId],
    queryFn: async (): Promise<MonthSummary[]> => {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      
      const startYear = 2026;
      const startMonth = 1;
      const endYear = currentYear + 1;
      const endMonth = currentMonth;
      
      const months: MonthSummary[] = [];
      
      let year = startYear;
      let month = startMonth;
      
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

      // Faturas existentes (agora sempre existem)
      let invoiceQuery = supabase
        .from('agency_invoices')
        .select('reference_month, reference_year, total_value, status, due_date, agency_id');
      
      if (agencyId) {
        invoiceQuery = invoiceQuery.eq('agency_id', agencyId);
      }

      const { data: invoices, error: invoiceError } = await invoiceQuery;
      if (invoiceError) throw invoiceError;

      // Mapear faturas existentes
      const invoiceMap = new Map<string, { value: number; status: string; count: number; dueDate: string }>();
      
      for (const inv of invoices || []) {
        const key = `${inv.reference_month}-${inv.reference_year}`;
        const existing = invoiceMap.get(key);
        if (existing) {
          existing.value += inv.total_value || 0;
          existing.count++;
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

      return months.map(m => {
        const key = `${m.month}-${m.year}`;
        const invoice = invoiceMap.get(key);
        
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
        
        return m;
      });
    }
  });
};

/**
 * Hook para buscar imobiliárias com fatura em um mês específico (para Tridots)
 * Simplificado: faturas sempre existem (criadas na ativação do contrato)
 */
export const useAgenciesWithInvoiceInMonth = (month: number, year: number) => {
  return useQuery({
    queryKey: ['agencies_invoice_month', month, year],
    queryFn: async (): Promise<AgencyInvoiceSummary[]> => {
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
            cnpj,
            billing_due_day
          )
        `)
        .eq('reference_month', month)
        .eq('reference_year', year)
        .neq('status', 'cancelada');

      if (invoiceError) throw invoiceError;

      const results: AgencyInvoiceSummary[] = (invoices || []).map((inv) => ({
        agencyId: inv.agency_id,
        agencyName: (inv.agencies as any)?.razao_social || '',
        cnpj: (inv.agencies as any)?.cnpj || '',
        invoiceId: inv.id,
        totalValue: inv.total_value || 0,
        dueDate: inv.due_date,
        status: inv.status as AgencyInvoiceSummary['status'],
        billingDueDay: (inv.agencies as any)?.billing_due_day || null
      }));

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

      return [];
    },
    enabled: !!agencyId && month > 0 && year > 0
  });
};
