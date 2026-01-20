import { HelpChapterWithSections } from "@/hooks/useHelpContent";
import { HelpSection } from "./HelpSection";
import { HelpFAQ } from "./HelpFAQ";
import { HelpFeedback } from "./HelpFeedback";
import { HelpCopyLink } from "./HelpCopyLink";
import { HelpNewBadge } from "./HelpNewBadge";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";

interface HelpChapterProps {
  chapter: HelpChapterWithSections;
  activeSectionSlug?: string;
  onNavigate: (chapterSlug: string, sectionSlug?: string) => void;
}

export function HelpChapter({ chapter, activeSectionSlug, onNavigate }: HelpChapterProps) {
  const Icon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[chapter.icon] || Icons.BookOpen;

  // Get icon color based on chapter order
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
    return colors[(index - 1) % colors.length];
  };

  return (
    <div>
      {/* Chapter header */}
      <div className="flex items-start gap-3 mb-6" id={`cap-${chapter.slug}`}>
        <div className={cn("p-2 rounded-lg bg-primary/5")}>
          <Icon className={cn("h-6 w-6", getIconColor(chapter.order_index))} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground">
              {chapter.order_index}. {chapter.title}
            </h1>
            {chapter.is_new && <HelpNewBadge />}
            <HelpCopyLink slug={chapter.slug} />
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-10">
        {chapter.sections.map((section) => (
          <HelpSection
            key={section.id}
            section={section}
            chapterSlug={chapter.slug}
            isActive={section.slug === activeSectionSlug}
            onNavigate={onNavigate}
          />
        ))}
      </div>

      {/* FAQs */}
      {chapter.faqs.length > 0 && (
        <div className="mt-12">
          <HelpFAQ faqs={chapter.faqs} />
        </div>
      )}

      {/* Feedback */}
      {chapter.sections.length > 0 && (
        <div className="mt-10">
          <HelpFeedback sectionId={chapter.sections[0].id} />
        </div>
      )}
    </div>
  );
}
