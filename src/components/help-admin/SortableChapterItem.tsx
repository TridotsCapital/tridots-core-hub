import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Edit, Trash2, ChevronRight } from "lucide-react";
import * as Icons from "lucide-react";
import { HelpChapter } from "@/hooks/useHelpAdmin";

interface SortableChapterItemProps {
  chapter: HelpChapter;
  isSelected?: boolean;
  onSelect: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

export function SortableChapterItem({
  chapter,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: SortableChapterItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chapter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
    return IconComponent ? <IconComponent className="h-5 w-5" /> : <Icons.FileText className="h-5 w-5" />;
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`cursor-pointer transition-colors hover:bg-muted/50 ${
        isSelected ? "border-primary bg-primary/5" : ""
      } ${isDragging ? "shadow-lg" : ""}`}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Drag Handle */}
            <button
              {...listeners}
              {...attributes}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded touch-none"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </button>

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
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              className="h-8 w-8"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <ChevronRight className="h-4 w-4 text-muted-foreground ml-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
