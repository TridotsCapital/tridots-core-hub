import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import {
  useTermTemplates,
  useUploadTermTemplate,
  useUploadNewVersion,
  useUpdateTermTemplate,
  useDeleteTermTemplate,
  useDownloadTermTemplate,
  TermTemplate,
} from "@/hooks/useTermTemplates";
import { HelpAdminPanel } from "@/components/help-admin";
import {
  Upload,
  FileText,
  MoreVertical,
  Download,
  Edit,
  Trash2,
  Plus,
  History,
  Loader2,
  EyeOff,
  BookOpen,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const DocumentCenter = () => {
  const { user, isMaster } = useAuth();
  const { data: templates, isLoading } = useTermTemplates();
  const uploadMutation = useUploadTermTemplate();
  const uploadVersionMutation = useUploadNewVersion();
  const updateMutation = useUpdateTermTemplate();
  const deleteMutation = useDeleteTermTemplate();
  const downloadMutation = useDownloadTermTemplate();

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isVersionOpen, setIsVersionOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TermTemplate | null>(null);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleUpload = async () => {
    if (!uploadFile || !name || !user?.id) return;

    await uploadMutation.mutateAsync({
      file: uploadFile,
      name,
      description: description || undefined,
      userId: user.id,
    });

    setIsUploadOpen(false);
    resetForm();
  };

  const handleUploadVersion = async () => {
    if (!uploadFile || !selectedTemplate || !user?.id) return;

    await uploadVersionMutation.mutateAsync({
      file: uploadFile,
      originalTemplate: selectedTemplate,
      userId: user.id,
    });

    setIsVersionOpen(false);
    setSelectedTemplate(null);
    resetForm();
  };

  const handleUpdate = async () => {
    if (!selectedTemplate) return;

    await updateMutation.mutateAsync({
      id: selectedTemplate.id,
      name,
      description: description || undefined,
    });

    setIsEditOpen(false);
    setSelectedTemplate(null);
    resetForm();
  };

  const handleDelete = async () => {
    if (!selectedTemplate) return;

    await deleteMutation.mutateAsync(selectedTemplate);

    setIsDeleteOpen(false);
    setSelectedTemplate(null);
  };

  const resetForm = () => {
    setUploadFile(null);
    setName("");
    setDescription("");
  };

  const openEditDialog = (template: TermTemplate) => {
    setSelectedTemplate(template);
    setName(template.name);
    setDescription(template.description || "");
    setIsEditOpen(true);
  };

  const openVersionDialog = (template: TermTemplate) => {
    setSelectedTemplate(template);
    setIsVersionOpen(true);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const groupedTemplates = templates?.reduce((acc, template) => {
    if (!acc[template.name]) {
      acc[template.name] = [];
    }
    acc[template.name].push(template);
    return acc;
  }, {} as Record<string, TermTemplate[]>);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Centro de Documentos</h1>
            <p className="text-muted-foreground">
              Gerencie modelos de termos e conteúdo do Help Center
            </p>
          </div>
        </div>

        <Tabs defaultValue="templates" className="space-y-4">
          <TabsList>
            <TabsTrigger value="templates" className="gap-2">
              <FileText className="h-4 w-4" />
              Modelos de Termos
            </TabsTrigger>
            <TabsTrigger value="help" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Gestão do Help
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates">
            <div className="flex justify-end mb-4">
              {isMaster && (
                <Button onClick={() => setIsUploadOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Modelo
                </Button>
              )}
            </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !templates?.length ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum modelo cadastrado</h3>
              <p className="text-muted-foreground text-center mb-4">
                Faça upload do primeiro modelo de termo para disponibilizar às imobiliárias.
              </p>
              {isMaster && (
                <Button onClick={() => setIsUploadOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload de Modelo
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(groupedTemplates || {}).map(([templateName, versions]) => {
              const latestVersion = versions[0];
              const hasMultipleVersions = versions.length > 1;

              return (
                <Card key={templateName} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{templateName}</CardTitle>
                        <CardDescription className="mt-1">
                          {latestVersion.description || "Sem descrição"}
                        </CardDescription>
                      </div>
                      {isMaster && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => downloadMutation.mutate(latestVersion)}>
                              <Download className="mr-2 h-4 w-4" />
                              Baixar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openVersionDialog(latestVersion)}>
                              <Upload className="mr-2 h-4 w-4" />
                              Nova Versão
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(latestVersion)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setSelectedTemplate(latestVersion);
                                setIsDeleteOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={latestVersion.is_active ? "default" : "secondary"}>
                          {latestVersion.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                        <Badge variant="outline">v{latestVersion.version}</Badge>
                        {hasMultipleVersions && (
                          <Badge variant="outline" className="gap-1">
                            <History className="h-3 w-3" />
                            {versions.length} versões
                          </Badge>
                        )}
                        {!latestVersion.visible_in_agency_drive && (
                          <Badge variant="outline" className="gap-1 text-orange-600 border-orange-300">
                            <EyeOff className="h-3 w-3" />
                            Oculto do Drive
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p className="truncate">{latestVersion.file_name}</p>
                        <p>{formatFileSize(latestVersion.file_size)}</p>
                        <p>
                          Atualizado em{" "}
                          {format(new Date(latestVersion.updated_at), "dd/MM/yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
            )}
          </TabsContent>

          <TabsContent value="help">
            <HelpAdminPanel />
          </TabsContent>
        </Tabs>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Modelo de Termo</DialogTitle>
              <DialogDescription>
                Faça upload de um novo modelo de termo (PDF ou DOCX)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Modelo *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Termo de Adesão"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Descrição do termo..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">Arquivo *</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.docx,.doc"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!uploadFile || !name || uploadMutation.isPending}
              >
                {uploadMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Version Dialog */}
        <Dialog open={isVersionOpen} onOpenChange={setIsVersionOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Versão</DialogTitle>
              <DialogDescription>
                Upload de nova versão para "{selectedTemplate?.name}"
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="version-file">Arquivo *</Label>
                <Input
                  id="version-file"
                  type="file"
                  accept=".pdf,.docx,.doc"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                A versão atual será desativada e esta nova versão será marcada como ativa.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsVersionOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleUploadVersion}
                disabled={!uploadFile || uploadVersionMutation.isPending}
              >
                {uploadVersionMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Enviar Nova Versão
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Modelo</DialogTitle>
              <DialogDescription>Altere as informações do modelo de termo</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome do Modelo *</Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Descrição</Label>
                <Textarea
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdate} disabled={!name || updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Modelo</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir "{selectedTemplate?.name}"? Esta ação não pode ser
                desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default DocumentCenter;
