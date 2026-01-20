import { ReactNode } from "react";
import { Lightbulb } from "lucide-react";

interface HelpTipProps {
  children: ReactNode;
}

export function HelpTip({ children }: HelpTipProps) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
      <Lightbulb className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
      <div className="text-sm text-emerald-800">{children}</div>
    </div>
  );
}
