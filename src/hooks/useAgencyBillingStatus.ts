import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAgencyUser } from "./useAgencyUser";

export interface AgencyBillingStatus {
  billingStatus: 'em_dia' | 'atrasada' | 'bloqueada' | null;
  billingBlockedAt: string | null;
  billingDueDay: number | null;
  isBlocked: boolean;
  hasOverdueInvoices: boolean;
}

export function useAgencyBillingStatus() {
  const { data: agencyUser } = useAgencyUser();
  const agencyId = agencyUser?.agency_id;

  return useQuery({
    queryKey: ['agency-billing-status', agencyId],
    queryFn: async (): Promise<AgencyBillingStatus> => {
      if (!agencyId) {
        return {
          billingStatus: null,
          billingBlockedAt: null,
          billingDueDay: null,
          isBlocked: false,
          hasOverdueInvoices: false,
        };
      }

      // Fetch agency billing info
      const { data: agency, error } = await supabase
        .from('agencies')
        .select('billing_status, billing_blocked_at, billing_due_day')
        .eq('id', agencyId)
        .single();

      if (error) {
        console.error('Error fetching agency billing status:', error);
        return {
          billingStatus: null,
          billingBlockedAt: null,
          billingDueDay: null,
          isBlocked: false,
          hasOverdueInvoices: false,
        };
      }

      // Check for overdue invoices
      const { data: overdueInvoices } = await supabase
        .from('agency_invoices')
        .select('id')
        .eq('agency_id', agencyId)
        .eq('status', 'atrasada')
        .limit(1);

      const hasOverdueInvoices = (overdueInvoices?.length || 0) > 0;

      return {
        billingStatus: agency?.billing_status as AgencyBillingStatus['billingStatus'],
        billingBlockedAt: agency?.billing_blocked_at || null,
        billingDueDay: agency?.billing_due_day || null,
        isBlocked: agency?.billing_blocked_at !== null,
        hasOverdueInvoices,
      };
    },
    enabled: !!agencyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
