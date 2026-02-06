import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ContractRenewal {
  id: string;
  contract_id: string;
  requested_by: string | null;
  requested_at: string;
  request_source: 'agency' | 'tridots';
  new_valor_aluguel: number;
  new_valor_condominio: number;
  new_valor_iptu: number;
  new_valor_outros_encargos: number;
  new_taxa_garantia_percentual: number;
  old_valor_aluguel: number;
  old_valor_condominio: number | null;
  old_valor_iptu: number | null;
  old_valor_outros_encargos: number | null;
  old_taxa_garantia_percentual: number | null;
  old_data_fim_contrato: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'canceled';
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  renewal_duration_months: number | null;
  new_data_fim_contrato: string | null;
  acceptance_token: string | null;
  acceptance_token_expires_at: string | null;
  terms_accepted_at: string | null;
  guarantee_payment_validated_at: string | null;
  created_at: string;
  updated_at: string;
}

interface RenewalRequestData {
  contract_id: string;
  new_valor_aluguel: number;
  new_valor_condominio: number;
  new_valor_iptu: number;
  new_valor_outros_encargos: number;
  new_taxa_garantia_percentual: number;
  old_valor_aluguel: number;
  old_valor_condominio: number | null;
  old_valor_iptu: number | null;
  old_valor_outros_encargos: number | null;
  old_taxa_garantia_percentual: number | null;
  old_data_fim_contrato: string | null;
}

// Fetch all renewals for a specific contract
export const useContractRenewals = (contractId: string | null) => {
  return useQuery({
    queryKey: ['contract-renewals', contractId],
    queryFn: async (): Promise<ContractRenewal[]> => {
      if (!contractId) return [];

      const { data, error } = await supabase
        .from('contract_renewals' as any)
        .select('*')
        .eq('contract_id', contractId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as ContractRenewal[];
    },
    enabled: !!contractId
  });
};

// Fetch pending renewal for a contract (if any)
export const usePendingRenewal = (contractId: string | null) => {
  return useQuery({
    queryKey: ['pending-renewal', contractId],
    queryFn: async (): Promise<ContractRenewal | null> => {
      if (!contractId) return null;

      const { data, error } = await supabase
        .from('contract_renewals' as any)
        .select('*')
        .eq('contract_id', contractId)
        .eq('status', 'pending')
        .maybeSingle();

      if (error) throw error;
      return data as unknown as ContractRenewal | null;
    },
    enabled: !!contractId
  });
};

// Request a renewal (agency side)
export const useRequestRenewal = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RenewalRequestData) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data: renewal, error } = await supabase
        .from('contract_renewals' as any)
        .insert({
          contract_id: data.contract_id,
          requested_by: user.id,
          request_source: 'agency',
          new_valor_aluguel: data.new_valor_aluguel,
          new_valor_condominio: data.new_valor_condominio,
          new_valor_iptu: data.new_valor_iptu,
          new_valor_outros_encargos: data.new_valor_outros_encargos,
          new_taxa_garantia_percentual: data.new_taxa_garantia_percentual,
          old_valor_aluguel: data.old_valor_aluguel,
          old_valor_condominio: data.old_valor_condominio,
          old_valor_iptu: data.old_valor_iptu,
          old_valor_outros_encargos: data.old_valor_outros_encargos,
          old_taxa_garantia_percentual: data.old_taxa_garantia_percentual,
          old_data_fim_contrato: data.old_data_fim_contrato,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return renewal;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contract-renewals', variables.contract_id] });
      queryClient.invalidateQueries({ queryKey: ['pending-renewal', variables.contract_id] });
      toast.success('Solicitação de renovação enviada com sucesso!');
    },
    onError: (error) => {
      console.error('Error requesting renewal:', error);
      toast.error('Erro ao solicitar renovação');
    }
  });
};

// Cancel a pending renewal request (agency side)
export const useCancelRenewal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ renewalId, contractId }: { renewalId: string; contractId: string }) => {
      const { error } = await supabase
        .from('contract_renewals' as any)
        .update({ status: 'canceled' })
        .eq('id', renewalId)
        .eq('status', 'pending');

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contract-renewals', variables.contractId] });
      queryClient.invalidateQueries({ queryKey: ['pending-renewal', variables.contractId] });
      toast.success('Solicitação de renovação cancelada');
    },
    onError: (error) => {
      console.error('Error canceling renewal:', error);
      toast.error('Erro ao cancelar solicitação');
    }
  });
};

