import { useState, useEffect } from "react";
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
  useHelpAdminSections,
  useUpdateHelpSection,
  HelpChapter,
  HelpSection,
  extractPlaceholders,
} from "@/hooks/useHelpAdmin";
import { Edit, Save, Loader2, Image, FileText, ArrowLeft, Lightbulb, AlertTriangle, Link2, X, Plus } from "lucide-react";

interface HelpSectionEditorProps {
  chapter: HelpChapter;
  onBack: () => void;
  onSelectSection: (section: HelpSection) => void;
}

export function HelpSectionEditor({ chapter, onBack, onSelectSection }: HelpSectionEditorProps) {
  const { data: sections, isLoading } = useHelpAdminSections(chapter.id);
  const updateMutation = useUpdateHelpSection();
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

        <ScrollArea className="h-[calc(100vh-300px)]">
          <div className="space-y-3 pr-4">
            {sections?.map((section) => {
              const placeholders = extractPlaceholders(section.content);
              return (
                <Card key={section.id} className="hover:bg-muted/30 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {section.order_index}
                          </Badge>
                          <CardTitle className="text-base">{section.title}</CardTitle>
                        </div>
                        <CardDescription className="mt-1">
                          /{section.slug}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onSelectSection(section)}
                        >
                          <Image className="h-4 w-4 mr-1" />
                          Mídia
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(section)}>
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-2 text-xs">
                      {placeholders.length > 0 && (
                        <Badge variant="secondary" className="gap-1">
                          <Image className="h-3 w-3" />
                          {placeholders.length} placeholder(s)
                        </Badge>
                      )}
                      {section.tips && section.tips.length > 0 && (
                        <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-800">
                          <Lightbulb className="h-3 w-3" />
                          {section.tips.length} dica(s)
                        </Badge>
                      )}
                      {section.warnings && section.warnings.length > 0 && (
                        <Badge variant="secondary" className="gap-1 bg-red-100 text-red-800">
                          <AlertTriangle className="h-3 w-3" />
                          {section.warnings.length} alerta(s)
                        </Badge>
                      )}
                      {section.portal_links && section.portal_links.length > 0 && (
                        <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-800">
                          <Link2 className="h-3 w-3" />
                          {section.portal_links.length} atalho(s)
                        </Badge>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {section.content.substring(0, 150)}...
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </div>

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
    </>
  );
}
