import { HelpFaq } from "@/hooks/useHelpContent";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

interface HelpFAQProps {
  faqs: HelpFaq[];
}

export function HelpFAQ({ faqs }: HelpFAQProps) {
  if (faqs.length === 0) return null;

  return (
    <div id="faq">
      <div className="flex items-center gap-2 mb-4">
        <HelpCircle className="h-5 w-5 text-amber-500" />
        <h3 className="text-lg font-semibold text-foreground">
          Perguntas Frequentes
        </h3>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, index) => (
          <AccordionItem key={faq.id} value={`faq-${index}`}>
            <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground prose prose-sm max-w-none">
              <div
                dangerouslySetInnerHTML={{
                  __html: faq.answer
                    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
                    .replace(/\*([^*]+)\*/g, "<em>$1</em>"),
                }}
              />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
