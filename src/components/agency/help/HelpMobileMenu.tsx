import { cn } from "@/lib/utils";
import { HelpChapterWithSections } from "@/hooks/useHelpContent";
import { HelpSidebar } from "./HelpSidebar";
import { X } from "lucide-react";

interface HelpMobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: HelpChapterWithSections[];
  activeChapterSlug?: string;
  activeSectionSlug?: string;
  onNavigate: (chapterSlug: string, sectionSlug?: string) => void;
}

export function HelpMobileMenu({
  isOpen,
  onClose,
  chapters,
  activeChapterSlug,
  activeSectionSlug,
  onNavigate,
}: HelpMobileMenuProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed left-0 top-0 bottom-0 w-72 bg-white z-50 lg:hidden",
          "transform transition-transform duration-300 ease-in-out",
          "overflow-y-auto shadow-xl",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
          <h2 className="font-semibold">Central de Ajuda</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sidebar content */}
        <HelpSidebar
          chapters={chapters}
          activeChapterSlug={activeChapterSlug}
          activeSectionSlug={activeSectionSlug}
          onNavigate={onNavigate}
        />
      </div>
    </>
  );
}
