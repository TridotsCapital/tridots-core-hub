import { useState, useEffect, useRef, ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { HelpSidebar } from "./HelpSidebar";
import { HelpSearchBar } from "./HelpSearchBar";
import { HelpProgressBar } from "./HelpProgressBar";
import { HelpMobileMenu } from "./HelpMobileMenu";
import { HelpBackToTop } from "./HelpBackToTop";
import { HelpMobileNav } from "./HelpMobileNav";
import { HelpChapterWithSections } from "@/hooks/useHelpContent";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface HelpLayoutProps {
  chapters: HelpChapterWithSections[];
  children: ReactNode;
  activeChapterSlug?: string;
  activeSectionSlug?: string;
  onNavigate: (chapterSlug: string, sectionSlug?: string) => void;
  lastUpdated?: string;
}

export function HelpLayout({
  chapters,
  children,
  activeChapterSlug,
  activeSectionSlug,
  onNavigate,
  lastUpdated,
}: HelpLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Calculate reading progress
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
        const scrollPercentage = (scrollTop / (scrollHeight - clientHeight)) * 100;
        setProgress(Math.min(100, Math.max(0, scrollPercentage)));
        setShowBackToTop(scrollTop > 500);
      }
    };

    const contentElement = contentRef.current;
    if (contentElement) {
      contentElement.addEventListener("scroll", handleScroll);
      return () => contentElement.removeEventListener("scroll", handleScroll);
    }
  }, []);

  const scrollToTop = () => {
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const currentChapterIndex = chapters.findIndex(c => c.slug === activeChapterSlug);
  const prevChapter = currentChapterIndex > 0 ? chapters[currentChapterIndex - 1] : null;
  const nextChapter = currentChapterIndex < chapters.length - 1 ? chapters[currentChapterIndex + 1] : null;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header with search */}
      <div className="border-b bg-white sticky top-0 z-20">
        <div className="flex items-center gap-4 px-4 py-3">
          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 -ml-2 hover:bg-muted rounded-lg"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground">Central de Ajuda</h1>
          </div>

          <div className="w-64 hidden sm:block">
            <HelpSearchBar onSelect={(result) => onNavigate(result.chapterSlug, result.sectionSlug)} />
          </div>
        </div>

        {/* Progress bar */}
        <HelpProgressBar progress={progress} />
      </div>

      {/* Mobile search (below header on mobile) */}
      <div className="sm:hidden px-4 py-2 border-b bg-white">
        <HelpSearchBar onSelect={(result) => onNavigate(result.chapterSlug, result.sectionSlug)} />
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-72 border-r bg-slate-50/50 overflow-y-auto">
          <HelpSidebar
            chapters={chapters}
            activeChapterSlug={activeChapterSlug}
            activeSectionSlug={activeSectionSlug}
            onNavigate={onNavigate}
          />
        </aside>

        {/* Mobile Sidebar (drawer) */}
        <HelpMobileMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          chapters={chapters}
          activeChapterSlug={activeChapterSlug}
          activeSectionSlug={activeSectionSlug}
          onNavigate={(chapterSlug, sectionSlug) => {
            onNavigate(chapterSlug, sectionSlug);
            setIsMobileMenuOpen(false);
          }}
        />

        {/* Content area */}
        <main ref={contentRef} className="flex-1 overflow-y-auto pb-20 lg:pb-8">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Last updated */}
            {lastUpdated && (
              <p className="text-xs text-muted-foreground mb-4">
                Última atualização: {format(new Date(lastUpdated), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            )}

            {children}

            {/* Navigation buttons */}
            <div className="hidden lg:flex justify-between items-center mt-12 pt-6 border-t">
              {prevChapter ? (
                <button
                  onClick={() => onNavigate(prevChapter.slug)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>{prevChapter.title}</span>
                </button>
              ) : <div />}

              {nextChapter && (
                <button
                  onClick={() => onNavigate(nextChapter.slug)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>{nextChapter.title}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Back to top button */}
      <HelpBackToTop visible={showBackToTop} onClick={scrollToTop} />

      {/* Mobile bottom navigation */}
      <HelpMobileNav
        prevChapter={prevChapter}
        nextChapter={nextChapter}
        onNavigate={onNavigate}
        onOpenMenu={() => setIsMobileMenuOpen(true)}
      />
    </div>
  );
}
