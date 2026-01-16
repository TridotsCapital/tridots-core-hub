import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calculateCoverage } from '@/lib/plans';

interface ClaimCoverageData {
  totalCoverage: number;
  totalUsed: number;
  programmedAmount: number;
  totalAvailable: number;
  percentUsed: number;
}

export function useClaimCoverage(contractId: string | undefined) {
  return useQuery({
    queryKey: ['claim-coverage', contractId],
    queryFn: async (): Promise<ClaimCoverageData> => {
      if (!contractId) {
        return {
          totalCoverage: 0,
          totalUsed: 0,
          programmedAmount: 0,
          totalAvailable: 0,
          percentUsed: 0,
        };
      }

      // Fetch contract with analysis to get total coverage
      const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .select(`
          id,
          analysis:analyses (
            valor_aluguel,
            valor_condominio,
            valor_iptu
          )
        `)
        .eq('id', contractId)
        .single();

      if (contractError || !contract?.analysis) {
        console.error('Error fetching contract for coverage:', contractError);
        return {
          totalCoverage: 0,
          totalUsed: 0,
          programmedAmount: 0,
          totalAvailable: 0,
          percentUsed: 0,
        };
      }

      const analysis = contract.analysis as {
        valor_aluguel: number;
        valor_condominio: number | null;
        valor_iptu: number | null;
      };

      const valorTotal = 
        (analysis.valor_aluguel || 0) + 
        (analysis.valor_condominio || 0) + 
        (analysis.valor_iptu || 0);

      const totalCoverage = calculateCoverage(valorTotal);

      // Fetch all claim items for this contract (from all claims)
      const { data: claims, error: claimsError } = await supabase
        .from('claims')
        .select(`
          id,
          public_status,
          claim_items (
            amount,
            category
          )
        `)
        .eq('contract_id', contractId)
        .is('canceled_at', null);

      if (claimsError) {
        console.error('Error fetching claims for coverage:', claimsError);
        return {
          totalCoverage,
          totalUsed: 0,
          programmedAmount: 0,
          totalAvailable: totalCoverage,
          percentUsed: 0,
        };
      }

      // Calculate used and programmed amounts
      let totalUsed = 0;
      let programmedAmount = 0;

      claims?.forEach((claim) => {
        const claimItems = claim.claim_items || [];
        const itemsTotal = claimItems.reduce((sum: number, item: { amount: number }) => sum + (item.amount || 0), 0);

        if (claim.public_status === 'finalizado') {
          // Finalized claims count as used
          totalUsed += itemsTotal;
        } else if (claim.public_status === 'pagamento_programado') {
          // Programmed payments count towards consumption
          programmedAmount += itemsTotal;
          totalUsed += itemsTotal;
        } else {
          // In analysis or pending claims also count towards consumption
          programmedAmount += itemsTotal;
          totalUsed += itemsTotal;
        }
      });

      const totalAvailable = Math.max(0, totalCoverage - totalUsed);
      const percentUsed = totalCoverage > 0 ? (totalUsed / totalCoverage) * 100 : 0;

      return {
        totalCoverage,
        totalUsed,
        programmedAmount,
        totalAvailable,
        percentUsed: Math.min(100, percentUsed),
      };
    },
    enabled: !!contractId,
    staleTime: 30000, // 30 seconds
  });
}