import { useState } from "react";
import { cn } from "@/lib/utils";
import { HelpChapterWithSections } from "@/hooks/useHelpContent";
import { HelpNewBadge } from "./HelpNewBadge";
import { ChevronDown, ChevronRight } from "lucide-react";
import * as Icons from "lucide-react";

interface HelpSidebarProps {
  chapters: HelpChapterWithSections[];
  activeChapterSlug?: string;
  activeSectionSlug?: string;
  onNavigate: (chapterSlug: string, sectionSlug?: string) => void;
}

export function HelpSidebar({
  chapters,
  activeChapterSlug,
  activeSectionSlug,
  onNavigate,
}: HelpSidebarProps) {
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(
    new Set([activeChapterSlug || ""])
  );
  const [allExpanded, setAllExpanded] = useState(false);

  const toggleChapter = (slug: string) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (allExpanded) {
      setExpandedChapters(new Set());
      setAllExpanded(false);
    } else {
      setExpandedChapters(new Set(chapters.map((c) => c.slug)));
      setAllExpanded(true);
    }
  };

  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
    return IconComponent || Icons.BookOpen;
  };

  // Icon color by chapter index
  const getIconColor = (index: number) => {
    const colors = [
      "text-blue-500",
      "text-emerald-500",
      "text-violet-500",
      "text-orange-500",
      "text-cyan-500",
      "text-green-500",
      "text-blue-600",
      "text-amber-500",
      "text-red-500",
      "text-yellow-500",
      "text-indigo-500",
      "text-slate-500",
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Sumário
        </h2>
      </div>

      <nav className="space-y-1">
        {chapters.map((chapter, index) => {
          const isActive = chapter.slug === activeChapterSlug;
          const isExpanded = expandedChapters.has(chapter.slug);
          const Icon = getIcon(chapter.icon);
          const iconColor = getIconColor(index);

          return (
            <div key={chapter.id} className="group">
              <button
                onClick={() => {
                  onNavigate(chapter.slug);
                  if (!isExpanded) toggleChapter(chapter.slug);
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all",
                  "hover:bg-primary/5 hover:text-foreground",
                  isActive
                    ? "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                    : "text-muted-foreground"
                )}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleChapter(chapter.slug);
                  }}
                  className="p-0.5 hover:bg-muted rounded"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </button>

                <Icon className={cn("h-4 w-4", iconColor)} />
                <span className="flex-1 text-left truncate">{chapter.title}</span>
                
                {chapter.is_new && <HelpNewBadge />}
              </button>

              {/* Sections */}
              {isExpanded && chapter.sections.length > 0 && (
                <div className="ml-6 mt-1 space-y-0.5 border-l border-border pl-3">
                  {chapter.sections.map((section) => {
                    const isSectionActive =
                      isActive && section.slug === activeSectionSlug;

                    return (
                      <button
                        key={section.id}
                        onClick={() => onNavigate(chapter.slug, section.slug)}
                        className={cn(
                          "w-full text-left px-2 py-1.5 rounded text-xs transition-all",
                          "hover:bg-primary/5 hover:text-foreground",
                          isSectionActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              isSectionActive ? "bg-primary" : "bg-muted-foreground/30"
                            )}
                          />
                          <span className="truncate">{section.title}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Expand/Collapse all */}
      <div className="mt-6 pt-4 border-t">
        <button
          onClick={toggleAll}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {allExpanded ? "− Recolher tudo" : "+ Expandir tudo"}
        </button>
      </div>
    </div>
  );
}
