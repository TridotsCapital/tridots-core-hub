import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Edit, Trash2, Image, Lightbulb, AlertTriangle, Link2 } from "lucide-react";
import { HelpSection, extractPlaceholders } from "@/hooks/useHelpAdmin";

interface SortableSectionItemProps {
  section: HelpSection;
  onEdit: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onSelectMedia: () => void;
}

export function SortableSectionItem({
  section,
  onEdit,
  onDelete,
  onSelectMedia,
}: SortableSectionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  const placeholders = extractPlaceholders(section.content);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`hover:bg-muted/30 transition-colors ${isDragging ? "shadow-lg" : ""}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {/* Drag Handle */}
            <button
              {...listeners}
              {...attributes}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded mt-1 touch-none"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </button>

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
          </div>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={onSelectMedia}
            >
              <Image className="h-4 w-4 mr-1" />
              Mídia
            </Button>
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-1" />
              Editar
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pl-12">
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
}
