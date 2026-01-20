import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { useHelpFeedback } from "@/hooks/useHelpContent";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface HelpFeedbackProps {
  sectionId: string;
}

export function HelpFeedback({ sectionId }: HelpFeedbackProps) {
  const [submitted, setSubmitted] = useState<boolean | null>(null);
  const { submitFeedback } = useHelpFeedback();

  const handleFeedback = async (isHelpful: boolean) => {
    try {
      await submitFeedback.mutateAsync({ sectionId, isHelpful });
      setSubmitted(isHelpful);
      toast.success("Obrigado pelo feedback!");
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Erro ao enviar feedback");
    }
  };

  if (submitted !== null) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <span>✓ Obrigado pelo seu feedback!</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 py-4 border-t">
      <span className="text-sm text-muted-foreground">
        Este artigo foi útil?
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleFeedback(true)}
          disabled={submitFeedback.isPending}
          className={cn(
            "p-2 rounded-lg border transition-colors",
            "hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600"
          )}
        >
          <ThumbsUp className="h-4 w-4" />
        </button>
        <button
          onClick={() => handleFeedback(false)}
          disabled={submitFeedback.isPending}
          className={cn(
            "p-2 rounded-lg border transition-colors",
            "hover:bg-red-50 hover:border-red-200 hover:text-red-600"
          )}
        >
          <ThumbsDown className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
