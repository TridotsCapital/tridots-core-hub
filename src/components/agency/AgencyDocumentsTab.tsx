import { useState } from 'react';
import { 
  FileText, 
  Upload, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Download,
  Eye,
  AlertCircle,
  Hash,
  Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  useAgencyDocuments, 
  useAgencyOnboardingStatus, 
  useUploadAgencyDocument,
  useUpdateAgencyCreci,
  useTermAdesaoTemplate,
  useDownloadTermTemplate,
  DOCUMENT_LABELS,
  REQUIRED_DOCUMENTS,
  type AgencyDocumentType,
  type AgencyDocumentStatus
} from '@/hooks/useAgencyDocuments';
import { useAgencyProfile } from '@/hooks/useAgencyProfile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<AgencyDocumentStatus, { label: string; icon: any; color: string }> = {
  pendente: { label: 'Pendente', icon: Clock, color: 'text-amber-500' },
  enviado: { label: 'Aguardando Validação', icon: Clock, color: 'text-blue-500' },
  aprovado: { label: 'Aprovado', icon: CheckCircle, color: 'text-green-500' },
  rejeitado: { label: 'Rejeitado', icon: XCircle, color: 'text-red-500' },
};

export function AgencyDocumentsTab() {
  const { data: agency } = useAgencyProfile();
  const { data: documents = [] } = useAgencyDocuments(agency?.id);
  const onboardingStatus = useAgencyOnboardingStatus(agency?.id);
  const uploadDocument = useUploadAgencyDocument();
  const updateCreci = useUpdateAgencyCreci();
  const { data: termTemplate } = useTermAdesaoTemplate();
  const downloadTemplate = useDownloadTermTemplate();

  const [creciNumero, setCreciNumero] = useState(agency?.creci_numero || '');
  const [uploading, setUploading] = useState<AgencyDocumentType | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);

  // Update CRECI when agency data loads
  useState(() => {
    if (agency?.creci_numero) {
      setCreciNumero(agency.creci_numero);
    }
  });

  const getDocByType = (type: AgencyDocumentType) => 
    documents.find(d => d.document_type === type);

  const handleUpload = async (type: AgencyDocumentType, file: File) => {
    if (!agency?.id) return;
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 10MB.');
      return;
    }

    setUploading(type);
    try {
      await uploadDocument.mutateAsync({
        agencyId: agency.id,
        documentType: type,
        file,
      });
    } finally {
      setUploading(null);
    }
  };

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

  const handleSaveCreci = () => {
    if (!agency?.id || !creciNumero.trim()) return;
    updateCreci.mutate({ agencyId: agency.id, creciNumero: creciNumero.trim() });
  };

  const handleDownloadTerm = async () => {
    if (!termTemplate?.file_path) {
      toast.error('Termo de aceite não disponível');
      return;
    }

    try {
      const signedUrl = await downloadTemplate.mutateAsync(termTemplate.file_path);
      
      // Download via fetch para evitar bloqueios do navegador
      const response = await fetch(signedUrl);
      if (!response.ok) throw new Error('Erro ao baixar arquivo');
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = termTemplate.file_name || 'termo_adesao.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success('Download iniciado');
    } catch (error) {
      console.error('Erro ao baixar termo:', error);
      toast.error('Erro ao baixar termo de aceite. Tente novamente.');
    }
  };

  if (!agency) {
    return <div className="text-muted-foreground text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* CRECI Number Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Hash className="h-4 w-4" />
            Número do CRECI
          </CardTitle>
          <CardDescription>
            Informe o número do CRECI da imobiliária
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Ex: CRECI-SP 12345-J"
              value={creciNumero}
              onChange={(e) => setCreciNumero(e.target.value)}
              className="max-w-md"
            />
            <Button 
              onClick={handleSaveCreci}
              disabled={updateCreci.isPending || !creciNumero.trim()}
            >
              {updateCreci.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Required Documents Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documentos Obrigatórios
          </CardTitle>
          <CardDescription>
            Envie os documentos necessários para ativação da sua imobiliária
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {REQUIRED_DOCUMENTS.map((type) => {
            const doc = getDocByType(type);
            const status = doc?.status || 'pendente';
            const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.pendente;
            const StatusIcon = statusConfig.icon;

            return (
              <div key={type} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{DOCUMENT_LABELS[type]}</p>
                      <Badge variant="outline" className="text-xs">Obrigatório</Badge>
                    </div>
                    {doc?.file_name && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Arquivo: {doc.file_name}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className={`${statusConfig.color} border-current`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig.label}
                  </Badge>
                </div>

                {/* Rejection feedback */}
                {status === 'rejeitado' && doc?.feedback && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-destructive">Motivo da rejeição:</p>
                        <p className="text-muted-foreground">{doc.feedback}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 flex-wrap">
                  {/* View button */}
                  {doc?.file_path && (
                    <Button
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
                  )}

                  {/* Upload button (if pending, rejected, or no doc) */}
                  {(!doc || status === 'pendente' || status === 'rejeitado') && (
                    <div>
                      <Input
                        type="file"
                        id={`upload-${type}`}
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUpload(type, file);
                        }}
                      />
                      <Button
                        variant={status === 'rejeitado' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => document.getElementById(`upload-${type}`)?.click()}
                        disabled={uploading === type}
                      >
                        {uploading === type ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            {doc ? 'Reenviar' : 'Enviar'}
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Term of Acceptance Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Termo de Aceite
          </CardTitle>
          <CardDescription>
            {onboardingStatus.canDownloadTerm
              ? 'Baixe o termo, assine via GOV.BR e faça o upload do documento assinado'
              : 'Disponível após aprovação de todos os documentos obrigatórios'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {onboardingStatus.canDownloadTerm ? (
            <div className="space-y-4">
              {/* Download Term */}
              <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30">
                <div className="flex-1">
                  <p className="font-medium">1. Baixar Termo de Aceite</p>
                  <p className="text-sm text-muted-foreground">
                    Faça o download do termo e assine digitalmente via GOV.BR
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleDownloadTerm}
                  disabled={downloadTemplate.isPending || !termTemplate}
                >
                  {downloadTemplate.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Baixar Termo
                    </>
                  )}
                </Button>
              </div>

              {/* Upload Signed Term */}
              <div className="space-y-3">
                {(() => {
                  const termDoc = getDocByType('termo_aceite_assinado');
                  const status = termDoc?.status || 'pendente';
                  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.pendente;
                  const StatusIcon = statusConfig.icon;

                  return (
                    <div className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium">2. Enviar Termo Assinado</p>
                          {termDoc?.file_name && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Arquivo: {termDoc.file_name}
                            </p>
                          )}
                        </div>
                        {termDoc && (
                          <Badge variant="outline" className={`${statusConfig.color} border-current`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        )}
                      </div>

                      {status === 'rejeitado' && termDoc?.feedback && (
                        <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium text-destructive">Motivo da rejeição:</p>
                              <p className="text-muted-foreground">{termDoc.feedback}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        {termDoc?.file_path && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleView(termDoc.file_path)}
                            disabled={viewing === termDoc.file_path}
                          >
                            {viewing === termDoc.file_path ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-2" />
                                Visualizar
                              </>
                            )}
                          </Button>
                        )}

                        {(!termDoc || status === 'pendente' || status === 'rejeitado') && (
                          <div>
                            <Input
                              type="file"
                              id="upload-termo"
                              className="hidden"
                              accept=".pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUpload('termo_aceite_assinado', file);
                              }}
                            />
                            <Button
                              variant={status === 'rejeitado' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => document.getElementById('upload-termo')?.click()}
                              disabled={uploading === 'termo_aceite_assinado'}
                            >
                              {uploading === 'termo_aceite_assinado' ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 mr-2" />
                                  {termDoc ? 'Reenviar' : 'Enviar Termo Assinado'}
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Complete o envio e aguarde a aprovação dos documentos obrigatórios</p>
              <p className="text-sm mt-1">para acessar o Termo de Aceite</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
