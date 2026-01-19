import { useState } from 'react';
import { 
  FileText, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  AlertCircle,
  Hash,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  useAgencyDocuments, 
  useAgencyOnboardingStatus, 
  useReviewAgencyDocument,
  DOCUMENT_LABELS,
  REQUIRED_DOCUMENTS,
  type AgencyDocumentType,
  type AgencyDocumentStatus
} from '@/hooks/useAgencyDocuments';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_CONFIG: Record<AgencyDocumentStatus, { label: string; icon: any; color: string; bgColor: string }> = {
  pendente: { label: 'Pendente', icon: Clock, color: 'text-amber-500', bgColor: 'bg-amber-50' },
  enviado: { label: 'Aguardando Validação', icon: Clock, color: 'text-blue-500', bgColor: 'bg-blue-50' },
  aprovado: { label: 'Aprovado', icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-50' },
  rejeitado: { label: 'Rejeitado', icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-50' },
};

interface AgencyActivationDocumentsProps {
  agencyId: string;
  creciNumero?: string | null;
}

export function AgencyActivationDocuments({ agencyId, creciNumero }: AgencyActivationDocumentsProps) {
  const { data: documents = [] } = useAgencyDocuments(agencyId);
  const onboardingStatus = useAgencyOnboardingStatus(agencyId);
  const reviewDocument = useReviewAgencyDocument();

  const [viewing, setViewing] = useState<string | null>(null);
  const [reviewModal, setReviewModal] = useState<{ 
    documentId: string; 
    type: AgencyDocumentType; 
    action: 'approve' | 'reject' 
  } | null>(null);
  const [feedback, setFeedback] = useState('');

  const getDocByType = (type: AgencyDocumentType) => 
    documents.find(d => d.document_type === type);

  const handleView = async (filePath: string) => {
    setViewing(filePath);
    try {
      const { data, error } = await supabase.storage
        .from('agency-documents')
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

    await reviewDocument.mutateAsync({
      documentId: reviewModal.documentId,
      agencyId,
      action: reviewModal.action,
      feedback: reviewModal.action === 'reject' ? feedback : undefined,
    });

    setReviewModal(null);
    setFeedback('');
  };

  const allDocsToReview = [...REQUIRED_DOCUMENTS, 'termo_aceite_assinado' as AgencyDocumentType];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documentos de Ativação
        </CardTitle>
        <CardDescription>
          Documentos enviados pela imobiliária para ativação
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* CRECI Number */}
        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
          <Hash className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Número do CRECI</p>
            <p className="font-medium">{creciNumero || 'Não informado'}</p>
          </div>
        </div>

        {/* Documents List */}
        <div className="space-y-3">
          {allDocsToReview.map((type) => {
            const doc = getDocByType(type);
            
            if (!doc) {
              // Document not yet sent
              return (
                <div key={type} className="flex items-center justify-between p-3 border rounded-lg opacity-60">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <span>{DOCUMENT_LABELS[type]}</span>
                  </div>
                  <Badge variant="outline" className="text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    Não enviado
                  </Badge>
                </div>
              );
            }

            const statusConfig = STATUS_CONFIG[doc.status];
            const StatusIcon = statusConfig.icon;

            return (
              <div key={type} className={`p-3 border rounded-lg ${statusConfig.bgColor}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">{DOCUMENT_LABELS[type]}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 ml-7">
                      {doc.file_name}
                    </p>
                    {doc.uploaded_at && (
                      <p className="text-xs text-muted-foreground mt-0.5 ml-7">
                        Enviado em {format(new Date(doc.uploaded_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className={`${statusConfig.color} border-current shrink-0`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig.label}
                  </Badge>
                </div>

                {/* Rejection feedback */}
                {doc.status === 'rejeitado' && doc.feedback && (
                  <div className="mt-2 ml-7 p-2 rounded bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-destructive">{doc.feedback}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2 mt-3 ml-7">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(doc.file_path)}
                    disabled={viewing === doc.file_path}
                  >
                    {viewing === doc.file_path ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizar
                      </>
                    )}
                  </Button>

                  {doc.status === 'enviado' && (
                    <>
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => setReviewModal({ 
                          documentId: doc.id, 
                          type, 
                          action: 'approve' 
                        })}
                      >
                        <ThumbsUp className="h-4 w-4 mr-2" />
                        Aprovar
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => setReviewModal({ 
                          documentId: doc.id, 
                          type, 
                          action: 'reject' 
                        })}
                      >
                        <ThumbsDown className="h-4 w-4 mr-2" />
                        Reprovar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Status Summary */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              {onboardingStatus.allDocumentsApproved ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-500" />
              )}
              <span>
                Documentos obrigatórios: {onboardingStatus.allDocumentsApproved ? 'Aprovados' : 'Pendentes'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {onboardingStatus.termApproved ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-500" />
              )}
              <span>
                Termo de aceite: {onboardingStatus.termApproved ? 'Aprovado' : 'Pendente'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Review Modal */}
      <Dialog open={!!reviewModal} onOpenChange={() => setReviewModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewModal?.action === 'approve' ? 'Aprovar Documento' : 'Reprovar Documento'}
            </DialogTitle>
            <DialogDescription>
              {reviewModal?.type && DOCUMENT_LABELS[reviewModal.type]}
            </DialogDescription>
          </DialogHeader>

          {reviewModal?.action === 'reject' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Motivo da rejeição *</label>
              <Textarea
                placeholder="Explique o motivo da rejeição para a imobiliária..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setReviewModal(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant={reviewModal?.action === 'approve' ? 'default' : 'destructive'}
              onClick={handleReview}
              disabled={reviewDocument.isPending || (reviewModal?.action === 'reject' && !feedback.trim())}
            >
              {reviewDocument.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {reviewModal?.action === 'approve' ? 'Confirmar Aprovação' : 'Confirmar Rejeição'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
