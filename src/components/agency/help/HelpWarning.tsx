import { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface HelpWarningProps {
  children: ReactNode;
}

export function HelpWarning({ children }: HelpWarningProps) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
      <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
      <div className="text-sm text-amber-800">{children}</div>
    </div>
  );
}
