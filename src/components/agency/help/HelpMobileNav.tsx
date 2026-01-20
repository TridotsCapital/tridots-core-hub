import { HelpChapter } from "@/hooks/useHelpContent";
import { ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HelpMobileNavProps {
  prevChapter: HelpChapter | null;
  nextChapter: HelpChapter | null;
  onNavigate: (chapterSlug: string) => void;
  onOpenMenu: () => void;
}

export function HelpMobileNav({
  prevChapter,
  nextChapter,
  onNavigate,
  onOpenMenu,
}: HelpMobileNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t lg:hidden z-30">
      <div className="flex items-center justify-between h-14 px-2">
        <Button
          variant="ghost"
          size="sm"
          disabled={!prevChapter}
          onClick={() => prevChapter && onNavigate(prevChapter.slug)}
          className="flex-1 justify-start"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          <span className="truncate text-xs">
            {prevChapter ? "Anterior" : ""}
          </span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenMenu}
          className="px-4"
        >
          <Menu className="h-4 w-4 mr-1" />
          <span className="text-xs">Sumário</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          disabled={!nextChapter}
          onClick={() => nextChapter && onNavigate(nextChapter.slug)}
          className="flex-1 justify-end"
        >
          <span className="truncate text-xs">
            {nextChapter ? "Próximo" : ""}
          </span>
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
