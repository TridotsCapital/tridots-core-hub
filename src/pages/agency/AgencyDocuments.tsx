import { useState } from "react";
import { AgencyLayout } from "@/components/layout/AgencyLayout";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveTermTemplates, useDownloadTermTemplate, TermTemplate } from "@/hooks/useTermTemplates";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  FileText, 
  Download, 
  ExternalLink, 
  FileIcon, 
  FolderOpen 
} from "lucide-react";

const getFileIcon = (fileType: string | null) => {
  if (fileType?.includes('pdf')) {
    return <FileText className="h-10 w-10 text-red-500" />;
  }
  if (fileType?.includes('word') || fileType?.includes('document')) {
    return <FileText className="h-10 w-10 text-blue-500" />;
  }
  return <FileIcon className="h-10 w-10 text-muted-foreground" />;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function AgencyDocuments() {
  const { data: templates, isLoading } = useActiveTermTemplates();
  const downloadMutation = useDownloadTermTemplate();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleOpenInNewTab = async (template: TermTemplate) => {
    const { data } = await supabase.storage
      .from("term-templates")
      .createSignedUrl(template.file_path, 3600); // 1 hour expiry

    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    }
  };

  const handleDownload = async (template: TermTemplate) => {
    setDownloadingId(template.id);
    try {
      // Gerar URL assinada
      const { data, error } = await supabase.storage
        .from("term-templates")
        .createSignedUrl(template.file_path, 3600);

      if (error || !data?.signedUrl) throw new Error('Erro ao gerar link');

      // Download via fetch para evitar bloqueios do navegador
      const response = await fetch(data.signedUrl);
      if (!response.ok) throw new Error('Erro ao baixar arquivo');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = template.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Erro ao baixar documento:', error);
    } finally {
      setDownloadingId(null);
    }
  };

  if (isLoading) {
    return (
      <AgencyLayout title="Documentos" description="Modelos e documentos da GarantFácil">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-10 w-10 rounded mb-4" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </AgencyLayout>
    );
  }

  if (!templates?.length) {
    return (
      <AgencyLayout title="Documentos" description="Modelos e documentos da GarantFácil">
        <Card className="py-16">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <FolderOpen className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum documento disponível</h3>
            <p className="text-muted-foreground text-sm max-w-md">
              Os modelos e documentos da GarantFácil aparecerão aqui quando disponíveis.
            </p>
          </CardContent>
        </Card>
      </AgencyLayout>
    );
  }

  return (
    <AgencyLayout title="Documentos" description="Modelos e documentos da GarantFácil">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {templates.map((template) => (
          <Card 
            key={template.id} 
            className="group hover:shadow-md transition-all hover:border-primary/30"
          >
            <CardContent className="p-5">
              {/* File Icon */}
              <div className="flex items-start justify-between mb-4">
                {getFileIcon(template.file_type)}
                <Badge variant="secondary" className="text-xs">
                  v{template.version}
                </Badge>
              </div>

              {/* File Info */}
              <h4 className="font-medium text-sm mb-1 line-clamp-2 min-h-[2.5rem]">
                {template.name}
              </h4>
              {template.description && (
                <CardDescription className="text-xs line-clamp-2 mb-2">
                  {template.description}
                </CardDescription>
              )}
              <p className="text-xs text-muted-foreground mb-3">
                {formatFileSize(template.file_size)} • {format(new Date(template.updated_at), "dd/MM/yyyy", { locale: ptBR })}
              </p>

              {/* Actions */}
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="flex-1"
                  onClick={() => handleOpenInNewTab(template)}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="flex-1"
                  onClick={() => handleDownload(template)}
                  disabled={downloadingId === template.id}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>

              {/* Always visible actions on mobile */}
              <div className="flex gap-2 sm:hidden mt-3">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handleOpenInNewTab(template)}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Abrir
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handleDownload(template)}
                  disabled={downloadingId === template.id}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Baixar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

    </AgencyLayout>
  );
}