// Approve a renewal (Tridots side) and process installments
export const useApproveRenewal = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      renewalId, 
      contractId, 
      durationMonths,
      newPaymentMethod
    }: { 
      renewalId: string; 
      contractId: string; 
      durationMonths: number;
      newPaymentMethod?: 'pix' | 'card' | 'boleto_imobiliaria';
    }) => {
      if (!user) throw new Error('Usuário não autenticado');

      // 1. Update renewal status to approved
      const { error } = await supabase
        .from('contract_renewals' as any)
        .update({ 
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          renewal_duration_months: durationMonths
        })
        .eq('id', renewalId);

      if (error) throw error;

      // 2. Call edge function to process renewal installments and update contract
      const { error: fnError } = await supabase.functions.invoke('process-renewal-installments', {
        body: {
          renewal_id: renewalId,
          contract_id: contractId,
          new_payment_method: newPaymentMethod
        }
      });

      if (fnError) {
        console.error('Error processing renewal installments:', fnError);
        // Non-fatal - the renewal is still approved
        toast.warning('Renovação aprovada, mas houve erro ao gerar parcelas');
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contract-renewals', variables.contractId] });
      queryClient.invalidateQueries({ queryKey: ['pending-renewal', variables.contractId] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['contract-installments', variables.contractId] });
      toast.success('Renovação aprovada com sucesso!');
    },
    onError: (error) => {
      console.error('Error approving renewal:', error);
      toast.error('Erro ao aprovar renovação');
    }
  });
};

// Reject a renewal (Tridots side)
export const useRejectRenewal = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      renewalId, 
      contractId, 
      reason 
    }: { 
      renewalId: string; 
      contractId: string; 
      reason: string;
    }) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('contract_renewals' as any)
        .update({ 
          status: 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: reason
        })
        .eq('id', renewalId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contract-renewals', variables.contractId] });
      queryClient.invalidateQueries({ queryKey: ['pending-renewal', variables.contractId] });
      toast.success('Renovação recusada');
    },
    onError: (error) => {
      console.error('Error rejecting renewal:', error);
      toast.error('Erro ao recusar renovação');
    }
  });
};

// Initiate a renewal internally (Tridots side) - immediately approved
export const useInitiateRenewal = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RenewalRequestData & { durationMonths: number; newPaymentMethod?: 'pix' | 'card' | 'boleto_imobiliaria' }) => {
      if (!user) throw new Error('Usuário não autenticado');

      // For Tridots-initiated renewals, they're immediately approved
      const { data: renewal, error } = await supabase
        .from('contract_renewals' as any)
        .insert({
          contract_id: data.contract_id,
          requested_by: user.id,
          request_source: 'tridots',
          new_valor_aluguel: data.new_valor_aluguel,
          new_valor_condominio: data.new_valor_condominio,
          new_valor_iptu: data.new_valor_iptu,
          new_valor_outros_encargos: data.new_valor_outros_encargos,
          new_taxa_garantia_percentual: data.new_taxa_garantia_percentual,
          old_valor_aluguel: data.old_valor_aluguel,
          old_valor_condominio: data.old_valor_condominio,
          old_valor_iptu: data.old_valor_iptu,
          old_valor_outros_encargos: data.old_valor_outros_encargos,
          old_taxa_garantia_percentual: data.old_taxa_garantia_percentual,
          old_data_fim_contrato: data.old_data_fim_contrato,
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          renewal_duration_months: data.durationMonths
        })
        .select()
        .single();

      if (error) throw error;

      // Process installments for the renewal
      const { error: fnError } = await supabase.functions.invoke('process-renewal-installments', {
        body: {
          renewal_id: (renewal as any).id,
          contract_id: data.contract_id,
          new_payment_method: data.newPaymentMethod
        }
      });

      if (fnError) {
        console.error('Error processing renewal installments:', fnError);
        toast.warning('Renovação criada, mas houve erro ao gerar parcelas');
      }

      return renewal;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contract-renewals', variables.contract_id] });
      queryClient.invalidateQueries({ queryKey: ['pending-renewal', variables.contract_id] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['contract-installments', variables.contract_id] });
      toast.success('Renovação iniciada com sucesso!');
    },
    onError: (error) => {
      console.error('Error initiating renewal:', error);
      toast.error('Erro ao iniciar renovação');
    }
  });
};
