import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface LinkedEntity {
  type: 'analysis' | 'contract' | 'claim';
  id: string;
}

// Get linked entities for an Analysis
export function useLinkedEntitiesForAnalysis(analysisId: string | undefined) {
  return useQuery({
    queryKey: ['linked-entities', 'analysis', analysisId],
    queryFn: async (): Promise<LinkedEntity[]> => {
      if (!analysisId) return [];
      
      const entities: LinkedEntity[] = [];

      // Get contract linked to this analysis
      const { data: contract } = await supabase
        .from('contracts')
        .select('id')
        .eq('analysis_id', analysisId)
        .maybeSingle();

      if (contract) {
        entities.push({ type: 'contract', id: contract.id });

        // Get active claim for the contract
        const { data: claim } = await supabase
          .from('claims')
          .select('id')
          .eq('contract_id', contract.id)
          .is('canceled_at', null)
          .maybeSingle();

        if (claim) {
          entities.push({ type: 'claim', id: claim.id });
        }
      }

      return entities;
    },
    enabled: !!analysisId,
  });
}

// Get linked entities for a Contract
export function useLinkedEntitiesForContract(contractId: string | undefined, analysisId: string | undefined) {
  return useQuery({
    queryKey: ['linked-entities', 'contract', contractId, analysisId],
    queryFn: async (): Promise<LinkedEntity[]> => {
      if (!contractId) return [];

      const entities: LinkedEntity[] = [];

      // Add the analysis link
      if (analysisId) {
        entities.push({ type: 'analysis', id: analysisId });
      }

      // Get active claim for this contract
      const { data: claim } = await supabase
        .from('claims')
        .select('id')
        .eq('contract_id', contractId)
        .is('canceled_at', null)
        .maybeSingle();

      if (claim) {
        entities.push({ type: 'claim', id: claim.id });
      }

      return entities;
    },
    enabled: !!contractId,
  });
}

// Get linked entities for a Claim
export function useLinkedEntitiesForClaim(claimId: string | undefined, contractId: string | undefined) {
  return useQuery({
    queryKey: ['linked-entities', 'claim', claimId, contractId],
    queryFn: async (): Promise<LinkedEntity[]> => {
      if (!contractId) return [];

      const entities: LinkedEntity[] = [];

      // Add the contract link
      entities.push({ type: 'contract', id: contractId });

      // Get the analysis from the contract
      const { data: contract } = await supabase
        .from('contracts')
        .select('analysis_id')
        .eq('id', contractId)
        .maybeSingle();

      if (contract?.analysis_id) {
        entities.push({ type: 'analysis', id: contract.analysis_id });
      }

      return entities;
    },
    enabled: !!contractId,
  });
}
