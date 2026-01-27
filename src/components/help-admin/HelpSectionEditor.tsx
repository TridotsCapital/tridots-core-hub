import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
  useHelpAdminSections,
  useUpdateHelpSection,
  useCreateHelpSection,
  useDeleteHelpSection,
  useReorderHelpSections,
  HelpChapter,
  HelpSection,
  extractPlaceholders,
} from "@/hooks/useHelpAdmin";
import { SortableSectionItem } from "./SortableSectionItem";
import { Edit, Save, Loader2, Image, FileText, ArrowLeft, Lightbulb, AlertTriangle, Link2, X, Plus } from "lucide-react";

interface HelpSectionEditorProps {
  chapter: HelpChapter;
  onBack: () => void;
  onSelectSection: (section: HelpSection) => void;
}

export function HelpSectionEditor({ chapter, onBack, onSelectSection }: HelpSectionEditorProps) {
  const { data: sections, isLoading } = useHelpAdminSections(chapter.id);
  const updateMutation = useUpdateHelpSection();
  const createMutation = useCreateHelpSection();
  const deleteMutation = useDeleteHelpSection();
  const reorderMutation = useReorderHelpSections();

  const [editingSection, setEditingSection] = useState<HelpSection | null>(null);
  const [editForm, setEditForm] = useState<{
    title: string;
    content: string;
    tips: string[];
    warnings: string[];
  }>({
    title: "",
    content: "",
    tips: [],
    warnings: [],
  });

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ title: "", content: "" });
  const [sectionToDelete, setSectionToDelete] = useState<HelpSection | null>(null);

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

  const openEditDialog = (section: HelpSection) => {
    setEditingSection(section);
    setEditForm({
      title: section.title,
      content: section.content,
      tips: section.tips || [],
      warnings: section.warnings || [],
    });
  };

  const handleSave = async () => {
    if (!editingSection) return;
    await updateMutation.mutateAsync({
      id: editingSection.id,
      title: editForm.title,
      content: editForm.content,
      tips: editForm.tips.filter(Boolean),
      warnings: editForm.warnings.filter(Boolean),
    });
    setEditingSection(null);
  };

  const handleCreate = async () => {
    if (!createForm.title.trim()) return;
    await createMutation.mutateAsync({
      chapter_id: chapter.id,
      title: createForm.title,
      content: createForm.content,
    });
    setIsCreateDialogOpen(false);
    setCreateForm({ title: "", content: "" });
  };

  const handleDelete = async () => {
    if (!sectionToDelete) return;
    await deleteMutation.mutateAsync(sectionToDelete.id);
    setSectionToDelete(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !sections) return;

    const oldIndex = sections.findIndex((sec) => sec.id === active.id);
    const newIndex = sections.findIndex((sec) => sec.id === over.id);
    const reordered = arrayMove(sections, oldIndex, newIndex);

    reorderMutation.mutate(
      reordered.map((sec, idx) => ({ id: sec.id, order_index: idx + 1 }))
    );
  };

  const addTip = () => setEditForm({ ...editForm, tips: [...editForm.tips, ""] });
  const removeTip = (index: number) =>
    setEditForm({ ...editForm, tips: editForm.tips.filter((_, i) => i !== index) });
  const updateTip = (index: number, value: string) => {
    const newTips = [...editForm.tips];
    newTips[index] = value;
    setEditForm({ ...editForm, tips: newTips });
  };

  const addWarning = () => setEditForm({ ...editForm, warnings: [...editForm.warnings, ""] });
  const removeWarning = (index: number) =>
    setEditForm({ ...editForm, warnings: editForm.warnings.filter((_, i) => i !== index) });
  const updateWarning = (index: number, value: string) => {
    const newWarnings = [...editForm.warnings];
    newWarnings[index] = value;
    setEditForm({ ...editForm, warnings: newWarnings });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h3 className="text-lg font-semibold">{chapter.title}</h3>
              <p className="text-sm text-muted-foreground">
                {sections?.length || 0} seções
              </p>
            </div>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Seção
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-300px)]">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sections?.map((sec) => sec.id) || []}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3 pr-4">
                {sections?.map((section) => (
                  <SortableSectionItem
                    key={section.id}
                    section={section}
                    onEdit={() => openEditDialog(section)}
                    onDelete={(e) => {
                      e.stopPropagation();
                      setSectionToDelete(section);
                    }}
                    onSelectMedia={() => onSelectSection(section)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </ScrollArea>
      </div>

      {/* Edit Section Dialog */}
      <Dialog open={!!editingSection} onOpenChange={(open) => !open && setEditingSection(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Editar Seção: {editingSection?.title}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-150px)] pr-4">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Conteúdo (Markdown)</Label>
                <Textarea
                  value={editForm.content}
                  onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                  rows={15}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Use [[screenshot:nome-do-placeholder]] para adicionar placeholders de imagem
                </p>
              </div>

              <Accordion type="multiple" className="w-full">
                <AccordionItem value="tips">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                      Dicas ({editForm.tips.length})
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {editForm.tips.map((tip, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={tip}
                            onChange={(e) => updateTip(index, e.target.value)}
                            placeholder="Texto da dica..."
                          />
                          <Button variant="ghost" size="icon" onClick={() => removeTip(index)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={addTip}>
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar Dica
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="warnings">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      Alertas ({editForm.warnings.length})
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {editForm.warnings.map((warning, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={warning}
                            onChange={(e) => updateWarning(index, e.target.value)}
                            placeholder="Texto do alerta..."
                          />
                          <Button variant="ghost" size="icon" onClick={() => removeWarning(index)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={addWarning}>
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar Alerta
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSection(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Section Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Seção</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                placeholder="Ex: Como configurar notificações"
              />
            </div>
            <div className="space-y-2">
              <Label>Conteúdo Inicial (opcional)</Label>
              <Textarea
                value={createForm.content}
                onChange={(e) => setCreateForm({ ...createForm, content: e.target.value })}
                placeholder="Escreva o conteúdo em Markdown..."
                rows={5}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending || !createForm.title.trim()}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Seção
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!sectionToDelete} onOpenChange={(open) => !open && setSectionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir seção?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A seção "{sectionToDelete?.title}" 
              e todas as mídias associadas serão removidas permanentemente.
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
