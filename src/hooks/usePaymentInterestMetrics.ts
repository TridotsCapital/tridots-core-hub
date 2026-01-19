import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AgencyInterest {
  agency_id: string | null;
  agency_name: string | null;
  clicks: number;
  last_click: string;
}

interface PaymentInterestMetrics {
  totalClicks: number;
  uniqueAgencies: number;
  clicksToday: number;
  clicksByAgency: AgencyInterest[];
}

export function usePaymentInterestMetrics() {
  return useQuery({
    queryKey: ['payment-interest-metrics'],
    queryFn: async (): Promise<PaymentInterestMetrics> => {
      // Fetch all clicks
      const { data: clicks, error } = await supabase
        .from('payment_option_interest_clicks')
        .select('id, agency_id, created_at')
        .eq('option_key', 'boleto_imobiliaria')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get unique agency IDs (excluding nulls for count)
      const agencyIds = [...new Set(clicks?.filter(c => c.agency_id).map(c => c.agency_id))];

      // Fetch agency names
      let agencyMap: Record<string, string> = {};
      if (agencyIds.length > 0) {
        const { data: agencies } = await supabase
          .from('agencies')
          .select('id, nome_fantasia, razao_social')
          .in('id', agencyIds);

        agencies?.forEach(a => {
          agencyMap[a.id] = a.nome_fantasia || a.razao_social;
        });
      }

      // Group clicks by agency
      const clicksByAgencyMap: Record<string, { clicks: number; last_click: string }> = {};
      
      clicks?.forEach(click => {
        const key = click.agency_id || 'unknown';
        if (!clicksByAgencyMap[key]) {
          clicksByAgencyMap[key] = { clicks: 0, last_click: click.created_at };
        }
        clicksByAgencyMap[key].clicks++;
        if (click.created_at > clicksByAgencyMap[key].last_click) {
          clicksByAgencyMap[key].last_click = click.created_at;
        }
      });

      const clicksByAgency: AgencyInterest[] = Object.entries(clicksByAgencyMap).map(([agency_id, data]) => ({
        agency_id: agency_id === 'unknown' ? null : agency_id,
        agency_name: agency_id === 'unknown' ? 'Não identificada' : (agencyMap[agency_id] || 'Desconhecida'),
        clicks: data.clicks,
        last_click: data.last_click,
      }));

      // Sort by clicks descending
      clicksByAgency.sort((a, b) => b.clicks - a.clicks);

      // Calculate today's clicks
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const clicksToday = clicks?.filter(c => new Date(c.created_at) >= today).length || 0;

      return {
        totalClicks: clicks?.length || 0,
        uniqueAgencies: agencyIds.length,
        clicksToday,
        clicksByAgency,
      };
    },
  });
}
