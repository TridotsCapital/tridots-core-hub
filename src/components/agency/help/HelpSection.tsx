import { HelpSection as HelpSectionType } from "@/hooks/useHelpContent";
import { HelpTip } from "./HelpTip";
import { HelpWarning } from "./HelpWarning";
import { HelpPortalLink } from "./HelpPortalLink";
import { HelpSeeAlso } from "./HelpSeeAlso";
import { HelpCopyLink } from "./HelpCopyLink";
import { HelpScreenshotPlaceholder } from "./HelpScreenshotPlaceholder";
import { cn } from "@/lib/utils";

interface HelpSectionProps {
  section: HelpSectionType;
  chapterSlug: string;
  isActive: boolean;
  onNavigate: (chapterSlug: string, sectionSlug?: string) => void;
}

export function HelpSection({ section, chapterSlug, isActive, onNavigate }: HelpSectionProps) {
  // Parse content and replace screenshot placeholders
  const renderContent = (content: string) => {
    const parts = content.split(/\[SCREENSHOT:\s*([^\]]+)\]/g);
    
    return parts.map((part, index) => {
      // Odd indices are the screenshot IDs
      if (index % 2 === 1) {
        return (
          <HelpScreenshotPlaceholder
            key={index}
            placeholderId={part.trim()}
            sectionId={section.id}
          />
        );
      }
      
      // Render markdown-like content
      return (
        <div key={index} className="prose prose-sm max-w-none prose-headings:font-semibold prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary">
          {renderMarkdown(part)}
        </div>
      );
    });
  };

  // Simple markdown renderer
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    let currentList: string[] = [];
    let listType: 'ul' | 'ol' | null = null;
    let inTable = false;
    let tableRows: string[][] = [];

    const flushList = () => {
      if (currentList.length > 0) {
        const ListTag = listType === 'ol' ? 'ol' : 'ul';
        elements.push(
          <ListTag key={elements.length} className={cn(listType === 'ol' ? 'list-decimal' : 'list-disc', 'ml-4 space-y-1')}>
            {currentList.map((item, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(item) }} />
            ))}
          </ListTag>
        );
        currentList = [];
        listType = null;
      }
    };

    const flushTable = () => {
      if (tableRows.length > 0) {
        elements.push(
          <div key={elements.length} className="overflow-x-auto my-4">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  {tableRows[0]?.map((cell, i) => (
                    <th key={i} className="px-3 py-2 text-left font-semibold">{cell.trim()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.slice(2).map((row, i) => (
                  <tr key={i} className="border-b">
                    {row.map((cell, j) => (
                      <td key={j} className="px-3 py-2" dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(cell.trim()) }} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
        inTable = false;
      }
    };

    lines.forEach((line, lineIndex) => {
      // Table detection
      if (line.includes('|') && line.trim().startsWith('|')) {
        flushList();
        inTable = true;
        const cells = line.split('|').filter(c => c.trim() !== '');
        if (!line.includes('---')) {
          tableRows.push(cells);
        }
        return;
      } else if (inTable) {
        flushTable();
      }

      // Headers
      if (line.startsWith('## ')) {
        flushList();
        elements.push(
          <h3 key={lineIndex} className="text-lg font-semibold text-foreground mt-6 mb-2">
            {line.replace('## ', '')}
          </h3>
        );
        return;
      }

      if (line.startsWith('### ')) {
        flushList();
        elements.push(
          <h4 key={lineIndex} className="text-base font-semibold text-foreground mt-4 mb-2">
            {line.replace('### ', '')}
          </h4>
        );
        return;
      }

      // Ordered list
      if (/^\d+\.\s/.test(line)) {
        if (listType !== 'ol') {
          flushList();
          listType = 'ol';
        }
        currentList.push(line.replace(/^\d+\.\s/, ''));
        return;
      }

      // Unordered list
      if (/^[-*]\s/.test(line)) {
        if (listType !== 'ul') {
          flushList();
          listType = 'ul';
        }
        currentList.push(line.replace(/^[-*]\s/, ''));
        return;
      }

      // Empty line
      if (line.trim() === '') {
        flushList();
        return;
      }

      // Regular paragraph
      flushList();
      elements.push(
        <p key={lineIndex} className="mb-3" dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line) }} />
      );
    });

    flushList();
    flushTable();

    return elements;
  };

  // Format inline markdown (bold, italic, code)
  const formatInlineMarkdown = (text: string): string => {
    return text
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>');
  };

  const tips = Array.isArray(section.tips) ? section.tips : [];
  const warnings = Array.isArray(section.warnings) ? section.warnings : [];
  const seeAlso = Array.isArray(section.see_also) ? section.see_also : [];
  const portalLinks = Array.isArray(section.portal_links) ? section.portal_links : [];

  return (
    <section id={section.slug} className={cn("scroll-mt-20", isActive && "")}>
      {/* Section header */}
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl font-semibold text-foreground">{section.title}</h2>
        <HelpCopyLink slug={`${chapterSlug}#${section.slug}`} />
      </div>

      {/* Content */}
      <div className="space-y-4">
        {renderContent(section.content)}
      </div>

      {/* Tips */}
      {tips.length > 0 && (
        <div className="mt-6 space-y-2">
          {tips.map((tip, index) => (
            <HelpTip key={index}>{tip}</HelpTip>
          ))}
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="mt-6 space-y-2">
          {warnings.map((warning, index) => (
            <HelpWarning key={index}>{warning}</HelpWarning>
          ))}
        </div>
      )}

      {/* Portal links */}
      {portalLinks.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {portalLinks.map((link, index) => (
            <HelpPortalLink key={index} {...link} />
          ))}
        </div>
      )}

      {/* See also */}
      {seeAlso.length > 0 && (
        <HelpSeeAlso items={seeAlso} onNavigate={onNavigate} />
      )}
    </section>
  );
}
