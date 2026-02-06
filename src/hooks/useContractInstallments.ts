import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ContractInstallment {
  id: string;
  contract_id: string;
  installment_number: number;
  reference_month: number;
  reference_year: number;
  value: number;
  status: 'pendente' | 'faturada' | 'paga' | 'cancelada';
  due_date: string;
  paid_at: string | null;
}

export function useContractInstallments(contractId: string | null) {
  return useQuery({
    queryKey: ['contract-installments', contractId],
    queryFn: async (): Promise<ContractInstallment[]> => {
      if (!contractId) return [];

      const { data, error } = await supabase
        .from('guarantee_installments')
        .select('*')
        .eq('contract_id', contractId)
        .order('installment_number', { ascending: true });

      if (error) {
        console.error('Error fetching installments:', error);
        return [];
      }

      return data as ContractInstallment[];
    },
    enabled: !!contractId,
  });
}
