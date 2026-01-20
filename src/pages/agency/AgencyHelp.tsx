import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AgencyLayout } from "@/components/layout/AgencyLayout";
import { HelpLayout } from "@/components/agency/help/HelpLayout";
import { HelpChapter } from "@/components/agency/help/HelpChapter";
import { useHelpFullContent } from "@/hooks/useHelpContent";
import { Skeleton } from "@/components/ui/skeleton";

export default function AgencyHelp() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeChapterSlug = searchParams.get("cap") || undefined;
  const activeSectionSlug = searchParams.get("sec") || undefined;
  
  const { data: chaptersWithSections = [], isLoading } = useHelpFullContent();

  // Find the active chapter
  const activeChapter = chaptersWithSections.find(c => c.slug === activeChapterSlug) || chaptersWithSections[0];

  // Navigate to a chapter/section
  const handleNavigate = (chapterSlug: string, sectionSlug?: string) => {
    const params = new URLSearchParams();
    params.set("cap", chapterSlug);
    if (sectionSlug) {
      params.set("sec", sectionSlug);
    }
    setSearchParams(params);

    // Scroll to section if specified
    if (sectionSlug) {
      setTimeout(() => {
        const element = document.getElementById(sectionSlug);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  };

  // Set default chapter on first load
  useEffect(() => {
    if (chaptersWithSections.length > 0 && !activeChapterSlug) {
      setSearchParams({ cap: chaptersWithSections[0].slug });
    }
  }, [chaptersWithSections, activeChapterSlug, setSearchParams]);

  // Get the last updated date from sections
  const lastUpdated = activeChapter?.sections.length > 0
    ? activeChapter.sections.reduce((latest, section) => {
        const sectionDate = new Date(section.updated_at);
        return sectionDate > new Date(latest) ? section.updated_at : latest;
      }, activeChapter.sections[0].updated_at)
    : undefined;

  return (
    <AgencyLayout title="Central de Ajuda" description="Aprenda a usar todas as funcionalidades do portal">
      {isLoading ? (
        <div className="flex h-full">
          <div className="w-72 border-r p-4 space-y-4 hidden lg:block">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
          <div className="flex-1 p-8 space-y-6">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      ) : (
        <HelpLayout
          chapters={chaptersWithSections}
          activeChapterSlug={activeChapter?.slug}
          activeSectionSlug={activeSectionSlug}
          onNavigate={handleNavigate}
          lastUpdated={lastUpdated}
        >
          {activeChapter && (
            <HelpChapter
              chapter={activeChapter}
              activeSectionSlug={activeSectionSlug}
              onNavigate={handleNavigate}
            />
          )}
        </HelpLayout>
      )}
    </AgencyLayout>
  );
}
