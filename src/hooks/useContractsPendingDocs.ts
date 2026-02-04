import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useContractsPendingDocs(agencyId: string | undefined) {
  return useQuery({
    queryKey: ['contracts-pending-docs', agencyId],
    queryFn: async () => {
      if (!agencyId) return 0;
      
      // Buscar contratos com status documentacao_pendente e os status dos documentos
      const { data, error } = await supabase
        .from('contracts')
        .select('id, doc_contrato_locacao_status, doc_vistoria_inicial_status, doc_seguro_incendio_status')
        .eq('agency_id', agencyId)
        .eq('status', 'documentacao_pendente');

      if (error) throw error;
      if (!data) return 0;

      // Filtrar apenas contratos onde pelo menos um documento está null (não enviado) ou rejeitado
      // Se todos os documentos estão 'enviado' ou 'aprovado', o contrato não deve contar
      const pendingCount = data.filter(contract => {
        const docLocacaoNeedAction = contract.doc_contrato_locacao_status === null || contract.doc_contrato_locacao_status === 'rejeitado';
        const docVistoriaNeedAction = contract.doc_vistoria_inicial_status === null || contract.doc_vistoria_inicial_status === 'rejeitado';
        const docSeguroNeedAction = contract.doc_seguro_incendio_status === null || contract.doc_seguro_incendio_status === 'rejeitado';
        
        return docLocacaoNeedAction || docVistoriaNeedAction || docSeguroNeedAction;
      }).length;

      return pendingCount;
    },
    enabled: !!agencyId,
  });
}
