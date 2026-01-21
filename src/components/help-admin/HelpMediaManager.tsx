import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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
import {
  useHelpAdminMedia,
  useUploadHelpMedia,
  useAddHelpVideo,
  useDeleteHelpMedia,
  extractPlaceholders,
  HelpSection,
  HelpMedia,
} from "@/hooks/useHelpAdmin";
import {
  ArrowLeft,
  Upload,
  Image,
  Video,
  Trash2,
  Loader2,
  ExternalLink,
  AlertCircle,
  Check,
} from "lucide-react";

interface HelpMediaManagerProps {
  section: HelpSection;
  onBack: () => void;
}

export function HelpMediaManager({ section, onBack }: HelpMediaManagerProps) {
  const { data: allMedia, isLoading } = useHelpAdminMedia();
  const uploadMutation = useUploadHelpMedia();
  const videoMutation = useAddHelpVideo();
  const deleteMutation = useDeleteHelpMedia();

  const [uploadDialog, setUploadDialog] = useState<string | null>(null);
  const [videoDialog, setVideoDialog] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<HelpMedia | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const placeholders = extractPlaceholders(section.content);
  const sectionMedia = allMedia?.filter((m) => m.section_id === section.id) || [];

  const getMediaForPlaceholder = (placeholderId: string) => {
    return sectionMedia.find((m) => m.placeholder_id === placeholderId);
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadDialog) return;
    await uploadMutation.mutateAsync({
      sectionId: section.id,
      placeholderId: uploadDialog,
      file: selectedFile,
      caption: caption || undefined,
    });
    setUploadDialog(null);
    setSelectedFile(null);
    setCaption("");
  };

  const handleAddVideo = async () => {
    if (!videoUrl || !videoDialog) return;
    await videoMutation.mutateAsync({
      sectionId: section.id,
      placeholderId: videoDialog,
      videoUrl,
      caption: caption || undefined,
    });
    setVideoDialog(null);
    setVideoUrl("");
    setCaption("");
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    await deleteMutation.mutateAsync(deleteDialog.id);
    setDeleteDialog(null);
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h3 className="text-lg font-semibold">Mídia: {section.title}</h3>
            <p className="text-sm text-muted-foreground">
              {placeholders.length} placeholder(s) encontrado(s)
            </p>
          </div>
        </div>

        {placeholders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum placeholder encontrado</h3>
              <p className="text-muted-foreground text-center">
                Adicione [[screenshot:nome]] no conteúdo da seção para criar placeholders.
              </p>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="space-y-4 pr-4">
              {placeholders.map((placeholderId) => {
                const media = getMediaForPlaceholder(placeholderId);
                return (
                  <Card key={placeholderId}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            {media ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-amber-500" />
                            )}
                            {placeholderId}
                          </CardTitle>
                          <CardDescription>
                            {media
                              ? `${media.media_type === "screenshot" ? "Screenshot" : "Vídeo"} configurado`
                              : "Nenhuma mídia configurada"}
                          </CardDescription>
                        </div>
                        {media && (
                          <Badge variant={media.media_type === "screenshot" ? "default" : "secondary"}>
                            {media.media_type === "screenshot" ? (
                              <Image className="h-3 w-3 mr-1" />
                            ) : (
                              <Video className="h-3 w-3 mr-1" />
                            )}
                            {media.media_type}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {media ? (
                        <div className="space-y-3">
                          {media.media_type === "screenshot" && media.file_path && (
                            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                              <img
                                src={media.file_path}
                                alt={media.caption || placeholderId}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          )}
                          {media.media_type === "video" && media.video_url && (
                            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                              {getYouTubeEmbedUrl(media.video_url) ? (
                                <iframe
                                  src={getYouTubeEmbedUrl(media.video_url)!}
                                  className="w-full h-full"
                                  allowFullScreen
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full">
                                  <a
                                    href={media.video_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary flex items-center gap-2"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    Abrir vídeo
                                  </a>
                                </div>
                              )}
                            </div>
                          )}
                          {media.caption && (
                            <p className="text-sm text-muted-foreground italic">{media.caption}</p>
                          )}
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setUploadDialog(placeholderId)}
                            >
                              <Upload className="h-4 w-4 mr-1" />
                              Substituir
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive"
                              onClick={() => setDeleteDialog(media)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remover
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setUploadDialog(placeholderId)}
                          >
                            <Image className="h-4 w-4 mr-2" />
                            Upload Screenshot
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setVideoDialog(placeholderId)}
                          >
                            <Video className="h-4 w-4 mr-2" />
                            Adicionar Vídeo
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Upload Screenshot Dialog */}
      <Dialog open={!!uploadDialog} onOpenChange={(open) => !open && setUploadDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Screenshot</DialogTitle>
            <DialogDescription>Placeholder: {uploadDialog}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Imagem</Label>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="space-y-2">
              <Label>Legenda (opcional)</Label>
              <Input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Descrição da imagem..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialog(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpload} disabled={!selectedFile || uploadMutation.isPending}>
              {uploadMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Video Dialog */}
      <Dialog open={!!videoDialog} onOpenChange={(open) => !open && setVideoDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Vídeo</DialogTitle>
            <DialogDescription>Placeholder: {videoDialog}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>URL do YouTube</Label>
              <Input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>
            <div className="space-y-2">
              <Label>Legenda (opcional)</Label>
              <Input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Descrição do vídeo..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVideoDialog(null)}>
              Cancelar
            </Button>
            <Button onClick={handleAddVideo} disabled={!videoUrl || videoMutation.isPending}>
              {videoMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Mídia</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover esta mídia? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
