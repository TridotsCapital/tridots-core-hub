import { ArrowRight } from "lucide-react";

interface HelpSeeAlsoProps {
  items: Array<{ title: string; slug: string }>;
  onNavigate: (chapterSlug: string, sectionSlug?: string) => void;
}

export function HelpSeeAlso({ items, onNavigate }: HelpSeeAlsoProps) {
  if (items.length === 0) return null;

  return (
    <div className="mt-8 pt-6 border-t">
      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Veja Também
      </h4>
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => {
          const [chapterSlug, sectionSlug] = item.slug.includes('#') 
            ? item.slug.split('#') 
            : [item.slug, undefined];
          
          return (
            <button
              key={index}
              onClick={() => onNavigate(chapterSlug, sectionSlug)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <span>{item.title}</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
