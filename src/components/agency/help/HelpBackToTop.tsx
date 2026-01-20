import { cn } from "@/lib/utils";
import { ArrowUp } from "lucide-react";

interface HelpBackToTopProps {
  visible: boolean;
  onClick: () => void;
}

export function HelpBackToTop({ visible, onClick }: HelpBackToTopProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed bottom-20 right-4 lg:bottom-8 lg:right-8 z-30",
        "w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg",
        "flex items-center justify-center",
        "hover:bg-primary/90 transition-all duration-300",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}
      aria-label="Voltar ao topo"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
