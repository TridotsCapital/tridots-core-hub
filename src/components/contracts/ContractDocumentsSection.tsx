import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  FileText, 
  Upload, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Camera,
  Eye,
  AlertCircle,
  Shield
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

type ContractStatus = Database['public']['Enums']['contract_status'];

interface ContractDocumentsSectionProps {
  contract: {
    id: string;
    status: ContractStatus;
    analysis_id: string;
    doc_contrato_locacao_path: string | null;
    doc_contrato_locacao_name: string | null;
    doc_contrato_locacao_status: string | null;
    doc_contrato_locacao_feedback: string | null;
    doc_contrato_locacao_uploaded_at: string | null;
    doc_vistoria_inicial_path: string | null;
    doc_vistoria_inicial_name: string | null;
    doc_vistoria_inicial_status: string | null;
    doc_vistoria_inicial_feedback: string | null;
    doc_vistoria_inicial_uploaded_at: string | null;
    doc_seguro_incendio_path: string | null;
    doc_seguro_incendio_name: string | null;
    doc_seguro_incendio_status: string | null;
    doc_seguro_incendio_feedback: string | null;
    doc_seguro_incendio_uploaded_at: string | null;
    doc_contrato_administrativo_path: string | null;
    doc_contrato_administrativo_name: string | null;
    doc_contrato_administrativo_status: string | null;
    doc_contrato_administrativo_feedback: string | null;
    doc_contrato_administrativo_uploaded_at: string | null;
  };
  identityPhotoPath?: string | null;
  tenantName?: string;
  isAgencyView?: boolean;
  onUpdate?: () => void;
}

type DocType = 'contrato_locacao' | 'vistoria_inicial' | 'seguro_incendio' | 'contrato_administrativo';

interface DocConfig {
  key: DocType;
  label: string;
  description: string;
  required: boolean;
}

const DOC_CONFIGS: DocConfig[] = [
  { 
    key: 'contrato_locacao', 
    label: 'Contrato de Locação', 
    description: 'Contrato de locação assinado entre as partes',
    required: true 
  },
  { 
    key: 'vistoria_inicial', 
    label: 'Vistoria Inicial', 
    description: 'Laudo de vistoria do imóvel no início da locação',
    required: true 
  },
  { 
    key: 'seguro_incendio', 
    label: 'Seguro Incêndio', 
    description: 'Apólice de seguro contra incêndio',
    required: true 
  },
  { 
    key: 'contrato_administrativo', 
    label: 'Contrato Administrativo', 
    description: 'Contrato administrativo de gestão',
    required: true 
  },
];

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  pendente: { label: 'Pendente', icon: Clock, color: 'text-amber-500' },
  enviado: { label: 'Aguardando Validação', icon: Clock, color: 'text-blue-500' },
  aprovado: { label: 'Aprovado', icon: CheckCircle, color: 'text-green-500' },
  rejeitado: { label: 'Rejeitado', icon: XCircle, color: 'text-red-500' },
};

