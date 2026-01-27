import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useHelpAdminChapters,
  useUpdateHelpChapter,
  useCreateHelpChapter,
  useDeleteHelpChapter,
  useReorderHelpChapters,
  HelpChapter,
} from "@/hooks/useHelpAdmin";
import { SortableChapterItem } from "./SortableChapterItem";
import * as Icons from "lucide-react";
import { Loader2, Plus } from "lucide-react";

interface HelpChapterListProps {
  onSelectChapter: (chapter: HelpChapter) => void;
  selectedChapterId?: string;
}

export function HelpChapterList({ onSelectChapter, selectedChapterId }: HelpChapterListProps) {
  const { data: chapters, isLoading } = useHelpAdminChapters();
  const updateMutation = useUpdateHelpChapter();
  const createMutation = useCreateHelpChapter();
  const deleteMutation = useDeleteHelpChapter();
  const reorderMutation = useReorderHelpChapters();

  const [editingChapter, setEditingChapter] = useState<HelpChapter | null>(null);
  const [editForm, setEditForm] = useState({ title: "", icon: "", is_new: false });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ title: "", icon: "FileText", is_new: false });
  const [chapterToDelete, setChapterToDelete] = useState<HelpChapter | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleCreate = async () => {
    if (!createForm.title.trim()) return;
    await createMutation.mutateAsync({
      title: createForm.title,
      icon: createForm.icon,
      is_new: createForm.is_new,
    });
    setIsCreateDialogOpen(false);
    setCreateForm({ title: "", icon: "FileText", is_new: false });
  };

  const handleDelete = async () => {
    if (!chapterToDelete) return;
    await deleteMutation.mutateAsync(chapterToDelete.id);
    setChapterToDelete(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !chapters) return;

    const oldIndex = chapters.findIndex((ch) => ch.id === active.id);
    const newIndex = chapters.findIndex((ch) => ch.id === over.id);
    const reordered = arrayMove(chapters, oldIndex, newIndex);

    reorderMutation.mutate(
      reordered.map((ch, idx) => ({ id: ch.id, order_index: idx + 1 }))
    );
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
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Capítulo
          </Button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={chapters?.map((ch) => ch.id) || []}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {chapters?.map((chapter) => (
                <SortableChapterItem
                  key={chapter.id}
                  chapter={chapter}
                  isSelected={selectedChapterId === chapter.id}
                  onSelect={() => onSelectChapter(chapter)}
                  onEdit={(e) => openEditDialog(chapter, e)}
                  onDelete={(e) => {
                    e.stopPropagation();
                    setChapterToDelete(chapter);
                  }}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Edit Chapter Dialog */}
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

      {/* Create Chapter Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Capítulo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                placeholder="Ex: Configurações Avançadas"
              />
            </div>
            <div className="space-y-2">
              <Label>Ícone (nome Lucide)</Label>
              <Input
                value={createForm.icon}
                onChange={(e) => setCreateForm({ ...createForm, icon: e.target.value })}
                placeholder="Ex: Settings, FileText, Shield"
              />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Preview:</span>
                {getIcon(createForm.icon)}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Marcar como "Novo"</Label>
              <Switch
                checked={createForm.is_new}
                onCheckedChange={(checked) => setCreateForm({ ...createForm, is_new: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending || !createForm.title.trim()}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Capítulo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!chapterToDelete} onOpenChange={(open) => !open && setChapterToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir capítulo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O capítulo "{chapterToDelete?.title}" 
              será removido permanentemente.
              <br /><br />
              <strong>Atenção:</strong> Capítulos com seções não podem ser excluídos. 
              Exclua as seções primeiro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
