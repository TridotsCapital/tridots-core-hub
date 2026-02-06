import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useInvoiceAnalytics = (filters?: { fromDate?: string; toDate?: string }) => {
  return useQuery({
    queryKey: ['invoice_analytics', filters],
    queryFn: async () => {
      let query = supabase
        .from('agency_invoices')
        .select('*', { count: 'exact' });

      if (filters?.fromDate) {
        query = query.gte('due_date', filters.fromDate);
      }
      if (filters?.toDate) {
        query = query.lte('due_date', filters.toDate);
      }

      const { data: invoices } = await query;

      const totalToReceive = invoices?.reduce((sum, inv) => {
        if (['rascunho', 'gerada', 'enviada', 'atrasada'].includes(inv.status)) {
          return sum + (inv.adjusted_value || inv.total_value || 0);
        }
        return sum;
      }, 0) || 0;

      const totalReceived = invoices?.reduce((sum, inv) => {
        if (inv.status === 'paga') {
          return sum + (inv.paid_value || inv.adjusted_value || inv.total_value || 0);
        }
        return sum;
      }, 0) || 0;

      const totalOverdue = invoices?.reduce((sum, inv) => {
        if (inv.status === 'atrasada') {
          return sum + (inv.adjusted_value || inv.total_value || 0);
        }
        return sum;
      }, 0) || 0;

      // Contar agências bloqueadas
      const { data: blockedAgencies } = await supabase
        .from('agencies')
        .select('id', { count: 'exact' })
        .eq('billing_status', 'bloqueada');

      // Alertas de faturas vencendo nos próximos 5 dias
      const fiveDaysFromNow = new Date();
      fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);

      const { data: alertInvoices } = await supabase
        .from('agency_invoices')
        .select('*')
        .in('status', ['rascunho', 'gerada', 'enviada'])
        .lte('due_date', fiveDaysFromNow.toISOString().split('T')[0])
        .gte('due_date', new Date().toISOString().split('T')[0]);

      return {
        totalToReceive,
        totalReceived,
        totalOverdue,
        blockedAgenciesCount: blockedAgencies?.length || 0,
        alertsCount: alertInvoices?.length || 0,
        invoices
      };
    }
  });
};

export const useMonthlyInvoiceEvolution = () => {
  return useQuery({
    queryKey: ['invoice_evolution'],
    queryFn: async () => {
      const { data } = await supabase
        .from('agency_invoices')
        .select('reference_month, reference_year, total_value, status')
        .order('reference_year', { ascending: false })
        .order('reference_month', { ascending: false })
        .limit(12);

      // Agrupar por mês/ano
      const evolution = data?.reduce((acc: any[], invoice) => {
        const month = `${invoice.reference_month.toString().padStart(2, '0')}/${invoice.reference_year}`;
        const existing = acc.find(item => item.month === month);

        if (existing) {
          existing.total += invoice.total_value || 0;
          if (invoice.status === 'paga') {
            existing.paid += invoice.total_value || 0;
          }
        } else {
          acc.push({
            month,
            total: invoice.total_value || 0,
            paid: invoice.status === 'paga' ? invoice.total_value || 0 : 0
          });
        }

        return acc;
      }, []) || [];

      return evolution.reverse();
    }
  });
};
