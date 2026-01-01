import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, Download, Trash2, Loader2, FileText, File } from "lucide-react";
import { useClaimFiles, useUploadClaimFile, useDeleteClaimFile, getClaimFileUrl } from "@/hooks/useClaimFiles";
import { claimFileTypeList, claimFileTypeConfig } from "@/types/claims";
import type { ClaimFileType } from "@/types/claims";

interface ClaimFilesSectionProps {
  claimId: string;
  canEdit: boolean;
}

export function ClaimFilesSection({ claimId, canEdit }: ClaimFilesSectionProps) {
  const { data: files, isLoading } = useClaimFiles(claimId);
  const uploadFile = useUploadClaimFile();
  const deleteFile = useDeleteClaimFile();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileType, setSelectedFileType] = useState<ClaimFileType>('outros');
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadingFile(file);
    }
  };

  const handleUpload = async () => {
    if (!uploadingFile) return;

    await uploadFile.mutateAsync({
      claimId,
      file: uploadingFile,
      fileType: selectedFileType,
    });

    setUploadingFile(null);
    setSelectedFileType('outros');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    const url = await getClaimFileUrl(filePath);
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
    }
  };

  const handleDelete = async (fileId: string, filePath: string) => {
    if (confirm('Deseja remover este arquivo?')) {
      await deleteFile.mutateAsync({ fileId, filePath, claimId });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Arquivos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Arquivos Anexados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Section */}
        {canEdit && (
          <div className="p-4 border border-dashed rounded-lg bg-muted/30">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
            />
            
            {!uploadingFile ? (
              <div className="text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  Selecionar Arquivo
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  PDF, DOC, XLS, JPG, PNG (máx. 10MB)
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <File className="h-8 w-8 text-primary" />
                  <div className="flex-1">
                    <p className="font-medium">{uploadingFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(uploadingFile.size)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Select 
                    value={selectedFileType} 
                    onValueChange={(v) => setSelectedFileType(v as ClaimFileType)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Tipo do arquivo" />
                    </SelectTrigger>
                    <SelectContent>
                      {claimFileTypeList.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleUpload} 
                    disabled={uploadFile.isPending}
                  >
                    {uploadFile.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Enviar
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setUploadingFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Files List */}
        {files && files.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Arquivo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Enviado em</TableHead>
                  <TableHead>Por</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {file.file_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {claimFileTypeConfig[file.file_type]?.label || file.file_type}
                    </TableCell>
                    <TableCell>{formatFileSize(file.file_size)}</TableCell>
                    <TableCell>
                      {format(new Date(file.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {file.uploader?.full_name || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(file.file_path, file.file_name)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(file.id, file.file_path)}
                            disabled={deleteFile.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum arquivo anexado ainda.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
