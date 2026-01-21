import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useHelpAdminChapters,
  useUpdateHelpChapter,
  HelpChapter,
} from "@/hooks/useHelpAdmin";
import * as Icons from "lucide-react";
import { Edit, Loader2, ChevronRight } from "lucide-react";

interface HelpChapterListProps {
  onSelectChapter: (chapter: HelpChapter) => void;
  selectedChapterId?: string;
}

export function HelpChapterList({ onSelectChapter, selectedChapterId }: HelpChapterListProps) {
  const { data: chapters, isLoading } = useHelpAdminChapters();
  const updateMutation = useUpdateHelpChapter();
  const [editingChapter, setEditingChapter] = useState<HelpChapter | null>(null);
  const [editForm, setEditForm] = useState({ title: "", icon: "", is_new: false });

  const openEditDialog = (chapter: HelpChapter, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChapter(chapter);
    setEditForm({
      title: chapter.title,
      icon: chapter.icon,
      is_new: chapter.is_new,
    });
  };

  const handleSave = async () => {
    if (!editingChapter) return;
    await updateMutation.mutateAsync({
      id: editingChapter.id,
      title: editForm.title,
      icon: editForm.icon,
      is_new: editForm.is_new,
    });
    setEditingChapter(null);
  };

  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
    return IconComponent ? <IconComponent className="h-5 w-5" /> : <Icons.FileText className="h-5 w-5" />;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {chapters?.map((chapter) => (
          <Card
            key={chapter.id}
            className={`cursor-pointer transition-colors hover:bg-muted/50 ${
              selectedChapterId === chapter.id ? "border-primary bg-primary/5" : ""
            }`}
            onClick={() => onSelectChapter(chapter)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                    {getIcon(chapter.icon)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {chapter.order_index}.
                      </span>
                      <span className="font-medium">{chapter.title}</span>
                      {chapter.is_new && (
                        <Badge variant="secondary" className="text-xs">
                          Novo
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{chapter.slug}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => openEditDialog(chapter, e)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!editingChapter} onOpenChange={(open) => !open && setEditingChapter(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Capítulo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Ícone (nome Lucide)</Label>
              <Input
                value={editForm.icon}
                onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })}
                placeholder="Ex: Home, FileText, Shield"
              />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Preview:</span>
                {getIcon(editForm.icon)}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Marcar como "Novo"</Label>
              <Switch
                checked={editForm.is_new}
                onCheckedChange={(checked) => setEditForm({ ...editForm, is_new: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingChapter(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
