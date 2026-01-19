import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

export type AgencyDocumentType = Database['public']['Enums']['agency_document_type'];
export type AgencyDocumentStatus = Database['public']['Enums']['agency_document_status'];

export interface AgencyDocument {
  id: string;
  agency_id: string;
  document_type: AgencyDocumentType;
  file_path: string;
  file_name: string;
  file_size: number;
  status: AgencyDocumentStatus;
  feedback: string | null;
  uploaded_at: string;
  uploaded_by: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export interface AgencyOnboardingStatus {
  hasCartaoCnpj: boolean;
  hasCertidaoCreci: boolean;
  hasDocumentoSocio: boolean;
  hasContratoSocial: boolean;
  hasTermoAceiteAssinado: boolean;
  allDocumentsSent: boolean;
  allDocumentsApproved: boolean;
  termApproved: boolean;
  canDownloadTerm: boolean;
  pendingDocuments: AgencyDocumentType[];
  rejectedDocuments: AgencyDocumentType[];
}

export const DOCUMENT_LABELS: Record<AgencyDocumentType, string> = {
  cartao_cnpj: 'Cartão CNPJ',
  certidao_creci: 'Certidão do CRECI',
  documento_socio: 'Documento do Sócio Administrador (RG/CNH)',
  contrato_social: 'Contrato Social Atualizado',
  termo_aceite_assinado: 'Termo de Aceite Assinado',
};

export const REQUIRED_DOCUMENTS: AgencyDocumentType[] = [
  'cartao_cnpj',
  'certidao_creci',
  'documento_socio',
  'contrato_social',
];

export function useAgencyDocuments(agencyId?: string) {
  return useQuery({
    queryKey: ['agency-documents', agencyId],
    queryFn: async () => {
      if (!agencyId) return [];

      const { data, error } = await supabase
        .from('agency_documents')
        .select('*')
        .eq('agency_id', agencyId)
        .order('document_type');

      if (error) throw error;
      return data as AgencyDocument[];
    },
    enabled: !!agencyId,
  });
}

export function useAgencyOnboardingStatus(agencyId?: string) {
  const { data: documents = [] } = useAgencyDocuments(agencyId);

  const getDocByType = (type: AgencyDocumentType) => 
    documents.find(d => d.document_type === type);

  const hasCartaoCnpj = !!getDocByType('cartao_cnpj');
  const hasCertidaoCreci = !!getDocByType('certidao_creci');
  const hasDocumentoSocio = !!getDocByType('documento_socio');
  const hasContratoSocial = !!getDocByType('contrato_social');
  const hasTermoAceiteAssinado = !!getDocByType('termo_aceite_assinado');

  const allDocumentsSent = hasCartaoCnpj && hasCertidaoCreci && hasDocumentoSocio && hasContratoSocial;
  
  const requiredDocsApproved = REQUIRED_DOCUMENTS.every(type => {
    const doc = getDocByType(type);
    return doc?.status === 'aprovado';
  });

  const termDoc = getDocByType('termo_aceite_assinado');
  const termApproved = termDoc?.status === 'aprovado';

  const pendingDocuments = REQUIRED_DOCUMENTS.filter(type => !getDocByType(type));
  
  const rejectedDocuments = documents
    .filter(d => d.status === 'rejeitado')
    .map(d => d.document_type);

  return {
    hasCartaoCnpj,
    hasCertidaoCreci,
    hasDocumentoSocio,
    hasContratoSocial,
    hasTermoAceiteAssinado,
    allDocumentsSent,
    allDocumentsApproved: requiredDocsApproved,
    termApproved,
    canDownloadTerm: requiredDocsApproved,
    pendingDocuments,
    rejectedDocuments,
  } as AgencyOnboardingStatus;
}

export function useUploadAgencyDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      agencyId,
      documentType,
      file,
    }: {
      agencyId: string;
      documentType: AgencyDocumentType;
      file: File;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const fileExt = file.name.split('.').pop();
      const filePath = `${agencyId}/${documentType}-${Date.now()}.${fileExt}`;

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from('agency-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Check if document already exists
      const { data: existingDoc } = await supabase
        .from('agency_documents')
        .select('id, file_path')
        .eq('agency_id', agencyId)
        .eq('document_type', documentType)
        .single();

      if (existingDoc) {
        // Delete old file
        if (existingDoc.file_path) {
          await supabase.storage
            .from('agency-documents')
            .remove([existingDoc.file_path]);
        }

        // Update existing document
        const { error } = await supabase
          .from('agency_documents')
          .update({
            file_path: filePath,
            file_name: file.name,
            file_size: file.size,
            status: 'enviado',
            feedback: null,
            uploaded_at: new Date().toISOString(),
            uploaded_by: user.id,
            reviewed_at: null,
            reviewed_by: null,
          })
          .eq('id', existingDoc.id);

        if (error) throw error;
      } else {
        // Insert new document
        const { error } = await supabase
          .from('agency_documents')
          .insert({
            agency_id: agencyId,
            document_type: documentType,
            file_path: filePath,
            file_name: file.name,
            file_size: file.size,
            status: 'enviado',
            uploaded_by: user.id,
          });

        if (error) throw error;
      }

      return { filePath };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agency-documents', variables.agencyId] });
      toast.success('Documento enviado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao enviar documento: ' + error.message);
    },
  });
}

export function useReviewAgencyDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      documentId,
      agencyId,
      action,
      feedback,
    }: {
      documentId: string;
      agencyId: string;
      action: 'approve' | 'reject';
      feedback?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('agency_documents')
        .update({
          status: action === 'approve' ? 'aprovado' : 'rejeitado',
          feedback: action === 'reject' ? feedback : null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq('id', documentId);

      if (error) throw error;

      return { action };
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agency-documents', variables.agencyId] });
      toast.success(result.action === 'approve' ? 'Documento aprovado!' : 'Documento rejeitado');
    },
    onError: (error: any) => {
      toast.error('Erro ao processar revisão: ' + error.message);
    },
  });
}

export function useUpdateAgencyCreci() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      agencyId,
      creciNumero,
    }: {
      agencyId: string;
      creciNumero: string;
    }) => {
      const { error } = await supabase
        .from('agencies')
        .update({ creci_numero: creciNumero })
        .eq('id', agencyId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agency-profile'] });
      queryClient.invalidateQueries({ queryKey: ['agency', variables.agencyId] });
      toast.success('Número do CRECI salvo!');
    },
    onError: (error: any) => {
      toast.error('Erro ao salvar CRECI: ' + error.message);
    },
  });
}

export function useTermAdesaoTemplate() {
  return useQuery({
    queryKey: ['term-template', 'termo_adesao_imobiliaria'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('term_templates')
        .select('*')
        .eq('name', 'termo_adesao_imobiliaria')
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });
}

export function useDownloadTermTemplate() {
  return useMutation({
    mutationFn: async (filePath: string) => {
      const { data, error } = await supabase.storage
        .from('term-templates')
        .createSignedUrl(filePath, 3600);

      if (error) throw error;
      return data.signedUrl;
    },
  });
}