export function ContractDocumentsSection({ 
  contract, 
  identityPhotoPath, 
  tenantName,
  isAgencyView = false,
  onUpdate 
}: ContractDocumentsSectionProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState<DocType | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);
  const [reviewModal, setReviewModal] = useState<{ type: DocType; action: 'approve' | 'reject' } | null>(null);
  const [feedback, setFeedback] = useState('');
  const [processing, setProcessing] = useState(false);
  const [identityPhotoUrl, setIdentityPhotoUrl] = useState<string | null>(null);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [activateModalOpen, setActivateModalOpen] = useState(false);

  // Fetch identity photo URL
  useEffect(() => {
    const fetchIdentityPhoto = async () => {
      if (!identityPhotoPath) return;
      
      try {
        const { data } = await supabase.storage
          .from('identity-verification')
          .createSignedUrl(identityPhotoPath, 3600);
        
        if (data?.signedUrl) {
          setIdentityPhotoUrl(data.signedUrl);
        }
      } catch (error) {
        console.error('Error fetching identity photo:', error);
      }
    };

    fetchIdentityPhoto();
  }, [identityPhotoPath]);

  const getDocStatus = (docType: DocType): string => {
    const statusKey = `doc_${docType}_status` as keyof typeof contract;
    return (contract[statusKey] as string) || 'pendente';
  };

  const getDocPath = (docType: DocType): string | null => {
    const pathKey = `doc_${docType}_path` as keyof typeof contract;
    return contract[pathKey] as string | null;
  };

  const getDocName = (docType: DocType): string | null => {
    const nameKey = `doc_${docType}_name` as keyof typeof contract;
    return contract[nameKey] as string | null;
  };

  const getDocFeedback = (docType: DocType): string | null => {
    const feedbackKey = `doc_${docType}_feedback` as keyof typeof contract;
    return contract[feedbackKey] as string | null;
  };

  const handleUpload = async (docType: DocType, file: File) => {
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 20MB.');
      return;
    }

    setUploading(docType);

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${contract.id}/${docType}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('contract-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Update contract with document info
      const updateData: Record<string, any> = {
        [`doc_${docType}_path`]: filePath,
        [`doc_${docType}_name`]: file.name,
        [`doc_${docType}_status`]: 'enviado',
        [`doc_${docType}_uploaded_at`]: new Date().toISOString(),
        [`doc_${docType}_feedback`]: null,
      };

      const { error: updateError } = await supabase
        .from('contracts')
        .update(updateData)
        .eq('id', contract.id);

      if (updateError) throw updateError;

      toast.success('Documento enviado com sucesso!');
      onUpdate?.();
    } catch (error: any) {
      toast.error('Erro ao enviar documento: ' + error.message);
    } finally {
      setUploading(null);
    }
  };

  const handleView = async (filePath: string) => {
    setViewing(filePath);
    try {
      const { data, error } = await supabase.storage
        .from('contract-documents')
        .createSignedUrl(filePath, 3600);

      if (error) throw error;

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error: any) {
      toast.error('Erro ao abrir documento');
    } finally {
      setViewing(null);
    }
  };

  const handleReview = async () => {
    if (!reviewModal) return;
    
    setProcessing(true);
    try {
      const { type, action } = reviewModal;
      const updateData: Record<string, any> = {
        [`doc_${type}_status`]: action === 'approve' ? 'aprovado' : 'rejeitado',
        [`doc_${type}_feedback`]: action === 'reject' ? feedback : null,
      };

      const { error } = await supabase
        .from('contracts')
        .update(updateData)
        .eq('id', contract.id);

      if (error) throw error;

      toast.success(action === 'approve' ? 'Documento aprovado!' : 'Documento rejeitado');
      setReviewModal(null);
      setFeedback('');
      onUpdate?.();
      
      // After approval, check if all 3 docs are now approved to trigger activation modal
      if (action === 'approve') {
        // Fetch updated contract to check all doc statuses
        const { data: updatedContract } = await supabase
          .from('contracts')
          .select('*')
          .eq('id', contract.id)
          .single();
        
        if (updatedContract && 
            updatedContract.status === 'documentacao_pendente' &&
            updatedContract.doc_contrato_locacao_status === 'aprovado' &&
            updatedContract.doc_vistoria_inicial_status === 'aprovado' &&
            updatedContract.doc_seguro_incendio_status === 'aprovado') {
          // All docs approved - open activation modal
          setActivateModalOpen(true);
        }
      }
    } catch (error: any) {
      toast.error('Erro ao processar revisão');
    } finally {
      setProcessing(false);
    }
  };

  const handleActivateContract = async () => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('contracts')
        .update({ 
          status: 'ativo',
          activated_at: new Date().toISOString(),
          activated_by: user?.id,
        })
        .eq('id', contract.id);

      if (error) throw error;

      toast.success('Contrato ativado com sucesso!');
      onUpdate?.();
    } catch (error: any) {
      toast.error('Erro ao ativar contrato');
    } finally {
      setProcessing(false);
    }
  };

  const allDocsApproved = DOC_CONFIGS.every(doc => getDocStatus(doc.key) === 'aprovado');
  const canActivate = contract.status === 'documentacao_pendente' && allDocsApproved && !isAgencyView;

  return (
    <div className="space-y-6">
      {/* Identity Photo */}
      {identityPhotoPath && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Foto de Validação do Inquilino
            </CardTitle>
            <CardDescription>
              Foto tirada pelo inquilino durante o aceite digital
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {identityPhotoUrl ? (
                <>
                  <div 
                    className="w-20 h-20 rounded-lg overflow-hidden border cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setPhotoModalOpen(true)}
                  >
                    <img 
                      src={identityPhotoUrl} 
                      alt={`Foto de ${tenantName || 'inquilino'}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{tenantName}</p>
                    <p className="text-sm text-muted-foreground">
                      Foto de identificação com documento
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => setPhotoModalOpen(true)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizar
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground text-sm">
                  Carregando foto...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contract Documents */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documentos Obrigatórios
          </CardTitle>
          <CardDescription>
            {isAgencyView 
              ? 'Envie os documentos necessários para ativação do contrato'
              : 'Documentos enviados pela imobiliária para validação'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {DOC_CONFIGS.map((doc) => {
            const status = getDocStatus(doc.key);
            const docPath = getDocPath(doc.key);
            const docName = getDocName(doc.key);
            const docFeedback = getDocFeedback(doc.key);
            const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.pendente;
            const StatusIcon = statusConfig.icon;

            return (
              <div key={doc.key} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{doc.label}</p>
                      {doc.required && (
                        <Badge variant="outline" className="text-xs">Obrigatório</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{doc.description}</p>
                  </div>
                  <Badge variant="outline" className={`${statusConfig.color} border-current`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig.label}
                  </Badge>
                </div>

                {/* Rejection feedback */}
                {status === 'rejeitado' && docFeedback && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-destructive">Motivo da rejeição:</p>
                        <p className="text-muted-foreground">{docFeedback}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 flex-wrap">
                  {/* View button (if document exists) */}
                  {docPath && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(docPath)}
                      disabled={viewing === docPath}
                    >
                      {viewing === docPath ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          Visualizar
                        </>
                      )}
                    </Button>
                  )}

                  {/* Agency: Upload button (if pending or rejected) */}
                  {isAgencyView && (status === 'pendente' || status === 'rejeitado') && (
                    <div>
                      <Input
                        type="file"
                        id={`upload-${doc.key}`}
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUpload(doc.key, file);
                        }}
                      />
                      <Button
                        variant={status === 'rejeitado' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => document.getElementById(`upload-${doc.key}`)?.click()}
                        disabled={uploading === doc.key}
                      >
                        {uploading === doc.key ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            {status === 'rejeitado' ? 'Reenviar' : 'Enviar'}
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Tridots: Upload button (any status) */}
                  {!isAgencyView && (
                    <div>
                      <Input
                        type="file"
                        id={`tridots-upload-${doc.key}`}
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUpload(doc.key, file);
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => document.getElementById(`tridots-upload-${doc.key}`)?.click()}
                        disabled={uploading === doc.key}
                        title="Enviar documento (ficará como 'Enviado - Aguardando Validação')"
                      >
                        {uploading === doc.key ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Enviar
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Tridots: Approve/Reject buttons (if enviado) */}
                  {!isAgencyView && status === 'enviado' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => setReviewModal({ type: doc.key, action: 'approve' })}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Aprovar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setReviewModal({ type: doc.key, action: 'reject' })}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Rejeitar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Activate Contract Button */}
      {canActivate && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-semibold text-green-800">Pronto para Ativar!</p>
                  <p className="text-sm text-green-700">
                    Todos os documentos foram aprovados
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => setActivateModalOpen(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Ativar Contrato
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activate Contract Confirmation Modal */}
      <Dialog open={activateModalOpen} onOpenChange={setActivateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Ativação do Contrato</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja ativar este contrato? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivateModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                setActivateModalOpen(false);
                handleActivateContract();
              }}
              disabled={processing}
              className="bg-green-600 hover:bg-green-700"
            >
              {processing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Ativar Contrato
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Modal */}
      <Dialog open={!!reviewModal} onOpenChange={() => setReviewModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewModal?.action === 'approve' ? 'Aprovar Documento' : 'Rejeitar Documento'}
            </DialogTitle>
            <DialogDescription>
              {reviewModal?.action === 'approve' 
                ? 'Confirme a aprovação deste documento.'
                : 'Informe o motivo da rejeição para que a imobiliária possa corrigir.'}
            </DialogDescription>
          </DialogHeader>
          
          {reviewModal?.action === 'reject' && (
            <Textarea
              placeholder="Motivo da rejeição..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
            />
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewModal(null)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleReview}
              disabled={processing || (reviewModal?.action === 'reject' && !feedback.trim())}
              variant={reviewModal?.action === 'approve' ? 'default' : 'destructive'}
            >
              {processing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {reviewModal?.action === 'approve' ? 'Aprovar' : 'Rejeitar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo Modal */}
      <Dialog open={photoModalOpen} onOpenChange={setPhotoModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Foto de Validação - {tenantName}</DialogTitle>
          </DialogHeader>
          {identityPhotoUrl && (
            <div className="flex justify-center">
              <img 
                src={identityPhotoUrl} 
                alt={`Foto de ${tenantName}`}
                className="max-h-[70vh] rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}